<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';
import { fetchDashboardCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import { Overview } from '@/proto/command/result/Overview';

interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

// 线程统计
const threadStats = ref({
  total: 120,
  active: 85,
  waiting: 25,
  blocked: 10,
  peak: 145,
  daemon: 32
});

// 线程TOP10数据
interface ThreadInfo {
  name: string;
  cpu: number;
  state: string;
}

const threadTopList: Ref<ThreadInfo[]> = ref([
  { name: 'http-nio-8080-exec-1', cpu: 15.2, state: 'RUNNABLE' },
  { name: 'http-nio-8080-exec-2', cpu: 12.8, state: 'RUNNABLE' },
  { name: 'reactor-http-nio-3', cpu: 9.5, state: 'WAITING' },
  { name: 'mysql-connector-1', cpu: 7.3, state: 'TIMED_WAITING' },
  { name: 'redis-client-1', cpu: 6.1, state: 'RUNNABLE' }
]);

// 堆内存
const heapMemory = ref({
  used: 2.4,
  max: 4.0,
  percent: 60,
  trend: -2.3
});

// 非堆内存
const nonHeapMemory = ref({
  used: 512,
  max: 1024,
  percent: 50,
  trend: 1.2
});

// GC统计
const gcStats = ref({
  youngGC: { count: 1245, totalTime: '12.5s', avgTime: '10ms', status: 'normal' },
  oldGC: { count: 23, totalTime: '2.8s', avgTime: '122ms', status: 'attention' },
  fullGC: { count: 3, totalTime: '1.2s', avgTime: '400ms', status: 'normal' },
  total: { count: 1271, totalTime: '16.5s', percent: '0.09%' }
});

function getStatusTagClass(status: string): string {
  switch (status) {
    case 'normal':
      return 'bg-green-500/10 text-green-500';
    case 'attention':
      return 'bg-yellow-500/10 text-yellow-500';
    default:
      return 'bg-blue-500/10 text-blue-500';
  }
}

function getStateTagClass(state: string): string {
  return state === 'RUNNABLE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500';
}

let updateInterval: NodeJS.Timeout | null = null;

function createDashboardCommand() {
  const params = {
    instanceId: props.instanceId,
    param: {}
  };
  fetchDashboardCommand(params);
}

onMounted(() => {
  updateInterval = setInterval(() => {
    threadStats.value.total = 115 + Math.floor(Math.random() * 10);
    threadStats.value.active = 80 + Math.floor(Math.random() * 10);
    createDashboardCommand();
  }, 5000);
  eventBus.on('command:overview', (data: CommandExecuteResponse<Overview>) => {
    console.log('Received dashboard update:', data);
    const overview = data.data as Overview;
    threadStats.value.total = overview.threadStatistic?.threadCount || 0;
  });
});

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
  eventBus.off('command:overview');
});
</script>

