<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchInstanceDetail } from '@/service/api/instance';
import { useInstanceCommandSession } from '@/composables/useInstanceCommandSession';
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

const route = useRoute();
const router = useRouter();
const instanceId = route.params.instanceId as string;
const instanceDetail: Ref<Api.Instance.InstanceInfo | undefined> = ref();
const defaultTab = 'dashboard';
const activeTab = shallowRef(defaultTab);
const infoCollapsed = shallowRef(false);
const commandSession = useInstanceCommandSession(instanceId);
const commandSessionReady = commandSession.ready;

interface TabItem {
  label: string;
  value: string;
  icon: string;
}

interface TabGroup {
  label: string;
  tabs: TabItem[];
}

const tabGroups: TabGroup[] = [
  {
    label: '概览',
    tabs: [
      { label: '面板', value: 'dashboard', icon: 'lucide:layout-dashboard' },
      { label: '系统', value: 'system', icon: 'lucide:server' }
    ]
  },
  {
    label: '线程与内存',
    tabs: [
      { label: '线程', value: 'thread', icon: 'lucide:layers' },
      { label: 'JVM内存', value: 'jvmMemory', icon: 'lucide:database' }
    ]
  },
  {
    label: '代码与类',
    tabs: [
      { label: '反编译', value: 'jad', icon: 'lucide:file-code' },
      { label: 'Class Explorer', value: 'classExplorer', icon: 'lucide:search-code' },
      { label: 'OGNL', value: 'ognl', icon: 'lucide:terminal' }
    ]
  },
  {
    label: '追踪与调试',
    tabs: [
      { label: 'Trace', value: 'trace', icon: 'lucide:git-branch' },
      { label: 'Stack', value: 'stack', icon: 'lucide:list-tree' },
      { label: 'Watch', value: 'watch', icon: 'lucide:eye' },
      { label: 'Monitor', value: 'monitor', icon: 'lucide:bar-chart-2' },
      { label: 'TimeTunnel', value: 'timeTunnel', icon: 'lucide:clock' }
    ]
  },
  {
    label: '配置',
    tabs: [
      { label: 'VmOption', value: 'vmOption', icon: 'lucide:sliders-horizontal' },
      { label: '日志', value: 'logger', icon: 'lucide:file-text' }
    ]
  },
  {
    label: '性能分析',
    tabs: [
      { label: 'Profiler', value: 'profiler', icon: 'lucide:flame' },
      { label: 'JFR', value: 'jfr', icon: 'lucide:radio' }
    ]
  },
  {
    label: '变更',
    tabs: [{ label: '变更记录', value: 'record', icon: 'lucide:history' }]
  }
];

const tabValues = computed(() => new Set(tabGroups.flatMap(group => group.tabs.map(tab => tab.value))));

function getRouteTab() {
  const tab = route.params.tab;
  return typeof tab === 'string' && tabValues.value.has(tab) ? tab : defaultTab;
}

function syncRouteTab(tab: string, replace = false) {
  const params = {
    ...route.params,
    instanceId,
    tab
  };

  const navigation = {
    name: 'app_instance_detail',
    params,
    query: route.query,
    hash: route.hash
  };

  if (replace) {
    router.replace(navigation);
    return;
  }

  router.push(navigation);
}

function selectTab(tab: string) {
  if (tab === activeTab.value) return;
  activeTab.value = tab;
  syncRouteTab(tab);
}

function refreshInstance() {
  fetchInstanceDetail(instanceId).then(res => {
    if (res.data) {
      instanceDetail.value = res.data;
    }
  });
}

watch(
  () => route.params.tab,
  () => {
    const routeTab = getRouteTab();
    activeTab.value = routeTab;

    if (route.params.tab !== routeTab) {
      syncRouteTab(routeTab, true);
    }
  },
  { immediate: true }
);

onMounted(() => {
  refreshInstance();
  commandSession.init();
});
</script>

