<script setup lang="ts">
import { h, onMounted, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NDrawer, NSelect } from 'naive-ui';

interface Props {
  instanceId: string;
}

defineProps<Props>();

// 线程统计
const threadStats = ref({
  total: 120,
  active: 85,
  runnable: 65,
  waiting: 25,
  timedWaiting: 18,
  blocked: 10,
  peak: 145,
  daemon: 32,
  started: 156
});

// 线程状态分布
const threadStates = ref([
  { state: 'RUNNABLE', count: 65, percent: 54.2, color: 'text-success' },
  { state: 'WAITING', count: 25, percent: 20.8, color: 'text-warning' },
  { state: 'TIMED_WAITING', count: 18, percent: 15.0, color: 'text-info' },
  { state: 'BLOCKED', count: 10, percent: 8.3, color: 'text-error' },
  { state: 'NEW', count: 2, percent: 1.7, color: 'text-gray' }
]);

// 线程列表
interface ThreadInfo {
  id: number;
  name: string;
  state: string;
  cpu: number;
  cpuTime: string;
  userTime: string;
  blockedCount: number;
  blockedTime: string;
  waitedCount: number;
  waitedTime: string;
  priority: number;
  daemon: boolean;
  stackTrace?: string[];
}

const threads: Ref<ThreadInfo[]> = ref([
  {
    id: 1,
    name: 'http-nio-8080-exec-1',
    state: 'RUNNABLE',
    cpu: 15.2,
    cpuTime: '125ms',
    userTime: '120ms',
    blockedCount: 0,
    blockedTime: '0ms',
    waitedCount: 5,
    waitedTime: '25ms',
    priority: 5,
    daemon: true,
    stackTrace: [
      'java.net.SocketInputStream.socketRead0(Native Method)',
      'java.net.SocketInputStream.socketRead(SocketInputStream.java:116)',
      'org.apache.coyote.http11.Http11InputBuffer.fill(Http11InputBuffer.java:789)'
    ]
  },
  {
    id: 2,
    name: 'http-nio-8080-exec-2',
    state: 'RUNNABLE',
    cpu: 12.8,
    cpuTime: '98ms',
    userTime: '95ms',
    blockedCount: 2,
    blockedTime: '5ms',
    waitedCount: 3,
    waitedTime: '15ms',
    priority: 5,
    daemon: true
  },
  {
    id: 3,
    name: 'reactor-http-nio-3',
    state: 'WAITING',
    cpu: 9.5,
    cpuTime: '75ms',
    userTime: '72ms',
    blockedCount: 1,
    blockedTime: '2ms',
    waitedCount: 8,
    waitedTime: '45ms',
    priority: 5,
    daemon: true
  },
  {
    id: 4,
    name: 'mysql-connector-1',
    state: 'TIMED_WAITING',
    cpu: 7.3,
    cpuTime: '58ms',
    userTime: '55ms',
    blockedCount: 0,
    blockedTime: '0ms',
    waitedCount: 12,
    waitedTime: '68ms',
    priority: 5,
    daemon: false
  },
  {
    id: 5,
    name: 'redis-client-1',
    state: 'RUNNABLE',
    cpu: 6.1,
    cpuTime: '48ms',
    userTime: '46ms',
    blockedCount: 3,
    blockedTime: '8ms',
    waitedCount: 6,
    waitedTime: '32ms',
    priority: 5,
    daemon: true
  }
]);

const searchText = ref('');
const selectedState = ref<string | null>(null);
const selectedThread = ref<ThreadInfo | null>(null);
const showThreadDrawer = ref(false);

// 过滤线程
const filteredThreads = ref(threads.value);

function filterThreads() {
  let result = threads.value;

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(
      (t: ThreadInfo) => t.name.toLowerCase().includes(search) || t.id.toString().includes(search)
    );
  }

  if (selectedState.value) {
    result = result.filter((t: ThreadInfo) => t.state === selectedState.value);
  }

  filteredThreads.value = result;
}

function getStateColor(state: string): string {
  switch (state) {
    case 'RUNNABLE':
      return 'text-success';
    case 'WAITING':
      return 'text-warning';
    case 'TIMED_WAITING':
      return 'text-info';
    case 'BLOCKED':
      return 'text-error';
    default:
      return 'text-gray';
  }
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

function showThreadDetail(thread: ThreadInfo) {
  selectedThread.value = thread;
  showThreadDrawer.value = true;
}

function _closeThreadDrawer() {
  showThreadDrawer.value = false;
  selectedThread.value = null;
}

let updateInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  filterThreads();
  updateInterval = setInterval(() => {
    threadStats.value.active = 80 + Math.floor(Math.random() * 10);
    threadStats.value.runnable = 60 + Math.floor(Math.random() * 10);
  }, 5000);
});

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
});
</script>

