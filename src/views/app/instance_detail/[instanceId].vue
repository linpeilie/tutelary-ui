<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fetchInstanceDetail } from '@/service/api/instance';
import { $t } from '@/locales';
import InstanceInfoCard from '@/views/app/instance_detail/modules/instance-info-card.vue';
import DashboardTab from '@/views/app/instance_detail/modules/dashboard-tab.vue';
import SystemTab from '@/views/app/instance_detail/modules/system-tab.vue';
import ThreadTab from '@/views/app/instance_detail/modules/thread-tab.vue';
import JvmMemoryTab from '@/views/app/instance_detail/modules/jvm-memory-tab.vue';
import JadTab from '@/views/app/instance_detail/modules/jad-tab.vue';
import VmOptionTab from '@/views/app/instance_detail/modules/vm-option-tab.vue';
import LoggerTab from '@/views/app/instance_detail/modules/logger-tab.vue';
import TraceTab from '@/views/app/instance_detail/modules/trace-tab.vue';
import StackTab from '@/views/app/instance_detail/modules/stack-tab.vue';
import WatchTab from '@/views/app/instance_detail/modules/watch-tab.vue';
import MonitorTab from '@/views/app/instance_detail/modules/monitor-tab.vue';
import ClassExplorerTab from '@/views/app/instance_detail/modules/class-explorer-tab.vue';
import TimeTunnelTab from '@/views/app/instance_detail/modules/time-tunnel-tab.vue';
import OgnlTab from '@/views/app/instance_detail/modules/ognl-tab.vue';
import ProfilerTab from '@/views/app/instance_detail/modules/profiler-tab.vue';
import JfrTab from '@/views/app/instance_detail/modules/jfr-tab.vue';
import ChangeRecordsTab from '@/views/app/instance_detail/modules/change-records-tab.vue';
import type { OptionsType } from '@/components/custom/types/t-segmented';
import TSegmented from '@/components/custom/t-segmented.vue';

const route = useRoute();
const instanceDetail: Ref<Api.Instance.InstanceInfo | undefined> = ref();
const activeTab = ref('dashboard');

const tabs: OptionsType[] = [
  { label: '面板', value: 'dashboard' },
  { label: '系统', value: 'system' },
  { label: '线程', value: 'thread' },
  { label: 'JvmMemory', value: 'jvmMemory' },
  { label: '反编译', value: 'jad' },
  { label: 'VmOption', value: 'vmOption' },
  { label: '日志', value: 'logger' },
  { label: 'Trace', value: 'trace' },
  { label: 'Stack', value: 'stack' },
  { label: 'Watch', value: 'watch' },
  { label: 'Monitor', value: 'monitor' },
  { label: 'Class Explorer', value: 'classExplorer' },
  { label: 'TimeTunnel', value: 'timeTunnel' },
  { label: 'OGNL', value: 'ognl' },
  { label: 'Profiler', value: 'profiler' },
  { label: 'JFR', value: 'jfr' },
  { label: '变更记录', value: 'record' }
];

onMounted(() => {
  fetchInstanceDetail(route.params.instanceId as string).then(res => {
    if (res.data) {
      instanceDetail.value = res.data;
    }
  });
});
</script>

<template>
  <AppPage>
    <template #header>
      <div class="font-bold">
        <span class="text-gray">{{ instanceDetail?.appName }}</span>
        <span>/</span>
        <span>{{ instanceDetail?.instanceId }}</span>
      </div>
    </template>
    <NCard size="small">
      <template #header>
        <NSpace align="center">
          <SvgIcon icon="ri:information-2-fill" />
          {{ $t('page.instance.instanceInfo') }}
        </NSpace>
      </template>
      <InstanceInfoCard v-if="instanceDetail" :instance="instanceDetail" />
    </NCard>
    <NCard size="small" class="mt-3">
      <NScrollbar x-scrollable>
        <TSegmented v-model="activeTab" :options="tabs" />
      </NScrollbar>
    </NCard>
    <div class="mt-3">
      <DashboardTab v-if="activeTab === 'dashboard' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <SystemTab v-else-if="activeTab === 'system' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <ThreadTab v-else-if="activeTab === 'thread' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <JvmMemoryTab v-else-if="activeTab === 'jvmMemory' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <JadTab v-else-if="activeTab === 'jad' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <VmOptionTab v-else-if="activeTab === 'vmOption' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <LoggerTab v-else-if="activeTab === 'logger' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <TraceTab v-else-if="activeTab === 'trace' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <StackTab v-else-if="activeTab === 'stack' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <WatchTab v-else-if="activeTab === 'watch' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <MonitorTab v-else-if="activeTab === 'monitor' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <ClassExplorerTab
        v-else-if="activeTab === 'classExplorer' && instanceDetail"
        :instance-id="instanceDetail.instanceId"
      />
      <TimeTunnelTab
        v-else-if="activeTab === 'timeTunnel' && instanceDetail"
        :instance-id="instanceDetail.instanceId"
      />
      <OgnlTab v-else-if="activeTab === 'ognl' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <ProfilerTab v-else-if="activeTab === 'profiler' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <JfrTab v-else-if="activeTab === 'jfr' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <ChangeRecordsTab v-else-if="activeTab === 'record' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <NCard v-else size="small">
        <NEmpty description="功能开发中...">
          <template #icon>
            <SvgIcon icon="mdi:tools" class="text-4xl" />
          </template>
        </NEmpty>
      </NCard>
    </div>
  </AppPage>
</template>

<style scoped></style>
