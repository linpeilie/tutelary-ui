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
import { $t } from '@/locales';
import type { TDescriptionItemProps } from '@/components/advanced/t-descriptions.vue';
import type { GarbageCollector } from '@/proto/command/domain/GarbageCollector';

interface Props {
  instanceId: string;
}

interface MemoryIntf {
  used: string;
  usedBits: number;
  committed: string;
  max: string;
  percent: number;
  trend: number;
  memories: JvmMemory[];
}

const props = defineProps<Props>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isLg = breakpoints.greater('lg');

const loaded = ref(false);

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

const threadStatsDescriptions: Ref<Array<TDescriptionItemProps<ThreadStatistic>>> = ref([
  { label: $t('page.instance.threadTotalCount'), value: val => val.threadCount },
  { label: $t('page.instance.activeThreadCount'), value: val => val.activeThreadCount },
  { label: $t('page.instance.waitingThreadCount'), value: val => val.waitingThreadCount },
  { label: $t('page.instance.blockedThreadCount'), value: val => val.blockedThreadCount },
  { label: $t('page.instance.peakThreadCount'), value: val => val.peakThreadCount },
  { label: $t('page.instance.daemonThreadCount'), value: val => val.daemonThreadCount },
  { label: $t('page.instance.totalStartedThreadCount'), value: val => val.totalStartedThreadCount }
]);

const threadTopList: Ref<BaseThreadInfo[]> = ref([]);

// 堆内存
const heapMemory: Ref<MemoryIntf> = ref({
  used: '0',
  usedBits: -1,
  committed: '0',
  max: '0',
  percent: 0,
  trend: 0,
  memories: []
});

const heapMemoryDescriptions: Ref<Array<TDescriptionItemProps<MemoryIntf>>> = ref([]);

// 非堆内存
const nonHeapMemory: Ref<MemoryIntf> = ref({
  used: '0',
  usedBits: -1,
  committed: '0',
  max: '0',
  percent: 0,
  trend: 0,
  memories: []
});

const nonHeapMemoryDescriptions: Ref<Array<TDescriptionItemProps<MemoryIntf>>> = ref([]);

const garbageCollectors: Ref<Array<GarbageCollector>> = ref([]);

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
    garbageCollectors.value = overview.garbageCollectors;
    if (!loaded.value) {
      loaded.value = true;
    }
  });
});

function parseHeapMemory(heapMemories: JvmMemory[]) {
  // 更新堆内存数据
  let used = 0;
  let max = 0;
  let committed = 0;

  for (const memory of heapMemories) {
    used += memory.used;
    max += memory.max;
    committed += memory.committed;
  }

  heapMemory.value.used = formatMemory(used);
  heapMemory.value.max = formatMemory(max);
  heapMemory.value.committed = formatMemory(committed);
  heapMemory.value.percent = div(mul(used, 100), max);
  heapMemory.value.memories = heapMemories;
  // trend
  if (heapMemory.value.usedBits !== -1) {
    heapMemory.value.trend = divide(used - heapMemory.value.usedBits, heapMemory.value.usedBits) * 100;
  }
  heapMemory.value.usedBits = used;
  if (heapMemoryDescriptions.value.length === 0) {
    heapMemoryDescriptions.value.push({
      label: $t('page.instance.committed'),
      value: val => val.committed
    });
    for (const memory of heapMemories) {
      heapMemoryDescriptions.value.push({
        label: memory.name,
        value: val => formatMemory(val.memories.find(m => m.name === memory.name)?.used)
      });
    }
  }
}

