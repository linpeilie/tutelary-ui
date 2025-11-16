<script setup lang="ts">
import { h, onMounted, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';
import { NTag } from 'naive-ui';

interface Props {
  instanceId: string;
}

defineProps<Props>();

// GC统计数据
const gcStats = ref({
  youngGc: {
    count: 1247,
    totalTime: 12.34,
    avgTime: 9.89,
    maxTime: 45.6,
    lastGc: '2分钟前'
  },
  oldGc: {
    count: 89,
    totalTime: 8.76,
    avgTime: 98.43,
    maxTime: 256.7,
    lastGc: '15分钟前'
  },
  youngGcPercent: 58.5,
  oldGcPercent: 41.5
});

// 堆内存数据
const heapMemory = ref({
  used: 1.2,
  committed: 2.0,
  max: 4.0,
  usagePercent: 60.0,
  regions: {
    eden: { used: 256, max: 512, percent: 50 },
    survivor: { used: 64, max: 128, percent: 50 },
    oldGen: { used: 900, max: 1400, percent: 64.3 }
  }
});

// 非堆内存数据
const nonHeapMemory = ref({
  used: 256,
  committed: 280,
  max: 512,
  usagePercent: 50.0,
  regions: {
    metaspace: { used: 128, max: 256, percent: 50 },
    codeCache: { used: 64, max: 128, percent: 50 },
    compressedClass: { used: 64, max: 128, percent: 50 }
  }
});

// 内存池数据
interface MemoryPool {
  name: string;
  type: 'HEAP' | 'NON_HEAP';
  used: string;
  committed: string;
  max: string;
  usage: number;
  status: string;
}

const memoryPools: Ref<MemoryPool[]> = ref([
  {
    name: 'PS Eden Space',
    type: 'HEAP',
    used: '256 MB',
    committed: '512 MB',
    max: '512 MB',
    usage: 50,
    status: '正常'
  },
  {
    name: 'PS Survivor Space',
    type: 'HEAP',
    used: '64 MB',
    committed: '128 MB',
    max: '128 MB',
    usage: 50,
    status: '正常'
  },
  {
    name: 'PS Old Gen',
    type: 'HEAP',
    used: '900 MB',
    committed: '1.4 GB',
    max: '2.8 GB',
    usage: 64.3,
    status: '正常'
  },
  {
    name: 'Metaspace',
    type: 'NON_HEAP',
    used: '128 MB',
    committed: '140 MB',
    max: '256 MB',
    usage: 50,
    status: '正常'
  },
  {
    name: 'Code Cache',
    type: 'NON_HEAP',
    used: '64 MB',
    committed: '80 MB',
    max: '128 MB',
    usage: 50,
    status: '正常'
  },
  {
    name: 'Compressed Class Space',
    type: 'NON_HEAP',
    used: '64 MB',
    committed: '70 MB',
    max: '128 MB',
    usage: 50,
    status: '正常'
  }
]);

// GC日志
interface GcLog {
  time: string;
  type: string;
  duration: string;
  before: string;
  after: string;
  reason: string;
}

const gcLogs: Ref<GcLog[]> = ref([
  {
    time: '2024-01-15 14:35:42',
    type: 'Young GC',
    duration: '8.5ms',
    before: '512MB',
    after: '256MB',
    reason: 'Allocation Failure'
  },
  {
    time: '2024-01-15 14:33:18',
    type: 'Young GC',
    duration: '9.2ms',
    before: '510MB',
    after: '248MB',
    reason: 'Allocation Failure'
  },
  {
    time: '2024-01-15 14:20:35',
    type: 'Old GC',
    duration: '156.3ms',
    before: '2.1GB',
    after: '900MB',
    reason: 'Ergonomics'
  },
  {
    time: '2024-01-15 14:18:22',
    type: 'Young GC',
    duration: '7.8ms',
    before: '508MB',
    after: '252MB',
    reason: 'Allocation Failure'
  },
  {
    time: '2024-01-15 14:15:45',
    type: 'Young GC',
    duration: '10.1ms',
    before: '515MB',
    after: '260MB',
    reason: 'Allocation Failure'
  },
  {
    time: '2024-01-15 14:10:12',
    type: 'Young GC',
    duration: '8.9ms',
    before: '511MB',
    after: '255MB',
    reason: 'Allocation Failure'
  },
  {
    time: '2024-01-15 14:05:33',
    type: 'Old GC',
    duration: '142.7ms',
    before: '2.3GB',
    after: '950MB',
    reason: 'Ergonomics'
  },
  {
    time: '2024-01-15 14:02:58',
    type: 'Young GC',
    duration: '9.5ms',
    before: '513MB',
    after: '258MB',
    reason: 'Allocation Failure'
  }
]);

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

function refreshMemoryData() {
  window.$message?.success('内存数据刷新成功');
  gcStats.value.youngGc.count += 1;
}

function forceGC() {
  window.$dialog?.warning({
    title: '确认操作',
    content: '确定要强制执行垃圾回收吗？\n\n注意:强制GC可能会暂停应用程序执行,影响性能。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      window.$message?.success('垃圾回收执行成功');
    }
  });
}

