<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { NButton } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchThreadDetailCommand, fetchThreadListCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { BaseThreadInfo } from '@/proto/command/domain/BaseThreadInfo';
import type { StackTraceNode } from '@/proto/command/domain/StackTraceNode';
import type { ThreadStatistic } from '@/proto/command/domain/ThreadStatistic';
import type { ThreadDetail as ThreadDetailResult } from '@/proto/command/result/ThreadDetail';
import type { ThreadList as ThreadListResult } from '@/proto/command/result/ThreadList';

interface Props {
  instanceId: string;
}

interface ThreadStateItem {
  state: string;
  count: number;
}

const props = defineProps<Props>();

const THREAD_LIST_REFRESH_INTERVAL = 5000;
const THREAD_SAMPLER_INTERVAL = 200;
const THREAD_STATE_ORDER = ['RUNNABLE', 'WAITING', 'TIMED_WAITING', 'BLOCKED', 'NEW', 'TERMINATED'];

const listLoading = ref(false);
const detailLoading = ref(false);
const threads = ref<BaseThreadInfo[]>([]);
const threadStatistic = ref<ThreadStatistic>();
const searchText = ref('');
const selectedState = ref<string | null>(null);
const selectedThreadBase = ref<BaseThreadInfo | null>(null);
const selectedThreadDetail = ref<ThreadDetailResult | null>(null);
const showThreadDrawer = ref(false);

const totalThreads = computed(() => threadStatistic.value?.threadCount || threads.value.length);

const threadStates = computed<ThreadStateItem[]>(() => {
  const counts = new Map<string, number>();

  for (const thread of threads.value) {
    counts.set(thread.state, (counts.get(thread.state) || 0) + 1);
  }

  const entries = Array.from(counts.entries()).map(([state, count]) => ({ state, count }));

  return entries.sort((a, b) => {
    const left = THREAD_STATE_ORDER.indexOf(a.state);
    const right = THREAD_STATE_ORDER.indexOf(b.state);

    if (left === -1 && right === -1) return a.state.localeCompare(b.state);
    if (left === -1) return 1;
    if (right === -1) return -1;

    return left - right;
  });
});

const filteredThreads = computed(() => {
  const search = searchText.value.trim().toLowerCase();

  return threads.value.filter((thread: BaseThreadInfo) => {
    const matchesSearch =
      !search || thread.name.toLowerCase().includes(search) || thread.id.toString().includes(search);
    const matchesState = !selectedState.value || thread.state === selectedState.value;

    return matchesSearch && matchesState;
  });
});

const selectedThreadState = computed(
  () => selectedThreadDetail.value?.threadState || selectedThreadBase.value?.state || ''
);

const selectedThreadStackTrace = computed(() => {
  return (selectedThreadDetail.value?.stackTrace || []).map(formatStackTraceNode);
});

const hasLockInfo = computed(() => {
  const detail = selectedThreadDetail.value;

  return Boolean(
    detail?.lockName || detail?.lockOwnerName || detail?.lock?.className || detail?.lock?.identityHashCode
  );
});

const columns = computed<DataTableColumns<BaseThreadInfo>>(() => [
  { title: 'ID', key: 'id', width: 80 },
  { title: '线程名称', key: 'name', ellipsis: { tooltip: true }, minWidth: 220 },
  { title: '线程组', key: 'group', width: 140, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'state',
    width: 140,
    render: (row: BaseThreadInfo) => h('span', { class: ['id-state-tag', getStateTagClass(row.state)] }, row.state)
  },
  {
    title: 'CPU %',
    key: 'cpu',
    width: 90,
    render: (row: BaseThreadInfo) => h('span', { class: 'font-bold' }, `${row.cpu}%`)
  },
  { title: '优先级', key: 'priority', width: 90, align: 'center' },
  {
    title: '守护线程',
    key: 'daemon',
    width: 100,
    render: (row: BaseThreadInfo) =>
      h('span', { class: row.daemon ? 'text-info' : 'text-gray' }, row.daemon ? '是' : '否')
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row: BaseThreadInfo) => {
      return h(
        NButton,
        {
          size: 'tiny',
          onClick: () => showThreadDetail(row)
        },
        { default: () => '详情' }
      );
    }
  }
]);

