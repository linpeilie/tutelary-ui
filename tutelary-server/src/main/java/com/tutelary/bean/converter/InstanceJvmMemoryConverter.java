package com.tutelary.bean.converter;

import com.tutelary.bean.domain.InstanceJvmMemory;
import com.tutelary.bean.entity.InstanceJvmMemoryEntity;
import com.tutelary.common.converter.EntityDomainConverter;
import com.tutelary.message.command.domain.JvmMemory;
import java.time.LocalDateTime;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface InstanceJvmMemoryConverter
    extends EntityDomainConverter<InstanceJvmMemoryEntity, InstanceJvmMemory> {

    InstanceJvmMemory jvmMemoryToDomain(JvmMemory jvmMemory, String instanceId, LocalDateTime reportTime, String type);

}
