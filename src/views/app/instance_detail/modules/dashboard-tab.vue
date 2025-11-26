<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { breakpointsTailwind, useBreakpoints, useElementSize } from '@vueuse/core';
import { divide } from 'lodash-es';
import { fetchDashboardCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import { formatMemory } from '@/utils/common';
import { div, mul } from '@/utils/math';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { Overview } from '@/proto/command/result/Overview';
import type { ThreadStatistic } from '@/proto/command/domain/ThreadStatistic';
import type { BaseThreadInfo } from '@/proto/command/domain/BaseThreadInfo';
import type { JvmMemory } from '@/proto/command/domain/JvmMemory';

interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isLg = breakpoints.greater('lg');

const statsCardRef = ref<HTMLElement | null>(null);
const { height: statsHeight } = useElementSize(statsCardRef);

// 线程统计
const threadStats: Ref<ThreadStatistic | undefined> = ref({
  threadCount: 0,
  peakThreadCount: 0,
  daemonThreadCount: 0,
  totalStartedThreadCount: 0,
  activeThreadCount: 0,
  waitingThreadCount: 0,
  blockedThreadCount: 0
});

const threadTopList: Ref<BaseThreadInfo[]> = ref([]);

// 堆内存
const heapMemory = ref({
  used: '0',
  usedBits: -1,
  committed: '0',
  eden: '0',
  survivor: '0',
  old: '0',
  max: '0',
  percent: 0,
  trend: 0
});

// 非堆内存
const nonHeapMemory = ref({
  used: '0',
  usedBits: -1,
  committed: '0',
  codeCache: '0',
  metaspace: '0',
  compressedClassSpace: '0',
  max: '0',
  percent: 0,
  trend: 0
});

// GC统计
const gcStats = ref({
  youngGC: { count: 1245, totalTime: '12.5s', avgTime: '10ms', status: 'normal' },
  oldGC: { count: 23, totalTime: '2.8s', avgTime: '122ms', status: 'attention' },
  fullGC: { count: 3, totalTime: '1.2s', avgTime: '400ms', status: 'normal' },
  total: { count: 1271, totalTime: '16.5s', percent: '0.09%' }
});

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
    createDashboardCommand();
  }, 2000);
  eventBus.on('command:overview', (data: CommandExecuteResponse<Overview>) => {
    console.log('Received dashboard update:', data);
    const overview = data.data as Overview;
    threadStats.value = overview.threadStatistic;
    threadTopList.value = overview.threads;
    parseHeapMemory(overview.heapMemory);
    parseNonHeapMemory(overview.nonHeapMemory);
  });
});

function parseHeapMemory(heapMemories: JvmMemory[]) {
  // 更新堆内存数据
  let used = 0;
  let max = 0;
  let committed = 0;
  let eden = 0;
  let survivor = 0;
  let old = 0;

  for (const memory of heapMemories) {
    used += memory.used;
    max += memory.max;
    committed += memory.committed;
    if (memory.name === 'Eden') {
      eden += memory.used;
    } else if (memory.name === 'Survivor') {
      survivor += memory.used;
    } else if (memory.name === 'Old') {
      old += memory.used;
    }
  }

  heapMemory.value.used = formatMemory(used);
  heapMemory.value.max = formatMemory(max);
  heapMemory.value.committed = formatMemory(committed);
  heapMemory.value.eden = formatMemory(eden);
  heapMemory.value.survivor = formatMemory(survivor);
  heapMemory.value.old = formatMemory(old);
  heapMemory.value.percent = div(mul(used, 100), max);
  // trend
  if (heapMemory.value.usedBits !== -1) {
    heapMemory.value.trend = divide(used - heapMemory.value.usedBits, heapMemory.value.usedBits) * 100;
  }
  heapMemory.value.usedBits = used;
}