function createThreadListCommand() {
  listLoading.value = true;

  fetchThreadListCommand({
    instanceId: props.instanceId,
    param: {
      samplerInterval: THREAD_SAMPLER_INTERVAL
    }
  }).catch(() => {
    listLoading.value = false;
  });
}

function createThreadDetailCommand(threadId: number) {
  detailLoading.value = true;

  fetchThreadDetailCommand({
    instanceId: props.instanceId,
    param: {
      id: threadId
    }
  }).catch(() => {
    detailLoading.value = false;
  });
}

function handleThreadList(response: CommandExecuteResponse<any>) {
  const data = response.data as ThreadListResult | undefined;
  listLoading.value = false;

  if (!data || data.state === 0) {
    threads.value = [];
    threadStatistic.value = undefined;

    if (data?.message) {
      window.$message?.error(data.message);
    }

    return;
  }

  threadStatistic.value = data.threadStatistic;
  threads.value = data.threads || [];
}

function handleThreadDetail(response: CommandExecuteResponse<any>) {
  console.log('response', response);
  const data = response.data as ThreadDetailResult | undefined;
  detailLoading.value = false;

  if (!data || data.state === 0) {
    if (data?.message) {
      window.$message?.error(data.message);
    }

    return;
  }

  if (selectedThreadBase.value?.id !== data.id) {
    return;
  }

  selectedThreadDetail.value = data;
}

function toggleStateFilter(state: string) {
  selectedState.value = selectedState.value === state ? null : state;
}

function getStateTagClass(state: string): string {
  switch (state) {
    case 'RUNNABLE':
      return 'bg-green-500/10 text-green-500';
    case 'WAITING':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'TIMED_WAITING':
      return 'bg-blue-500/10 text-blue-500';
    case 'BLOCKED':
      return 'bg-red-500/10 text-red-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
}

function formatStackTraceNode(node: StackTraceNode): string {
  if (node.isNative) {
    return `${node.declaringClass}.${node.methodName}(Native Method)`;
  }

  if (node.lineNumber > 0) {
    return `${node.declaringClass}.${node.methodName}:${node.lineNumber}`;
  }

  return `${node.declaringClass}.${node.methodName}`;
}

function showThreadDetail(thread: BaseThreadInfo) {
  selectedThreadBase.value = thread;
  selectedThreadDetail.value = null;
  showThreadDrawer.value = true;
  createThreadDetailCommand(thread.id);
}

watch(showThreadDrawer, (show: boolean) => {
  if (!show) {
    selectedThreadBase.value = null;
    selectedThreadDetail.value = null;
    detailLoading.value = false;
  }
});

let updateInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  createThreadListCommand();
  updateInterval = setInterval(() => {
    createThreadListCommand();
  }, THREAD_LIST_REFRESH_INTERVAL);
  eventBus.on('command:thread-list', handleThreadList);
  eventBus.on('command:thread-detail', handleThreadDetail);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  eventBus.off('command:thread-list', handleThreadList);
  eventBus.off('command:thread-detail', handleThreadDetail);
});
</script>

