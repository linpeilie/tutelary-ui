package com.tutelary.service.impl;

import com.tutelary.bean.domain.Instance;
import com.tutelary.bean.domain.InstanceGarbageCollectors;
import com.tutelary.bean.domain.InstanceHost;
import com.tutelary.bean.domain.InstanceJvmMemory;
import com.tutelary.bean.domain.InstanceOverview;
import com.tutelary.bean.domain.InstanceThreadStatistic;
import com.tutelary.bean.domain.query.InstanceQuery;
import com.tutelary.bean.domain.query.StatisticQuery;
import com.tutelary.common.bean.api.req.PageQueryRequest;
import com.tutelary.common.bean.api.resp.PageResult;
import com.tutelary.repository.InstanceGarbageCollectorsRepository;
import com.tutelary.repository.InstanceHostRepository;
import com.tutelary.repository.InstanceJvmMemoryRepository;
import com.tutelary.repository.InstanceRepository;
import com.tutelary.repository.InstanceThreadStatisticRepository;
import com.tutelary.service.InstanceService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InstanceServiceImpl implements InstanceService {

    private InstanceRepository instanceRepository;

    private InstanceHostRepository instanceHostRepository;

    private InstanceThreadStatisticRepository instanceThreadStatisticRepository;

    private InstanceJvmMemoryRepository instanceJvmMemoryRepository;

    private InstanceGarbageCollectorsRepository instanceGarbageCollectorsRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean addInstance(Instance instance) {
        Instance oldInstance =
            instanceRepository.getByInstanceId(instance.getInstanceId());
        if (oldInstance == null) {
            return instanceRepository.add(instance);
        } else {
            return instanceRepository.validedInstance(instance.getInstanceId());
        }
    }

    @Override
    public boolean invalidInstance(String instanceId) {
        return instanceRepository.invalidedInstance(instanceId);
    }

    @Override
    public Instance getInstanceByInstanceId(String instanceId) {
        return instanceRepository.getByInstanceId(instanceId);
    }

    @Override
    public PageResult<Instance> pageList(InstanceQuery instanceQuery, PageQueryRequest pageRequest) {
        return instanceRepository.pageList(instanceQuery, pageRequest);
    }

    @Override
    public List<Instance> list(InstanceQuery queryParam) {
        return instanceRepository.list(queryParam);
    }

    @Override
    public List<Instance> listEnabled() {
        return instanceRepository.listEnabled();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveReportData(InstanceOverview overview) {
        InstanceHost host = overview.getHost();
        InstanceHost instanceHost = instanceHostRepository.getByInstanceId(host.getInstanceId());
        if (instanceHost == null) {
            instanceHostRepository.add(host);
        } else {
            instanceHostRepository.update(instanceHost);
            ;
        }
        instanceThreadStatisticRepository.add(overview.getThreadStatistic());
        instanceJvmMemoryRepository.addAll(overview.getJvmMemories());
        instanceGarbageCollectorsRepository.addAll(overview.getGarbageCollectors());
    }

    @Override
    public List<InstanceHost> listHostInfo(StatisticQuery query) {
        return instanceHostRepository.list(query);
    }

    @Override
    public InstanceHost getHostInfo(String instanceId) {
        return instanceHostRepository.getByInstanceId(instanceId);
    }

    @Override
    public List<InstanceThreadStatistic> listThreadStatistics(StatisticQuery query) {
        return instanceThreadStatisticRepository.list(query);
    }

    @Override
    public List<InstanceJvmMemory> listJvmMemories(StatisticQuery query) {
        return instanceJvmMemoryRepository.list(query);
    }

    @Override
    public List<InstanceGarbageCollectors> listGarbageCollectors(StatisticQuery query) {
        return instanceGarbageCollectorsRepository.list(query);
    }

    /************************* setter *******************************/

    @Autowired
    public void setInstanceRepository(InstanceRepository instanceRepository) {
        this.instanceRepository = instanceRepository;
    }

    @Autowired
    public void setInstanceHostRepository(InstanceHostRepository instanceHostRepository) {
        this.instanceHostRepository = instanceHostRepository;
    }

    @Autowired
    public void setInstanceThreadStatisticRepository(InstanceThreadStatisticRepository instanceThreadStatisticRepository) {
        this.instanceThreadStatisticRepository = instanceThreadStatisticRepository;
    }

    @Autowired
    public void setInstanceJvmMemoryRepository(InstanceJvmMemoryRepository instanceJvmMemoryRepository) {
        this.instanceJvmMemoryRepository = instanceJvmMemoryRepository;
    }

    @Autowired
    public void setInstanceGarbageCollectorsRepository(InstanceGarbageCollectorsRepository instanceGarbageCollectorsRepository) {
        this.instanceGarbageCollectorsRepository = instanceGarbageCollectorsRepository;
    }
}
