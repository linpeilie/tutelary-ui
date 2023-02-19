package com.tutelary.repository.impl;

import com.tutelary.bean.domain.InstanceThreadStatistic;
import com.tutelary.bean.domain.query.StatisticQuery;
import com.tutelary.bean.entity.InstanceThreadStatisticEntity;
import com.tutelary.common.repository.AbstractRepository;
import com.tutelary.mapper.InstanceThreadStatisticMapper;
import com.tutelary.repository.InstanceThreadStatisticRepository;
import org.springframework.stereotype.Repository;

@Repository
public class InstanceThreadStatisticRepositoryImpl
    extends AbstractRepository<StatisticQuery, InstanceThreadStatistic, InstanceThreadStatisticEntity, InstanceThreadStatisticMapper>
    implements InstanceThreadStatisticRepository {


}