<template>
  <div class="thread-tab">
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <span
        v-for="item in threadStates"
        :key="item.state"
        class="id-state-filter-tag"
        :class="[getStateTagClass(item.state), selectedState === item.state ? 'id-state-filter-tag-active' : '']"
        @click="toggleStateFilter(item.state)"
      >
        {{ item.state }} ({{ item.count }})
      </span>
    </div>

    <NCard size="small" class="id-card">
      <NSpace justify="space-between" align="center">
        <div class="flex items-center gap-2">
          <h4 class="id-card-title-lg" style="margin-bottom: 0">
            <SvgIcon icon="mdi:format-list-bulleted" class="h-4 w-4 text-primary" />
            线程列表
          </h4>
          <span class="text-12px text-gray">{{ filteredThreads.length }} / {{ totalThreads }}</span>
        </div>
        <NInput v-model:value="searchText" size="small" placeholder="搜索线程..." clearable class="w-220px mb-2">
          <template #prefix>
            <SvgIcon icon="mdi:magnify" />
          </template>
        </NInput>
      </NSpace>

      <NDataTable :columns="columns" :data="filteredThreads" :bordered="false" :loading="listLoading" size="small" />
    </NCard>

    <NDrawer v-model:show="showThreadDrawer" :width="600" placement="right">
      <NDrawerContent v-if="selectedThreadBase" :title="`线程详情 - ${selectedThreadBase.name}`">
        <div class="space-y-4">
          <div class="id-detail-section">
            <h5 class="id-detail-section-title">基本信息</h5>
            <div class="grid grid-cols-2 gap-3">
              <div class="id-detail-item">
                <span class="id-detail-label">线程ID</span>
                <span class="id-detail-value font-mono">{{ selectedThreadBase.id }}</span>
              </div>
              <div class="id-detail-item">
                <span class="id-detail-label">线程名称</span>
                <span class="id-detail-value font-mono">{{ selectedThreadBase.name }}</span>
              </div>
              <div class="id-detail-item">
                <span class="id-detail-label">线程状态</span>
                <span class="id-state-tag" :class="getStateTagClass(selectedThreadState)">
                  {{ selectedThreadState }}
                </span>
              </div>
              <div class="id-detail-item">
                <span class="id-detail-label">线程组</span>
                <span class="id-detail-value">{{ selectedThreadBase.group || '-' }}</span>
              </div>
              <div class="id-detail-item">
                <span class="id-detail-label">优先级</span>
                <span class="id-detail-value">{{ selectedThreadBase.priority }}</span>
              </div>
              <div class="id-detail-item">
                <span class="id-detail-label">守护线程</span>
                <span class="id-detail-value" :class="selectedThreadBase.daemon ? 'text-info' : 'text-gray'">
                  {{ selectedThreadBase.daemon ? '是' : '否' }}
                </span>
              </div>
              <div class="id-detail-item">
                <span class="id-detail-label">CPU占用</span>
                <span class="id-detail-value text-primary font-bold">{{ selectedThreadBase.cpu }}%</span>
              </div>
            </div>
          </div>

          <div v-if="hasLockInfo || detailLoading" class="id-detail-section">
            <h5 class="id-detail-section-title">锁信息</h5>
            <NSpin :show="detailLoading">
              <div class="grid grid-cols-2 gap-3">
                <div class="id-detail-item">
                  <span class="id-detail-label">锁名称</span>
                  <span class="id-detail-value">{{ selectedThreadDetail?.lockName || '-' }}</span>
                </div>
                <div class="id-detail-item">
                  <span class="id-detail-label">锁拥有者</span>
                  <span class="id-detail-value">{{ selectedThreadDetail?.lockOwnerName || '-' }}</span>
                </div>
                <div class="id-detail-item">
                  <span class="id-detail-label">锁拥有者ID</span>
                  <span class="id-detail-value">{{ selectedThreadDetail?.lockOwnerId || '-' }}</span>
                </div>
                <div class="id-detail-item">
                  <span class="id-detail-label">锁对象</span>
                  <span class="id-detail-value font-mono">
                    {{ selectedThreadDetail?.lock?.className || '-' }}
                    <template v-if="selectedThreadDetail?.lock?.identityHashCode">
                      #{{ selectedThreadDetail.lock.identityHashCode }}
                    </template>
                  </span>
                </div>
              </div>
            </NSpin>
          </div>

          <div class="id-detail-section">
            <h5 class="id-detail-section-title">堆栈跟踪</h5>
            <NSpin :show="detailLoading">
              <div v-if="selectedThreadStackTrace.length > 0" class="id-stack-trace">
                <div v-for="(line, index) in selectedThreadStackTrace" :key="index" class="id-stack-line">
                  {{ line }}
                </div>
              </div>
              <NEmpty v-else description="暂无堆栈信息" />
            </NSpin>
          </div>
        </div>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style lang="scss">
.thread-tab {
  padding: 0;
}

.space-y-4 > * + * {
  margin-top: 16px;
}
</style>
