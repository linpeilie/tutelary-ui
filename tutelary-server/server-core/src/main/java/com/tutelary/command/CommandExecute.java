package com.tutelary.command;

import com.tutelary.bean.domain.CommandTask;
import com.tutelary.common.CommandRequest;
import com.tutelary.common.CommandResponse;
import com.tutelary.common.extension.ExtensionPointI;
import com.tutelary.common.utils.ClassUtil;
import com.tutelary.message.CommandExecuteResponse;
import com.tutelary.remoting.api.Channel;

public interface CommandExecute<PARAM extends CommandRequest, RESPONSE extends CommandResponse>
    extends ExtensionPointI {

    CommandTask createCommand(String instanceId, PARAM request);

    void callResult(Channel channel, CommandExecuteResponse response);

    Integer commandCode();

    default Class<PARAM> getParamClass() {
        return ClassUtil.getGenericsBySuperClass(getClass(), CommandRequest.class);
    }

}
