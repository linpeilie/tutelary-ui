package com.tutelary.bean.converter;

import com.tutelary.bean.domain.InstanceHost;
import com.tutelary.message.command.domain.HostInfo;
import java.time.LocalDateTime;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface InstanceHostConverter {

    InstanceHost hostToInstanceHost(HostInfo hostInfo, String instanceId, LocalDateTime reportTime);

}