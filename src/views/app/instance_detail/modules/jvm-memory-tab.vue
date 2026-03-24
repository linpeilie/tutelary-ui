<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchJvmMemoryCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import { formatMemory } from '@/utils/common';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { GarbageCollector } from '@/proto/command/domain/GarbageCollector';
import type { JvmMemory } from '@/proto/command/domain/JvmMemory';
import type { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse';

interface Props {
  instanceId: string;
}

interface GcStat {
  count: number;
  totalTime: number | null;
  avgTime: number | null;
  maxTime: number | null;
  lastGc: string;
}

interface MemoryPool {
  name: string;
  type: 'HEAP' | 'NON_HEAP';
  used: string;
  committed: string;
  max: string;
  usage: number;
  status: string;
}

interface GcLog {
  time: string;
  type: string;
  duration: string;
  before: string;
  after: string;
  reason: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const memoryPools: Ref<MemoryPool[]> = ref([]);
const gcLogs: Ref<GcLog[]> = ref([]);

const gcStats = ref<{ youngGc: GcStat; oldGc: GcStat }>({
  youngGc: createEmptyGcStat(),
  oldGc: createEmptyGcStat()
});

const gcLogPlaceholder = computed(() => gcLogs.value.length === 0);

function createEmptyGcStat(): GcStat {
  return {
    count: 0,
    totalTime: null,
    avgTime: null,
    maxTime: null,
    lastGc: '待补充'
  };
}

function getUsageColor(usage: number): string {
  if (usage > 80) return 'text-error';
  if (usage > 60) return 'text-warning';
  return 'text-success';
}

function getUsageTagType(usage: number): 'error' | 'warning' | 'success' {
  if (usage > 80) return 'error';
  if (usage > 60) return 'warning';
  return 'success';
}

function getUsagePercent(memory: JvmMemory): number {
  const denominator = memory.max > 0 ? memory.max : memory.committed;

  if (!denominator) {
    return 0;
  }

  return Number(((memory.used / denominator) * 100).toFixed(1));
}

function getPoolStatus(usage: number): string {
  if (usage > 80) return '偏高';
  return '正常';
}

function getGcGroup(name: string): 'young' | 'old' {
  return /(young|new|scavenge|copy|parnew|eden)/i.test(name) ? 'young' : 'old';
}

function formatMetric(value: number | null, unit: string): string {
  if (value === null) {
    return '待补充';
  }

  return `${value}${unit}`;
}

function updateMemoryPools(response: JvmMemoryResponse) {
  memoryPools.value = [
    ...response.heapMemory.map(memory => toMemoryPool(memory, 'HEAP')),
    ...response.nonHeapMemory.map(memory => toMemoryPool(memory, 'NON_HEAP')),
    ...response.bufferPoolMemory.map(memory => toMemoryPool(memory, 'NON_HEAP'))
  ];
}

function toMemoryPool(memory: JvmMemory, type: 'HEAP' | 'NON_HEAP'): MemoryPool {
  const usage = getUsagePercent(memory);

  return {
    name: memory.name,
    type,
    used: formatMemory(memory.used),
    committed: formatMemory(memory.committed),
    max: memory.max > 0 ? formatMemory(memory.max) : '未限制',
    usage,
    status: getPoolStatus(usage)
  };
}

function updateGcStats(collectors: GarbageCollector[]) {
  const next = {
    youngGc: createEmptyGcStat(),
    oldGc: createEmptyGcStat()
  };

  for (const collector of collectors) {
    const target = getGcGroup(collector.name) === 'young' ? next.youngGc : next.oldGc;
    target.count += collector.collectionCount;
    target.totalTime = Number((((target.totalTime || 0) * 1000 + collector.collectionTime) / 1000).toFixed(2));
  }

  gcStats.value = next;
}

function createJvmMemoryCommand() {
  loading.value = true;

  fetchJvmMemoryCommand({
    instanceId: props.instanceId,
    param: {}
  }).catch(() => {
    loading.value = false;
  });
}

function handleJvmMemory(response: CommandExecuteResponse<JvmMemoryResponse>) {
  console.log('Received JVM Memory Response:', response);
  loading.value = false;
  const data = response.data as JvmMemoryResponse | undefined;

  if (!data || data.state === 0) {
    memoryPools.value = [];
    gcStats.value = {
      youngGc: createEmptyGcStat(),
      oldGc: createEmptyGcStat()
    };

    if (data?.message) {
      window.$message?.error(data.message);
    }

    return;
  }

  updateMemoryPools(data);
  updateGcStats(data.garbageCollectors || []);
}

function refreshMemoryData() {
  createJvmMemoryCommand();
}

function forceGC() {
  window.$message?.info('后端暂未提供强制 GC 命令，先保留当前页面样式');
}

function clearGCLogs() {
  window.$message?.info('后端暂未提供 GC 日志，当前区域仅保留样式占位');
}

onMounted(() => {
  createJvmMemoryCommand();
  eventBus.on('command:jvm-memory', handleJvmMemory);
});

onUnmounted(() => {
  eventBus.off('command:jvm-memory', handleJvmMemory);
});
</script>

<template>
  <div class="jvm-memory-tab">
    <!-- 页面标题 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="mb-2 text-2xl font-bold">JVM内存管理</h2>
        <p class="text-gray-400">垃圾回收统计和内存使用详情</p>
      </div>
      <div class="flex gap-3">
        <NButton type="primary" :loading="loading" @click="refreshMemoryData">
          <template #icon>
            <SvgIcon icon="mdi:refresh" />
          </template>
          刷新数据
        </NButton>
        <NButton type="success" disabled @click="forceGC">
          <template #icon>
            <SvgIcon icon="mdi:delete" />
          </template>
          强制GC
        </NButton>
      </div>
    </div>

    <!-- 垃圾回收统计概览 -->
    <div class="grid grid-cols-1 mb-4 gap-4 lg:grid-cols-2">
      <!-- Young GC 统计 -->
      <NCard size="small" class="card gc-card">
        <div class="mb-3 flex items-center justify-between">
          <h4 class="card-title mb-0">
            <SvgIcon icon="mdi:lightning-bolt" class="h-4 w-4 text-warning" />
            Young GC 统计
          </h4>
          <NTag type="warning" size="small">新生代</NTag>
        </div>
        <div class="gc-stats-grid">
          <div class="gc-stat-item">
            <span class="gc-stat-label">回收次数</span>
            <span class="gc-stat-value text-warning">{{ gcStats.youngGc.count.toLocaleString() }}</span>
          </div>
          <div class="gc-stat-item">
            <span class="gc-stat-label">总时间</span>
            <span class="gc-stat-value">{{ formatMetric(gcStats.youngGc.totalTime, 's') }}</span>
          </div>
          <div class="gc-stat-item">
            <span class="gc-stat-label">平均时间</span>
            <span class="gc-stat-value">{{ formatMetric(gcStats.youngGc.avgTime, 'ms') }}</span>
          </div>
          <div class="gc-stat-item">
            <span class="gc-stat-label">最大时间</span>
            <span class="gc-stat-value">{{ formatMetric(gcStats.youngGc.maxTime, 'ms') }}</span>
          </div>
        </div>
        <div class="gc-last-time">
          <span class="text-xs text-gray-400">上次GC: {{ gcStats.youngGc.lastGc }}</span>
        </div>
      </NCard>

      <!-- Old GC 统计 -->
      <NCard size="small" class="card gc-card">
        <div class="mb-3 flex items-center justify-between">
          <h4 class="card-title mb-0">
            <SvgIcon icon="mdi:chart-line" class="h-4 w-4 text-error" />
            Old GC 统计
          </h4>
          <NTag type="error" size="small">老年代</NTag>
        </div>
        <div class="gc-stats-grid">
          <div class="gc-stat-item">
            <span class="gc-stat-label">回收次数</span>
            <span class="gc-stat-value text-error">{{ gcStats.oldGc.count }}</span>
          </div>
          <div class="gc-stat-item">
            <span class="gc-stat-label">总时间</span>
            <span class="gc-stat-value">{{ formatMetric(gcStats.oldGc.totalTime, 's') }}</span>
          </div>
          <div class="gc-stat-item">
            <span class="gc-stat-label">平均时间</span>
            <span class="gc-stat-value">{{ formatMetric(gcStats.oldGc.avgTime, 'ms') }}</span>
          </div>
          <div class="gc-stat-item">
            <span class="gc-stat-label">最大时间</span>
            <span class="gc-stat-value">{{ formatMetric(gcStats.oldGc.maxTime, 'ms') }}</span>
          </div>
        </div>
        <div class="gc-last-time">
          <span class="text-xs text-gray-400">上次GC: {{ gcStats.oldGc.lastGc }}</span>
        </div>
      </NCard>
    </div>

    <!-- 内存池详细信息 -->
    <NCard size="small" class="card mb-6">
      <h3 class="card-title">
        <SvgIcon icon="mdi:layers" class="h-5 w-5 text-primary" />
        内存池详细信息
      </h3>
      <NDataTable
        :columns="[
          { title: '内存池名称', key: 'name' },
          {
            title: '类型',
            key: 'type',
            width: 120,
            render: (row: MemoryPool) => {
              return h(
                NTag,
                {
                  type: row.type === 'HEAP' ? 'success' : 'info',
                  size: 'small'
                },
                { default: () => row.type }
              );
            }
          },
          { title: '已使用', key: 'used', align: 'right' },
          { title: '已分配', key: 'committed', align: 'right' },
          { title: '最大值', key: 'max', align: 'right' },
          {
            title: '使用率',
            key: 'usage',
            align: 'right',
            width: 120,
            render: (row: MemoryPool) => {
              return h('span', { class: ['font-semibold', getUsageColor(row.usage)] }, `${row.usage.toFixed(1)}%`);
            }
          },
          {
            title: '状态',
            key: 'status',
            align: 'center',
            width: 100,
            render: (row: MemoryPool) => {
              return h(NTag, { type: getUsageTagType(row.usage), size: 'small' }, { default: () => row.status });
            }
          }
        ]"
        :data="memoryPools"
        :bordered="false"
        size="small"
      />
    </NCard>

    <!-- GC日志 -->
    <NCard size="small" class="card">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="card-title mb-0">
          <SvgIcon icon="mdi:text-box" class="h-5 w-5 text-gray-400" />
          最近GC日志
        </h3>
        <NButton size="small" type="error" quaternary :disabled="gcLogPlaceholder" @click="clearGCLogs">
          清空日志
        </NButton>
      </div>
      <NScrollbar class="gc-log-container">
        <div v-if="gcLogs.length > 0" class="text-xs font-mono space-y-2">
          <div v-for="(log, index) in gcLogs" :key="index" class="gc-log-item">
            <span class="text-gray-500">{{ log.time }}</span>
            <NTag :type="log.type.includes('Young') ? 'warning' : 'error'" size="small">{{ log.type }}</NTag>
            <span class="text-gray-400">
              耗时:
              <span class="text-white">{{ log.duration }}</span>
            </span>
            <span class="text-gray-400">{{ log.before }} → {{ log.after }}</span>
            <span class="text-gray-500">[{{ log.reason }}]</span>
          </div>
        </div>
        <div v-else class="h-full flex items-center justify-center text-sm text-gray-500">
          后端暂未返回 GC 日志，当前保留区域样式占位。
        </div>
      </NScrollbar>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.jvm-memory-tab {
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

.gc-card {
  border-radius: 12px;
}

.gc-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.gc-stat-item {
  padding: 8px 12px;
  background-color: rgba(var(--n-color-target-rgb), 0.3);
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gc-stat-label {
  font-size: 11px;
  color: var(--n-text-color-disabled);
  line-height: 1;
}

.gc-stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
  font-family: 'Consolas', 'Monaco', monospace;
}

.gc-last-time {
  padding-top: 8px;
  border-top: 1px solid var(--n-border-color);
  text-align: center;
}

.gc-progress {
  width: 100%;
  height: 12px;
  background-color: var(--n-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.gc-progress-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 6px;
}

.gc-progress-young {
  background: linear-gradient(90deg, #eab308 0%, #facc15 100%);
}

.gc-progress-old {
  background: linear-gradient(90deg, #f97316 0%, #fb923c 100%);
}

.memory-region {
  padding: 12px;
  background-color: rgba(var(--n-color-target-rgb), 0.3);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.gc-log-container {
  max-height: 400px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.gc-log-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0;
}
</style>
