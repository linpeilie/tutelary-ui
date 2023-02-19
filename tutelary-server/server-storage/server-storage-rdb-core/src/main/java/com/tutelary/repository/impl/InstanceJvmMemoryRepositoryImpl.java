package com.tutelary.repository.impl;

import com.tutelary.bean.domain.InstanceJvmMemory;
import com.tutelary.bean.domain.query.StatisticQuery;
import com.tutelary.bean.entity.InstanceJvmMemoryEntity;
import com.tutelary.common.repository.AbstractRepository;
import com.tutelary.mapper.InstanceJvmMemoryMapper;
import com.tutelary.repository.InstanceJvmMemoryRepository;
import org.springframework.stereotype.Repository;

@Repository
public class InstanceJvmMemoryRepositoryImpl
    extends AbstractRepository<StatisticQuery, InstanceJvmMemory, InstanceJvmMemoryEntity, InstanceJvmMemoryMapper>
    implements InstanceJvmMemoryRepository {

}