<template>
  <AppPage>
    <template #header>
      <div class="flex-y-center gap-12px">
        <span class="text-14px text-gray-400">{{ instanceDetail?.appName }}</span>
        <span class="text-14px text-gray-500">/</span>
        <span class="text-18px font-bold">{{ instanceDetail?.instanceId }}</span>
        <NTag v-if="instanceDetail" :type="instanceDetail.state === 1 ? 'success' : 'error'" size="small" round>
          {{ instanceDetail.state === 1 ? '在线' : '离线' }}
        </NTag>
      </div>
    </template>
    <template #action>
      <NButton size="small" @click="refreshInstance">
        <template #icon>
          <SvgIcon icon="lucide:refresh-cw" />
        </template>
        刷新
      </NButton>
    </template>

    <div class="flex flex-col gap-16px">
      <!-- 实例信息 -->
      <NCard size="small" class="id-card">
        <template #header>
          <div class="flex-y-center justify-between">
            <div class="flex-y-center gap-8px">
              <SvgIcon icon="lucide:info" class="text-16px text-primary" />
              <span class="text-13px font-600">{{ $t('page.instance.instanceInfo') }}</span>
            </div>
            <NButton quaternary size="tiny" @click="infoCollapsed = !infoCollapsed">
              <template #icon>
                <SvgIcon :icon="infoCollapsed ? 'lucide:chevron-down' : 'lucide:chevron-up'" />
              </template>
            </NButton>
          </div>
        </template>
        <div v-show="!infoCollapsed">
          <InstanceInfoCard v-if="instanceDetail" :instance="instanceDetail" />
        </div>
      </NCard>

      <!-- Tab 分组导航 -->
      <NCard size="small" class="id-card" :content-style="{ padding: '12px 16px' }">
        <NScrollbar x-scrollable>
          <div class="tab-nav">
            <template v-for="(group, gi) in tabGroups" :key="group.label">
              <div v-if="gi > 0" class="tab-nav-separator" />
              <div class="tab-nav-group">
                <span class="tab-nav-group-label">{{ group.label }}</span>
                <div class="tab-nav-items">
                  <button
                    v-for="tab in group.tabs"
                    :key="tab.value"
                    class="tab-nav-item"
                    :class="{ 'tab-nav-item-active': activeTab === tab.value }"
                    @click="selectTab(tab.value)"
                  >
                    <SvgIcon :icon="tab.icon" class="text-14px" />
                    <span>{{ tab.label }}</span>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </NScrollbar>
      </NCard>

      <!-- Tab 内容 -->
      <NCard v-if="instanceDetail && !commandSessionReady" size="small" class="id-card">
        <NEmpty description="正在建立浏览器会话...">
          <template #icon>
            <SvgIcon icon="lucide:radio-tower" class="text-4xl" />
          </template>
        </NEmpty>
      </NCard>
      <DashboardTab v-else-if="activeTab === 'dashboard' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <SystemTab v-else-if="activeTab === 'system' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <ThreadTab v-else-if="activeTab === 'thread' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <JvmMemoryTab v-else-if="activeTab === 'jvmMemory' && instanceDetail" :instance-id="instanceDetail.instanceId" />
      <JadTab
        v-else-if="activeTab === 'jad' && instanceDetail"
        :instance-id="instanceDetail.instanceId"
        :app-name="instanceDetail.appName"
      />
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
      <NCard v-else size="small" class="id-card">
        <NEmpty description="功能开发中...">
          <template #icon>
            <SvgIcon icon="lucide:construction" class="text-4xl" />
          </template>
        </NEmpty>
      </NCard>
    </div>
  </AppPage>
</template>

<style lang="scss">
@use '../instance_detail/styles/instance-detail.scss';

.tab-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.tab-nav-separator {
  width: 1px;
  height: 24px;
  background-color: var(--n-border-color);
  margin: 0 8px;
  flex-shrink: 0;
}

.tab-nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tab-nav-group-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--n-text-color-disabled);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-left: 8px;
}

.tab-nav-items {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tab-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-disabled);
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: none;
  outline: none;
  position: relative;

  &:hover {
    color: var(--n-text-color);
    background-color: var(--n-color-target);
  }
}

.tab-nav-item-active {
  color: rgb(var(--primary-color));
  background-color: rgba(var(--primary-color), 0.08);
  font-weight: 600;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 8px;
    right: 8px;
    height: 2px;
    border-radius: 1px;
    background-color: rgb(var(--primary-color));
  }

  &:hover {
    background-color: rgba(var(--primary-color), 0.12);
  }
}
</style>