function parseNonHeapMemory(nonHeapMemories: JvmMemory[]) {
  // 更新堆内存数据
  let used = 0;
  let max = 0;
  let committed = 0;
  let codeCache = 0;
  let metaspace = 0;
  let compressedClassSpace = 0;

  for (const memory of nonHeapMemories) {
    used += memory.used;
    max += memory.max;
    committed += memory.committed;
    if (memory.name === 'Code Cache') {
      codeCache += memory.used;
    } else if (memory.name === 'Metaspace') {
      metaspace += memory.used;
    } else if (memory.name === 'Compressed Class Space') {
      compressedClassSpace += memory.used;
    }
  }

  nonHeapMemory.value.used = formatMemory(used);
  nonHeapMemory.value.max = formatMemory(max);
  nonHeapMemory.value.committed = formatMemory(committed);
  nonHeapMemory.value.percent = div(mul(used, 100), max);
  nonHeapMemory.value.codeCache = formatMemory(codeCache);
  nonHeapMemory.value.metaspace = formatMemory(metaspace);
  nonHeapMemory.value.compressedClassSpace = formatMemory(compressedClassSpace);
  // trend
  if (nonHeapMemory.value.usedBits !== -1) {
    nonHeapMemory.value.trend = divide(used - nonHeapMemory.value.usedBits, nonHeapMemory.value.usedBits) * 100;
  }
  nonHeapMemory.value.usedBits = used;
}

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
      <div ref="statsCardRef" class="self-start">
        <NCard size="small" class="card">
          <h4 class="card-title">
            <SvgIcon icon="mdi:chart-line" class="h-4 w-4 text-primary" />
            线程统计
          </h4>
          <div class="space-y-3">
            <div class="stat-row">
              <span class="stat-label">总线程数</span>
              <span class="stat-value">{{ threadStats?.threadCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">活跃线程</span>
              <span class="stat-value text-success">{{ threadStats?.activeThreadCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">等待线程</span>
              <span class="stat-value text-warning">{{ threadStats?.waitingThreadCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">阻塞线程</span>
              <span class="stat-value text-error">{{ threadStats?.blockedThreadCount }}</span>
            </div>
            <NDivider />
            <div class="stat-row-sm">
              <span class="stat-label-sm">峰值线程数</span>
              <span class="stat-value-sm text-info">{{ threadStats?.peakThreadCount }}</span>
            </div>
            <div class="stat-row-sm">
              <span class="stat-label-sm">守护线程数</span>
              <span class="stat-value-sm text-purple">{{ threadStats?.daemonThreadCount }}</span>
            </div>
          </div>
        </NCard>
      </div>

      <!-- 线程TOP-10 -->
      <NCard
        size="small"
        class="card flex flex-col lg:col-span-2"
        :style="{ height: isLg && statsHeight > 0 ? `${statsHeight}px` : 'auto' }"
        :content-style="{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
      >
        <h4 class="card-title shrink-0">
          <SvgIcon icon="mdi:chart-bar" class="h-4 w-4 text-primary" />
          线程 CPU 占用 TOP-10
        </h4>
        <div class="min-h-0 flex-1 overflow-y-auto pr-2 space-y-2">
          <div v-for="(thread, index) in threadTopList" :key="index" class="thread-item">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="thread-name">{{ thread.id }}. {{ thread.name }}</span>
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
    <div class="grid grid-cols-1 mb-4 gap-4 lg:grid-cols-3">
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
              <span class="memory-value text-success">{{ heapMemory.used }}</span>
              <span class="memory-max">/ {{ heapMemory.max }} GB</span>
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
            <div class="info-value">{{ heapMemory.committed }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Eden区</div>
            <div class="info-value">{{ heapMemory.eden }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Survivor区</div>
            <div class="info-value text-info">{{ heapMemory.survivor }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Old区</div>
            <div class="info-value text-purple">{{ heapMemory.old }}</div>
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
              <span class="memory-value text-purple">{{ nonHeapMemory.used }}</span>
              <span class="memory-max">/ {{ nonHeapMemory.max }}</span>
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
            <div class="info-value">{{ nonHeapMemory.used }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Code Cache</div>
            <div class="info-value">{{ nonHeapMemory.codeCache }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Metaspace</div>
            <div class="info-value text-info">{{ nonHeapMemory.metaspace }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Compressed Class Space</div>
            <div class="info-value text-success">{{ nonHeapMemory.compressedClassSpace }}</div>
          </div>
        </div>
      </NCard>

      <!-- 第三行:垃圾回收统计 -->
      <NCard size="small" class="card">
        <h4 class="card-title">
          <SvgIcon icon="mdi:delete-sweep" class="h-4 w-4 text-orange" />
          垃圾回收统计
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <!-- Young GC -->
          <div class="gc-card">
            <div class="gc-header">
              <span class="gc-type">Young GC</span>
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
        </div>
      </NCard>
    </div>
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
