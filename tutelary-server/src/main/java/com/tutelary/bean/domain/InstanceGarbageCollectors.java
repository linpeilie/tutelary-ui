package com.tutelary.bean.domain;

import com.tutelary.common.bean.domain.BaseDomain;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class InstanceGarbageCollectors extends BaseDomain {

    private String instanceId;

    private String name;

    private Integer collectionCount;

    private Integer collectionTime;

    private List<String> memoryPoolNames;

    private LocalDateTime reportTime;

}