<template>
  <div class="thread-tab">
    <!-- 线程统计 -->
    <div class="grid grid-cols-1 mb-4 gap-4 lg:grid-cols-5 md:grid-cols-2">
      <NCard size="small" class="stat-card">
        <div class="stat-card-content">
          <div class="stat-card-header">
            <span class="stat-card-label">总线程数</span>
            <SvgIcon icon="mdi:chart-line" class="h-4 w-4 text-primary" />
          </div>
          <div class="stat-card-value">{{ threadStats.total }}</div>
          <div class="stat-card-footer">当前活跃</div>
        </div>
      </NCard>

      <NCard size="small" class="stat-card stat-card-success">
        <div class="stat-card-content">
          <div class="stat-card-header">
            <span class="stat-card-label">活跃线程</span>
            <SvgIcon icon="mdi:play-circle" class="h-4 w-4 text-success" />
          </div>
          <div class="stat-card-value text-success">{{ threadStats.active }}</div>
          <div class="stat-card-footer">Runnable</div>
        </div>
      </NCard>

      <NCard size="small" class="stat-card stat-card-warning">
        <div class="stat-card-content">
          <div class="stat-card-header">
            <span class="stat-card-label">等待线程</span>
            <SvgIcon icon="mdi:pause-circle" class="h-4 w-4 text-warning" />
          </div>
          <div class="stat-card-value text-warning">{{ threadStats.waiting }}</div>
          <div class="stat-card-footer">Waiting</div>
        </div>
      </NCard>

      <NCard size="small" class="stat-card stat-card-error">
        <div class="stat-card-content">
          <div class="stat-card-header">
            <span class="stat-card-label">阻塞线程</span>
            <SvgIcon icon="mdi:stop-circle" class="h-4 w-4 text-error" />
          </div>
          <div class="stat-card-value text-error">{{ threadStats.blocked }}</div>
          <div class="stat-card-footer">Blocked</div>
        </div>
      </NCard>

      <NCard size="small" class="stat-card stat-card-info">
        <div class="stat-card-content">
          <div class="stat-card-header">
            <span class="stat-card-label">峰值线程</span>
            <SvgIcon icon="mdi:trending-up" class="h-4 w-4 text-info" />
          </div>
          <div class="stat-card-value text-info">{{ threadStats.peak }}</div>
          <div class="stat-card-footer">历史峰值</div>
        </div>
      </NCard>
    </div>

    <!-- 线程状态分布 -->
    <NCard size="small" class="card mb-4">
      <h4 class="card-title">
        <SvgIcon icon="mdi:chart-donut" class="h-4 w-4 text-primary" />
        线程状态分布
      </h4>
      <div class="space-y-3">
        <div v-for="item in threadStates" :key="item.state" class="state-item">
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="state-tag" :class="getStateTagClass(item.state)">{{ item.state }}</span>
              <span class="state-count">{{ item.count }} 个线程</span>
            </div>
            <span class="state-percent" :class="getStateColor(item.state)">{{ item.percent }}%</span>
          </div>
          <div class="state-progress">
            <div
              class="state-progress-fill"
              :class="getStateColor(item.state)"
              :style="{ width: `${item.percent}%` }"
            />
          </div>
        </div>
      </div>
    </NCard>

    <!-- 线程列表 -->
    <NCard size="small" class="card">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="card-title mb-0">
          <SvgIcon icon="mdi:format-list-bulleted" class="h-4 w-4 text-primary" />
          线程列表
        </h4>
        <div class="flex items-center gap-2">
          <NSelect
            v-model:value="selectedState"
            size="small"
            placeholder="筛选状态"
            clearable
            class="w-150px"
            :options="[
              { label: 'RUNNABLE', value: 'RUNNABLE' },
              { label: 'WAITING', value: 'WAITING' },
              { label: 'TIMED_WAITING', value: 'TIMED_WAITING' },
              { label: 'BLOCKED', value: 'BLOCKED' }
            ]"
            @update:value="filterThreads"
          />
          <NInput
            v-model:value="searchText"
            size="small"
            placeholder="搜索线程..."
            clearable
            class="w-200px"
            @input="filterThreads"
          >
            <template #prefix>
              <SvgIcon icon="mdi:magnify" />
            </template>
          </NInput>
        </div>
      </div>

      <NDataTable
        :columns="[
          { title: 'ID', key: 'id', width: 60 },
          { title: '线程名称', key: 'name', ellipsis: { tooltip: true } },
          {
            title: '状态',
            key: 'state',
            width: 140,
            render: (row: ThreadInfo) => {
              return h('span', { class: ['state-tag', getStateTagClass(row.state)] }, row.state);
            }
          },
          {
            title: 'CPU %',
            key: 'cpu',
            width: 80,
            render: (row: ThreadInfo) => {
              return h('span', { class: 'font-bold' }, row.cpu + '%');
            }
          },
          { title: 'CPU时间', key: 'cpuTime', width: 100 },
          { title: '阻塞次数', key: 'blockedCount', width: 100 },
          { title: '等待次数', key: 'waitedCount', width: 100 },
          {
            title: '优先级',
            key: 'priority',
            width: 80,
            align: 'center'
          },
          {
            title: '守护线程',
            key: 'daemon',
            width: 100,
            render: (row: ThreadInfo) => {
              return h('span', { class: row.daemon ? 'text-info' : 'text-gray' }, row.daemon ? '是' : '否');
            }
          },
          {
            title: '操作',
            key: 'actions',
            width: 80,
            render: (row: ThreadInfo) => {
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
        ]"
        :data="filteredThreads"
        :bordered="false"
        :max-height="500"
        size="small"
      />
    </NCard>

    <!-- 线程详情抽屉 -->
    <NDrawer v-model:show="showThreadDrawer" :width="600" placement="right">
      <NDrawerContent v-if="selectedThread" :title="`线程详情 - ${selectedThread.name}`">
        <div class="space-y-4">
          <!-- 基本信息 -->
          <div class="detail-section">
            <h5 class="detail-section-title">基本信息</h5>
            <div class="grid grid-cols-2 gap-3">
              <div class="detail-item">
                <span class="detail-label">线程ID</span>
                <span class="detail-value font-mono">{{ selectedThread.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">线程名称</span>
                <span class="detail-value font-mono">{{ selectedThread.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">线程状态</span>
                <span class="state-tag" :class="getStateTagClass(selectedThread.state)">
                  {{ selectedThread.state }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">优先级</span>
                <span class="detail-value">{{ selectedThread.priority }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">守护线程</span>
                <span class="detail-value" :class="selectedThread.daemon ? 'text-info' : 'text-gray'">
                  {{ selectedThread.daemon ? '是' : '否' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">CPU占用</span>
                <span class="detail-value text-primary font-bold">{{ selectedThread.cpu }}%</span>
              </div>
            </div>
          </div>

          <!-- 时间统计 -->
          <div class="detail-section">
            <h5 class="detail-section-title">时间统计</h5>
            <div class="grid grid-cols-2 gap-3">
              <div class="detail-item">
                <span class="detail-label">CPU时间</span>
                <span class="detail-value">{{ selectedThread.cpuTime }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">用户时间</span>
                <span class="detail-value">{{ selectedThread.userTime }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">阻塞时间</span>
                <span class="detail-value">{{ selectedThread.blockedTime }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">等待时间</span>
                <span class="detail-value">{{ selectedThread.waitedTime }}</span>
              </div>
            </div>
          </div>

          <!-- 阻塞和等待统计 -->
          <div class="detail-section">
            <h5 class="detail-section-title">阻塞和等待统计</h5>
            <div class="grid grid-cols-2 gap-3">
              <div class="detail-item">
                <span class="detail-label">阻塞次数</span>
                <span class="detail-value font-bold">{{ selectedThread.blockedCount }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">等待次数</span>
                <span class="detail-value font-bold">{{ selectedThread.waitedCount }}</span>
              </div>
            </div>
          </div>

          <!-- 堆栈信息 -->
          <div v-if="selectedThread.stackTrace" class="detail-section">
            <h5 class="detail-section-title">堆栈跟踪</h5>
            <div class="stack-trace">
              <div v-for="(line, index) in selectedThread.stackTrace" :key="index" class="stack-line">
                {{ line }}
              </div>
            </div>
          </div>
        </div>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped lang="scss">
.thread-tab {
  padding: 0;
}

.card {
  border-radius: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.stat-card-success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%);
  border-color: rgba(34, 197, 94, 0.1);
}

.stat-card-warning {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(234, 179, 8, 0.02) 100%);
  border-color: rgba(234, 179, 8, 0.1);
}

.stat-card-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
  border-color: rgba(239, 68, 68, 0.1);
}

.stat-card-info {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%);
  border-color: rgba(99, 102, 241, 0.1);
}

.stat-card-content {
  padding: 4px;
}

.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-card-label {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.stat-card-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--n-text-color);
  margin: 8px 0;
}

.stat-card-footer {
  font-size: 11px;
  color: var(--n-text-color-disabled);
}

.space-y-3 > * + * {
  margin-top: 12px;
}

.state-item {
  padding: 12px;
  background-color: rgba(var(--n-color-target-rgb), 0.3);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.state-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.state-count {
  font-size: 13px;
  color: var(--n-text-color);
}

.state-percent {
  font-size: 14px;
  font-weight: bold;
}

.state-progress {
  width: 100%;
  height: 6px;
  background-color: var(--n-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.state-progress-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 3px;
}

.detail-section {
  padding: 16px;
  background-color: var(--n-color-target);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.detail-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  color: var(--n-text-color-disabled);
}

.detail-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
}

.stack-trace {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  max-height: 300px;
  overflow-y: auto;
}

.stack-line {
  color: var(--n-text-color);
  padding: 2px 0;
  word-break: break-all;
}
</style>