<template>
  <div class="dashboard-tab">
    <!-- 第一行:线程统计 + 线程TOP-10 -->
    <div class="grid grid-cols-1 mb-4 gap-4 lg:grid-cols-3">
      <!-- 线程统计 -->
      <NCard size="small" class="card">
        <h4 class="card-title">
          <SvgIcon icon="mdi:chart-line" class="h-4 w-4 text-primary" />
          线程统计
        </h4>
        <div class="space-y-3">
          <div class="stat-row">
            <span class="stat-label">总线程数</span>
            <span class="stat-value">{{ threadStats.total }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">活跃线程</span>
            <span class="stat-value text-success">{{ threadStats.active }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">等待线程</span>
            <span class="stat-value text-warning">{{ threadStats.waiting }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">阻塞线程</span>
            <span class="stat-value text-error">{{ threadStats.blocked }}</span>
          </div>
          <div class="divider-line" />
          <div class="stat-row-sm">
            <span class="stat-label-sm">峰值线程数</span>
            <span class="stat-value-sm text-info">{{ threadStats.peak }}</span>
          </div>
          <div class="stat-row-sm">
            <span class="stat-label-sm">守护线程数</span>
            <span class="stat-value-sm text-purple">{{ threadStats.daemon }}</span>
          </div>
        </div>
      </NCard>

      <!-- 线程TOP-10 -->
      <NCard size="small" class="card lg:col-span-2">
        <h4 class="card-title">
          <SvgIcon icon="mdi:chart-bar" class="h-4 w-4 text-primary" />
          线程 CPU 占用 TOP-10
        </h4>
        <div class="space-y-2">
          <div v-for="(thread, index) in threadTopList" :key="index" class="thread-item">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="thread-name">{{ index + 1 }}. {{ thread.name }}</span>
              <div class="flex items-center gap-2">
                <span class="state-tag" :class="getStateTagClass(thread.state)">{{ thread.state }}</span>
                <span class="thread-cpu">{{ thread.cpu }}%</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${thread.cpu}%` }" />
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- 第二行:堆内存 + 非堆内存 -->
    <div class="grid grid-cols-1 mb-4 gap-4 lg:grid-cols-2">
      <!-- 堆内存 -->
      <NCard size="small" class="card">
        <h4 class="card-title">
          <SvgIcon icon="mdi:database" class="h-4 w-4 text-success" />
          堆内存
        </h4>
        <div class="mb-4">
          <div class="mb-2 flex items-end justify-between">
            <span class="memory-label">已使用</span>
            <div class="text-right">
              <span class="memory-value text-success">{{ heapMemory.used.toFixed(1) }} GB</span>
              <span class="memory-max">/ {{ heapMemory.max.toFixed(1) }} GB</span>
            </div>
          </div>
          <div class="memory-progress">
            <div
              class="memory-progress-fill from-success to-success/80 bg-gradient-to-r"
              :style="{ width: `${heapMemory.percent}%` }"
            />
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span class="usage-text">使用率: {{ heapMemory.percent }}%</span>
            <div class="trend-tag" :class="heapMemory.trend < 0 ? 'text-success' : 'text-warning'">
              <SvgIcon :icon="heapMemory.trend < 0 ? 'mdi:trending-down' : 'mdi:trending-up'" class="h-3 w-3" />
              <span>{{ Math.abs(heapMemory.trend).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        <div class="divider-line" />
        <div class="grid grid-cols-2 gap-3 pt-3">
          <div class="info-item">
            <div class="info-label">已提交</div>
            <div class="info-value">3.2 GB</div>
          </div>
          <div class="info-item">
            <div class="info-label">最大可用</div>
            <div class="info-value">4.0 GB</div>
          </div>
          <div class="info-item">
            <div class="info-label">Eden区</div>
            <div class="info-value text-info">1.2 GB</div>
          </div>
          <div class="info-item">
            <div class="info-label">Old区</div>
            <div class="info-value text-purple">1.0 GB</div>
          </div>
        </div>
      </NCard>

      <!-- 非堆内存 -->
      <NCard size="small" class="card">
        <h4 class="card-title">
          <SvgIcon icon="mdi:harddisk" class="h-4 w-4 text-purple" />
          非堆内存
        </h4>
        <div class="mb-4">
          <div class="mb-2 flex items-end justify-between">
            <span class="memory-label">已使用</span>
            <div class="text-right">
              <span class="memory-value text-purple">{{ nonHeapMemory.used }} MB</span>
              <span class="memory-max">/ {{ (nonHeapMemory.max / 1024).toFixed(1) }} GB</span>
            </div>
          </div>
          <div class="memory-progress">
            <div
              class="memory-progress-fill from-purple to-purple/80 bg-gradient-to-r"
              :style="{ width: `${nonHeapMemory.percent}%` }"
            />
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span class="usage-text">使用率: {{ nonHeapMemory.percent }}%</span>
            <div class="trend-tag" :class="nonHeapMemory.trend < 0 ? 'text-success' : 'text-purple'">
              <SvgIcon :icon="nonHeapMemory.trend < 0 ? 'mdi:trending-down' : 'mdi:trending-up'" class="h-3 w-3" />
              <span>{{ Math.abs(nonHeapMemory.trend).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        <div class="divider-line" />
        <div class="grid grid-cols-2 gap-3 pt-3">
          <div class="info-item">
            <div class="info-label">已提交</div>
            <div class="info-value">768 MB</div>
          </div>
          <div class="info-item">
            <div class="info-label">最大可用</div>
            <div class="info-value">1.0 GB</div>
          </div>
          <div class="info-item">
            <div class="info-label">Metaspace</div>
            <div class="info-value text-info">256 MB</div>
          </div>
          <div class="info-item">
            <div class="info-label">CodeCache</div>
            <div class="info-value text-success">128 MB</div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- 第三行:垃圾回收统计 -->
    <NCard size="small" class="card">
      <h4 class="card-title">
        <SvgIcon icon="mdi:delete-sweep" class="h-4 w-4 text-orange" />
        垃圾回收统计
      </h4>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 md:grid-cols-2">
        <!-- Young GC -->
        <div class="gc-card">
          <div class="gc-header">
            <span class="gc-type">Young GC</span>
            <span class="gc-status" :class="getStatusTagClass(gcStats.youngGC.status)">正常</span>
          </div>
          <div class="gc-body">
            <div class="gc-count">
              <span class="gc-number">{{ gcStats.youngGC.count.toLocaleString() }}</span>
              <span class="gc-unit">次</span>
            </div>
            <div class="gc-stat">
              <span class="gc-stat-label">总耗时</span>
              <span class="gc-stat-value">{{ gcStats.youngGC.totalTime }}</span>
            </div>
            <div class="gc-stat">
              <span class="gc-stat-label">平均耗时</span>
              <span class="gc-stat-value">{{ gcStats.youngGC.avgTime }}</span>
            </div>
          </div>
        </div>

        <!-- Old GC -->
        <div class="gc-card">
          <div class="gc-header">
            <span class="gc-type">Old GC</span>
            <span class="gc-status" :class="getStatusTagClass(gcStats.oldGC.status)">关注</span>
          </div>
          <div class="gc-body">
            <div class="gc-count">
              <span class="gc-number">{{ gcStats.oldGC.count }}</span>
              <span class="gc-unit">次</span>
            </div>
            <div class="gc-stat">
              <span class="gc-stat-label">总耗时</span>
              <span class="gc-stat-value">{{ gcStats.oldGC.totalTime }}</span>
            </div>
            <div class="gc-stat">
              <span class="gc-stat-label">平均耗时</span>
              <span class="gc-stat-value">{{ gcStats.oldGC.avgTime }}</span>
            </div>
          </div>
        </div>

        <!-- Full GC -->
        <div class="gc-card">
          <div class="gc-header">
            <span class="gc-type">Full GC</span>
            <span class="gc-status" :class="getStatusTagClass(gcStats.fullGC.status)">正常</span>
          </div>
          <div class="gc-body">
            <div class="gc-count">
              <span class="gc-number">{{ gcStats.fullGC.count }}</span>
              <span class="gc-unit">次</span>
            </div>
            <div class="gc-stat">
              <span class="gc-stat-label">总耗时</span>
              <span class="gc-stat-value">{{ gcStats.fullGC.totalTime }}</span>
            </div>
            <div class="gc-stat">
              <span class="gc-stat-label">平均耗时</span>
              <span class="gc-stat-value">{{ gcStats.fullGC.avgTime }}</span>
            </div>
          </div>
        </div>

        <!-- GC汇总 -->
        <div class="gc-card gc-summary">
          <div class="gc-header">
            <span class="gc-type">GC 汇总</span>
            <SvgIcon icon="mdi:trending-down" class="h-4 w-4 text-success" />
          </div>
          <div class="gc-body">
            <div class="gc-count">
              <span class="gc-number">{{ gcStats.total.count.toLocaleString() }}</span>
              <span class="gc-unit">次</span>
            </div>
            <div class="gc-stat">
              <span class="gc-stat-label">总耗时</span>
              <span class="gc-stat-value">{{ gcStats.total.totalTime }}</span>
            </div>
            <div class="gc-stat">
              <span class="gc-stat-label">占比</span>
              <span class="gc-stat-value text-success">{{ gcStats.total.percent }}</span>
            </div>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.dashboard-tab {
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

.space-y-3 > * + * {
  margin-top: 12px;
}

.space-y-2 > * + * {
  margin-top: 8px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  font-size: 14px;
  color: var(--n-text-color-disabled);
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--n-text-color);
}

.divider-line {
  height: 1px;
  background-color: var(--n-border-color);
  margin: 12px 0;
}

.stat-row-sm {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label-sm {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.stat-value-sm {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
}

.thread-item {
  padding-bottom: 4px;
}

.thread-name {
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--n-text-color);
}

.state-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.thread-cpu {
  font-size: 14px;
  font-weight: bold;
  color: var(--n-text-color);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: var(--n-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, rgb(var(--primary-color)), rgb(var(--primary-color-hover)));
  transition: width 0.3s ease;
}

.memory-label {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.memory-value {
  font-size: 20px;
  font-weight: bold;
}

.memory-max {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  margin-left: 4px;
}

.memory-progress {
  width: 100%;
  height: 12px;
  background-color: var(--n-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.memory-progress-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.usage-text {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.trend-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.info-item {
  text-align: left;
}

.info-label {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
}

.gc-card {
  padding: 16px;
  background-color: var(--n-color-target);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.gc-summary {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  border-color: rgba(59, 130, 246, 0.2);
}

.gc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.gc-type {
  font-size: 12px;
  font-weight: 500;
  color: var(--n-text-color-disabled);
}

.gc-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.gc-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gc-count {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.gc-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--n-text-color);
}

.gc-unit {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.gc-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.gc-stat-label {
  color: var(--n-text-color-disabled);
}

.gc-stat-value {
  color: var(--n-text-color);
  font-weight: 600;
}
</style>