function clearGCLogs() {
  gcLogs.value = [];
  window.$message?.success('GC日志已清空');
}

let updateInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  updateInterval = setInterval(() => {
    // 随机更新堆内存使用率
    heapMemory.value.usagePercent = 55 + Math.random() * 10;
    // 随机更新非堆内存使用率
    nonHeapMemory.value.usagePercent = 48 + Math.random() * 6;
  }, 3000);
});

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
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
        <NButton type="primary" @click="refreshMemoryData">
          <template #icon>
            <SvgIcon icon="mdi:refresh" />
          </template>
          刷新数据
        </NButton>
        <NButton type="success" @click="forceGC">
          <template #icon>
            <SvgIcon icon="mdi:delete" />
          </template>
          强制GC
        </NButton>
      </div>
    </div>

    <!-- 垃圾回收统计概览 -->
    <div class="grid grid-cols-1 mb-6 gap-6 lg:grid-cols-2">
      <!-- Young GC 统计 -->
      <NCard size="small" class="gc-card gc-card-young">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="card-title mb-0 flex items-center gap-2">
            <SvgIcon icon="mdi:lightning-bolt" class="h-5 w-5 text-warning" />
            Young GC 统计
          </h3>
          <NTag type="warning" size="small">新生代</NTag>
        </div>
        <div class="space-y-4">
          <div class="stat-row">
            <span class="stat-label">垃圾回收次数</span>
            <span class="stat-value text-2xl">{{ gcStats.youngGc.count.toLocaleString() }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">总回收时间</span>
            <span class="stat-value text-xl text-warning">{{ gcStats.youngGc.totalTime }} 秒</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">平均回收时间</span>
            <span class="stat-value">{{ gcStats.youngGc.avgTime }} 毫秒</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">最大回收时间</span>
            <span class="stat-value">{{ gcStats.youngGc.maxTime }} 毫秒</span>
          </div>
          <div class="stat-row border-t-1 border-gray pt-3">
            <span class="stat-label text-sm">上次GC时间</span>
            <span class="stat-value text-sm">{{ gcStats.youngGc.lastGc }}</span>
          </div>
        </div>
      </NCard>

      <!-- Old GC 统计 -->
      <NCard size="small" class="gc-card gc-card-old">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="card-title mb-0 flex items-center gap-2">
            <SvgIcon icon="mdi:chart-line" class="h-5 w-5 text-error" />
            Old GC 统计
          </h3>
          <NTag type="error" size="small">老年代</NTag>
        </div>
        <div class="space-y-4">
          <div class="stat-row">
            <span class="stat-label">垃圾回收次数</span>
            <span class="stat-value text-2xl">{{ gcStats.oldGc.count }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">总回收时间</span>
            <span class="stat-value text-xl text-error">{{ gcStats.oldGc.totalTime }} 秒</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">平均回收时间</span>
            <span class="stat-value">{{ gcStats.oldGc.avgTime }} 毫秒</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">最大回收时间</span>
            <span class="stat-value">{{ gcStats.oldGc.maxTime }} 毫秒</span>
          </div>
          <div class="stat-row border-t-1 border-gray pt-3">
            <span class="stat-label text-sm">上次GC时间</span>
            <span class="stat-value text-sm">{{ gcStats.oldGc.lastGc }}</span>
          </div>
        </div>
      </NCard>
    </div>

    <!-- GC时间趋势图 -->
    <NCard size="small" class="card mb-6">
      <h3 class="card-title">
        <SvgIcon icon="mdi:chart-timeline-variant" class="h-5 w-5 text-primary" />
        GC时间趋势
      </h3>
      <div class="space-y-3">
        <div>
          <div class="mb-1 flex justify-between text-sm">
            <span class="text-gray-400">Young GC 时间占比</span>
            <span class="text-warning">{{ gcStats.youngGcPercent }}%</span>
          </div>
          <div class="gc-progress">
            <div class="gc-progress-fill gc-progress-young" :style="{ width: `${gcStats.youngGcPercent}%` }" />
          </div>
        </div>
        <div>
          <div class="mb-1 flex justify-between text-sm">
            <span class="text-gray-400">Old GC 时间占比</span>
            <span class="text-error">{{ gcStats.oldGcPercent }}%</span>
          </div>
          <div class="gc-progress">
            <div class="gc-progress-fill gc-progress-old" :style="{ width: `${gcStats.oldGcPercent}%` }" />
          </div>
        </div>
      </div>
    </NCard>

    <!-- 堆内存详情 -->
    <NCard size="small" class="card mb-6">
      <div class="mb-6 flex items-center justify-between">
        <h3 class="card-title mb-0">
          <SvgIcon icon="mdi:database" class="h-5 w-5 text-success" />
          堆内存详情
        </h3>
        <NTag type="success" size="small">Heap Memory</NTag>
      </div>

      <div class="grid grid-cols-1 mb-6 gap-6 lg:grid-cols-3">
        <div class="text-center">
          <div class="mb-1 text-3xl font-bold">{{ heapMemory.used }} GB</div>
          <div class="text-sm text-gray-400">已使用</div>
        </div>
        <div class="text-center">
          <div class="mb-1 text-3xl text-primary font-bold">{{ heapMemory.committed }} GB</div>
          <div class="text-sm text-gray-400">已分配</div>
        </div>
        <div class="text-center">
          <div class="mb-1 text-3xl text-success font-bold">{{ heapMemory.max }} GB</div>
          <div class="text-sm text-gray-400">最大值</div>
        </div>
      </div>

      <div class="mb-4">
        <div class="mb-2 flex justify-between text-sm">
          <span class="text-gray-400">堆内存使用率</span>
          <span class="font-semibold">{{ heapMemory.usagePercent.toFixed(1) }}%</span>
        </div>
        <NProgress
          type="line"
          :percentage="heapMemory.usagePercent"
          :height="16"
          :border-radius="8"
          :fill-border-radius="8"
          :show-indicator="false"
          processing
        />
      </div>

      <!-- 堆内存区域详情 -->
      <div class="mt-6 space-y-3">
        <h4 class="mb-3 text-sm text-gray-300 font-semibold">堆内存区域分布</h4>

        <!-- Eden Space -->
        <div class="memory-region">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-medium">Eden Space (伊甸园区)</span>
            <span class="text-sm text-warning">
              {{ heapMemory.regions.eden.used }} MB / {{ heapMemory.regions.eden.max }} MB
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="heapMemory.regions.eden.percent"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            :show-indicator="false"
            color="#eab308"
          />
        </div>

        <!-- Survivor Space -->
        <div class="memory-region">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-medium">Survivor Space (幸存者区)</span>
            <span class="text-sm text-info">
              {{ heapMemory.regions.survivor.used }} MB / {{ heapMemory.regions.survivor.max }} MB
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="heapMemory.regions.survivor.percent"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            :show-indicator="false"
            color="#06b6d4"
          />
        </div>

        <!-- Old Gen -->
        <div class="memory-region">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-medium">Old Gen (老年代)</span>
            <span class="text-sm text-error">
              {{ heapMemory.regions.oldGen.used }} MB / {{ heapMemory.regions.oldGen.max }} MB
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="heapMemory.regions.oldGen.percent"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            :show-indicator="false"
            color="#f97316"
          />
        </div>
      </div>
    </NCard>

    <!-- 非堆内存详情 -->
    <NCard size="small" class="card mb-6">
      <div class="mb-6 flex items-center justify-between">
        <h3 class="card-title mb-0">
          <SvgIcon icon="mdi:harddisk" class="h-5 w-5 text-purple-500" />
          非堆内存详情
        </h3>
        <NTag color="#a855f7" size="small">Non-Heap Memory</NTag>
      </div>

      <div class="grid grid-cols-1 mb-6 gap-6 lg:grid-cols-3">
        <div class="text-center">
          <div class="mb-1 text-3xl font-bold">{{ nonHeapMemory.used }} MB</div>
          <div class="text-sm text-gray-400">已使用</div>
        </div>
        <div class="text-center">
          <div class="mb-1 text-3xl text-primary font-bold">{{ nonHeapMemory.committed }} MB</div>
          <div class="text-sm text-gray-400">已分配</div>
        </div>
        <div class="text-center">
          <div class="mb-1 text-3xl text-purple-500 font-bold">{{ nonHeapMemory.max }} MB</div>
          <div class="text-sm text-gray-400">最大值</div>
        </div>
      </div>

      <div class="mb-4">
        <div class="mb-2 flex justify-between text-sm">
          <span class="text-gray-400">非堆内存使用率</span>
          <span class="font-semibold">{{ nonHeapMemory.usagePercent.toFixed(1) }}%</span>
        </div>
        <NProgress
          type="line"
          :percentage="nonHeapMemory.usagePercent"
          :height="16"
          :border-radius="8"
          :fill-border-radius="8"
          :show-indicator="false"
          color="#a855f7"
          rail-color="rgba(168, 85, 247, 0.2)"
        />
      </div>

      <!-- 非堆内存区域详情 -->
      <div class="mt-6 space-y-3">
        <h4 class="mb-3 text-sm text-gray-300 font-semibold">非堆内存区域分布</h4>

        <!-- Metaspace -->
        <div class="memory-region">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-medium">Metaspace (元空间)</span>
            <span class="text-sm text-purple-400">
              {{ nonHeapMemory.regions.metaspace.used }} MB / {{ nonHeapMemory.regions.metaspace.max }} MB
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="nonHeapMemory.regions.metaspace.percent"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            :show-indicator="false"
            color="#a855f7"
          />
        </div>

        <!-- Code Cache -->
        <div class="memory-region">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-medium">Code Cache (代码缓存)</span>
            <span class="text-sm text-pink-400">
              {{ nonHeapMemory.regions.codeCache.used }} MB / {{ nonHeapMemory.regions.codeCache.max }} MB
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="nonHeapMemory.regions.codeCache.percent"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            :show-indicator="false"
            color="#ec4899"
          />
        </div>

        <!-- Compressed Class Space -->
        <div class="memory-region">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-medium">Compressed Class Space (压缩类空间)</span>
            <span class="text-sm text-indigo-400">
              {{ nonHeapMemory.regions.compressedClass.used }} MB / {{ nonHeapMemory.regions.compressedClass.max }} MB
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="nonHeapMemory.regions.compressedClass.percent"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            :show-indicator="false"
            color="#6366f1"
          />
        </div>
      </div>
    </NCard>

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
                { type: row.type === 'HEAP' ? 'success' : 'info', size: 'small' },
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
              return h('span', { class: ['font-semibold', getUsageColor(row.usage)] }, row.usage.toFixed(1) + '%');
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
        <NButton size="small" type="error" quaternary @click="clearGCLogs">清空日志</NButton>
      </div>
      <NScrollbar class="gc-log-container">
        <div class="text-xs font-mono space-y-2">
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
  border: 1px solid var(--n-border-color);
}

.gc-card-young {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(234, 179, 8, 0.02) 100%);
  border-color: rgba(234, 179, 8, 0.2);
}

.gc-card-old {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
  border-color: rgba(239, 68, 68, 0.2);
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  color: var(--n-text-color-disabled);
  font-size: 14px;
}

.stat-value {
  color: var(--n-text-color);
  font-weight: 600;
  font-size: 16px;
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