function parseNonHeapMemory(nonHeapMemories: JvmMemory[]) {
  // 更新堆内存数据
  let used = 0;
  let max = 0;
  let committed = 0;

  for (const memory of nonHeapMemories) {
    used += memory.used;
    max += memory.max;
    committed += memory.committed;
  }

  nonHeapMemory.value.used = formatMemory(used);
  nonHeapMemory.value.max = formatMemory(max);
  nonHeapMemory.value.committed = formatMemory(committed);
  nonHeapMemory.value.percent = div(mul(used, 100), max);
  // trend
  if (nonHeapMemory.value.usedBits !== -1) {
    nonHeapMemory.value.trend = divide(used - nonHeapMemory.value.usedBits, nonHeapMemory.value.usedBits) * 100;
  }
  nonHeapMemory.value.usedBits = used;
  nonHeapMemory.value.memories = nonHeapMemories;
  if (nonHeapMemoryDescriptions.value.length === 0) {
    nonHeapMemoryDescriptions.value.push({
      label: $t('page.instance.committed'),
      value: val => val.committed
    });
    for (const memory of nonHeapMemories) {
      nonHeapMemoryDescriptions.value.push({
        label: memory.name,
        value: val => formatMemory(val.memories.find(m => m.name === memory.name)?.used)
      });
    }
  }
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
        <NCard size="small" class="id-card">
          <h4 class="id-card-title-lg">
            <SvgIcon icon="mdi:chart-line" class="h-4 w-4 text-primary" />
            {{ $t('page.instance.threadStatistics') }}
          </h4>
          <NSkeleton v-if="!loaded" text :repeat="7" round />
          <TDescriptions
            v-else
            :items="threadStatsDescriptions"
            :val="threadStats"
            content-class="id-description-value"
            :columns="1"
            label-placement="left"
            label-align="center"
          />
        </NCard>
      </div>

      <!-- 线程TOP-10 -->
      <NCard
        size="small"
        class="id-card flex flex-col lg:col-span-2"
        :style="{ height: isLg && statsHeight > 0 ? `${statsHeight}px` : 'auto' }"
        :content-style="{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
      >
        <h4 class="id-card-title-lg shrink-0">
          <SvgIcon icon="mdi:chart-bar" class="h-4 w-4 text-primary" />
          {{ $t('page.instance.top10ThreadsbyCpuUsage') }}
        </h4>
        <div class="min-h-0 flex-1 overflow-y-auto pr-2 space-y-2">
          <NSkeleton v-if="!loaded" text :repeat="7" round />
          <template v-else>
            <div v-for="(thread, index) in threadTopList" :key="index" class="thread-item">
              <div class="mb-1.5 flex items-center justify-between">
                <span class="id-thread-name">{{ thread.id }}. {{ thread.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="id-state-tag" :class="getStateTagClass(thread.state)">{{ thread.state }}</span>
                  <span class="id-thread-cpu">{{ thread.cpu }}%</span>
                </div>
              </div>
              <div class="id-progress id-progress-sm">
                <div class="id-progress-fill progress-fill-primary" :style="{ width: `${thread.cpu}%` }" />
              </div>
            </div>
          </template>
        </div>
      </NCard>
    </div>

    <!-- 第二行:堆内存 + 非堆内存 -->
    <div class="grid grid-cols-1 mb-4 gap-4 lg:grid-cols-3">
      <!-- 堆内存 -->
      <NCard size="small" class="id-card">
        <h4 class="id-card-title-lg">
          <SvgIcon icon="mdi:database" class="h-4 w-4 text-success" />
          {{ $t('page.instance.heapMemory') }}
        </h4>
        <NSkeleton v-if="!loaded" text :repeat="7" round />
        <div v-else class="mb-4">
          <div class="mb-2 flex items-end justify-between">
            <span class="id-memory-label">{{ $t('page.instance.used') }}</span>
            <div class="text-right">
              <span class="id-memory-value text-success">{{ heapMemory.used }}</span>
              <span class="id-memory-max">/ {{ heapMemory.max }} GB</span>
            </div>
          </div>
          <div class="id-progress id-progress-lg">
            <div
              class="id-progress-fill from-success to-success/80 bg-gradient-to-r"
              :style="{ width: `${heapMemory.percent}%` }"
            />
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span class="id-usage-text">使用率: {{ heapMemory.percent }}%</span>
            <div class="id-trend-tag" :class="heapMemory.trend < 0 ? 'text-success' : 'text-warning'">
              <SvgIcon :icon="heapMemory.trend < 0 ? 'mdi:trending-down' : 'mdi:trending-up'" class="h-3 w-3" />
              <span>{{ Math.abs(heapMemory.trend).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        <div class="id-divider" />
        <TDescriptions
          v-if="heapMemoryDescriptions.length > 0"
          :items="heapMemoryDescriptions"
          :val="heapMemory"
          :column="2"
          content-class="id-description-value"
        />
      </NCard>

      <!-- 非堆内存 -->
      <NCard size="small" class="id-card">
        <h4 class="id-card-title-lg">
          <SvgIcon icon="mdi:harddisk" class="h-4 w-4 text-purple" />
          {{ $t('page.instance.nonHeapMemory') }}
        </h4>
        <NSkeleton v-if="!loaded" text :repeat="7" round />
        <div v-else class="mb-4">
          <div class="mb-2 flex items-end justify-between">
            <span class="id-memory-label">{{ $t('page.instance.used') }}</span>
            <div class="text-right">
              <span class="id-memory-value text-purple">{{ nonHeapMemory.used }}</span>
              <span class="id-memory-max">/ {{ nonHeapMemory.max }}</span>
            </div>
          </div>
          <div class="id-progress id-progress-lg">
            <div
              class="id-progress-fill from-purple to-purple/80 bg-gradient-to-r"
              :style="{ width: `${nonHeapMemory.percent}%` }"
            />
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span class="id-usage-text">使用率: {{ nonHeapMemory.percent }}%</span>
            <div class="id-trend-tag" :class="nonHeapMemory.trend < 0 ? 'text-success' : 'text-purple'">
              <SvgIcon :icon="nonHeapMemory.trend < 0 ? 'mdi:trending-down' : 'mdi:trending-up'" class="h-3 w-3" />
              <span>{{ Math.abs(nonHeapMemory.trend).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        <div class="id-divider" />
        <TDescriptions
          v-if="nonHeapMemoryDescriptions.length > 0"
          :items="nonHeapMemoryDescriptions"
          :val="nonHeapMemory"
          :column="2"
          content-class="id-description-value"
        />
      </NCard>

      <!-- 第三行:垃圾回收统计 -->
      <NCard size="small" class="id-card">
        <h4 class="id-card-title-lg">
          <SvgIcon icon="mdi:delete-sweep" class="h-4 w-4 text-orange" />
          {{ $t('page.instance.garbageCollectionStatistics') }}
        </h4>
        <NSkeleton v-if="!loaded" text :repeat="7" round />
        <div v-else class="grid grid-cols-2 gap-4">
          <div v-for="gc of garbageCollectors" :key="gc.name" class="id-gc-card">
            <div class="id-gc-header">
              <span class="id-gc-type">{{ gc.name }}</span>
            </div>
            <div class="id-gc-body">
              <div class="id-gc-count">
                <span class="id-gc-number">{{ gc.collectionCount }}</span>
                <span class="id-gc-unit">{{ $t('common.times') }}</span>
              </div>
              <NSpace>
                <NTag v-for="mpn of gc.memoryPoolNames" :key="mpn" :bordered="false" size="small" type="success">
                  {{ mpn }}
                </NTag>
              </NSpace>
              <div class="id-gc-stat">
                <span class="id-gc-stat-label">{{ $t('page.instance.totalDuration') }}</span>
                <span class="id-gc-stat-value">{{ gc.collectionTime }} ms</span>
              </div>
              <div class="id-gc-stat">
                <span class="id-gc-stat-label">{{ $t('page.instance.averageDuration') }}</span>
                <span class="id-gc-stat-value">{{ div(gc.collectionTime, gc.collectionCount) }} ms</span>
              </div>
            </div>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-tab {
  padding: 0;
}

.space-y-2 > * + * {
  margin-top: 8px;
}

.thread-item {
  padding-bottom: 4px;
}

.progress-fill-primary {
  background: linear-gradient(to right, rgb(var(--primary-color)), rgb(var(--primary-color-hover)));
}
</style>
