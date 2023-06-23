package com.tutelary.bean.resp;

import com.tutelary.bean.domain.CommandTask;
import com.tutelary.common.bean.resp.AbstractResponse;
import io.github.linpeilie.annotations.AutoMapper;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@AutoMapper(target = CommandTask.class)
public class CommandTaskResponse extends AbstractResponse {

    private Integer commandCode;

    private String instanceId;

    private String taskId;

    private String param;

    private LocalDateTime completeTime;

}
