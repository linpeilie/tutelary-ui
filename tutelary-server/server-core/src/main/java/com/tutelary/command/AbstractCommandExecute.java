package com.tutelary.command;

import cn.hutool.core.convert.Convert;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.baidu.bjf.remoting.protobuf.Any;
import com.tutelary.InstanceManager;
import com.tutelary.SessionStore;
import com.tutelary.bean.domain.CommandTask;
import com.tutelary.bean.domain.Instance;
import com.tutelary.common.CommandRequest;
import com.tutelary.common.CommandResponse;
import com.tutelary.common.constants.Constants;
import com.tutelary.common.exception.InstanceNotExistsException;
import com.tutelary.common.message.MessageManager;
import com.tutelary.common.utils.ClassUtil;
import com.tutelary.dao.CommandTaskDAO;
import com.tutelary.message.CommandCancelRequest;
import com.tutelary.message.CommandExecuteRequest;
import com.tutelary.message.CommandExecuteResponse;
import com.tutelary.remoting.api.Channel;
import com.tutelary.utils.AuthHelper;
import com.tutelary.utils.IdGeneratorHelper;
import java.io.IOException;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
public abstract class AbstractCommandExecute<PARAM extends CommandRequest, RESPONSE extends CommandResponse>
    implements CommandExecute<PARAM, RESPONSE> {

    private InstanceManager instanceManager;

    protected CommandTaskDAO commandTaskDAO;

    private MessageManager messageManager;

    private SessionStore sessionStore;

    protected CancelTaskBiz cancelTaskBiz;

    @Autowired
    public void setCommandTaskDAO(final CommandTaskDAO commandTaskDAO) {
        this.commandTaskDAO = commandTaskDAO;
    }

    @Autowired
    public void setInstanceManager(final InstanceManager instanceManager) {
        this.instanceManager = instanceManager;
    }

    @Autowired
    public void setMessageManager(final MessageManager messageManager) {
        this.messageManager = messageManager;
    }

    @Autowired
    public void setSessionStore(final SessionStore sessionStore) {
        this.sessionStore = sessionStore;
    }

    @Autowired
    public void setCancelTaskBiz(final CancelTaskBiz cancelTaskBiz) {
        this.cancelTaskBiz = cancelTaskBiz;
    }

    @Override
    public CommandTask createCommand(String instanceId, PARAM request) {
        Optional<Instance> instanceOptional = instanceManager.getInstance(instanceId);
        if (!instanceOptional.isPresent()) {
            throw new InstanceNotExistsException(instanceId);
        }
        try {
            String taskId = generateTaskId();

            // 任务持久化
            final CommandTask commandTask = commandTaskPersistence(instanceId, taskId, request);

            CommandExecuteRequest commandExecuteRequest = CommandExecuteRequest.builder()
                .taskId(taskId)
                .code(commandCode())
                .param(Any.pack(request))
                .build();

            // send to client
            instanceOptional.get().sendData(commandExecuteRequest);

            return commandTask;
        } catch (IOException e) {
            // TODO:
            throw new RuntimeException(e);
        }
    }

    @Override
    public void callResult(Channel channel, CommandExecuteResponse response) {
        Object instanceId = channel.getAttribute(Constants.ChannelAttributeConstants.INSTANCE_ID);
        String taskId = response.getTaskId();
        if (StrUtil.isBlankIfStr(instanceId)) {
            log.warn("call result occur error, instance id is null, task id : {}", taskId);
            // TODO:
            return;
        }

        CommandTask commandTask = commandTaskDAO.getByTaskId(taskId);
        if (commandTask == null) {
            log.warn("call result failed, command task not exists, taskId : {}", taskId);
            // TODO:
            return;
        }

        Any data = response.getData();
        try {
            RESPONSE result = data.unpack(getResponseClass());
            callResult(Convert.toStr(instanceId), taskId, result);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        // 通知用户
        final String createUserId = commandTask.getCreateUserId();
        if (StrUtil.isNotEmpty(createUserId)) {
            final String token = AuthHelper.getTokenByUserId(createUserId);
            if (StrUtil.isNotEmpty(token)) {
                if (sessionStore.containsSessionByToken(token)) {
                    sessionStore.sendMessage(token, response);
                } else {
                    messageManager.publish(Constants.Topic.TASK_CALLBACK_NOTIFY_USER, response);
                }
            }
        }
    }

    protected abstract void callResult(String instanceId, String taskId, RESPONSE response);

    private String generateTaskId() {
        return IdGeneratorHelper.getId();
    }

    private CommandTask commandTaskPersistence(String instanceId, String taskId, PARAM param) {
        CommandTask commandTask = new CommandTask();
        commandTask.setInstanceId(instanceId);
        commandTask.setTaskId(taskId);
        commandTask.setParam(JSONUtil.toJsonStr(param));
        commandTask.setCommandCode(commandCode());
        commandTask.setCreateUserId(AuthHelper.getUserId());
        commandTask.setUpdateUserId(AuthHelper.getUserId());
        commandTaskDAO.add(commandTask);
        return commandTask;
    }

    protected Class<RESPONSE> getResponseClass() {
        return ClassUtil.getGenericsBySuperClass(getClass(), CommandResponse.class);
    }

    protected void taskComplete(String taskId) {
        commandTaskDAO.commandTaskComplete(taskId);
    }

}
