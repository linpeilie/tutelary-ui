<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NStatistic,
  useMessage
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';

interface MonitorConfig {
  method: string;
  cycle: number;
  duration: number | null;
}

interface MonitorStats {
  timestamp: Date;
  totalCount: number;
  successCount: number;
  failCount: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  successRate: number;
  qps: number;
}

defineOptions({
  name: 'MonitorTab'
});

interface Props {
  instanceId: string;
}

defineProps<Props>();

const message = useMessage();

const monitorFormRef = ref();
const isMonitoring = ref(false);
const elapsedTime = ref('00:00');

const monitorConfig = reactive<MonitorConfig>({
  method: '',
  cycle: 5,
  duration: null
});

const currentStats = reactive({
  totalCount: 0,
  successCount: 0,
  failCount: 0,
  avgTime: 0,
  maxTime: 0,
  successRate: 100
});

const monitorHistory = ref<MonitorStats[]>([]);
const qpsData = ref<number[]>([]);
let monitorInterval: NodeJS.Timeout | null = null;
let timeInterval: NodeJS.Timeout | null = null;
let startTime: number = 0;

const resultInfo = computed(() => {
  if (monitorHistory.value.length === 0) return '';
  return `共 ${monitorHistory.value.length} 条统计记录`;
});

// 表格列配置
const columns: DataTableColumns<MonitorStats> = [
  {
    title: '时间',
    key: 'timestamp',
    width: 180,
    render: (row: MonitorStats) => formatTime(row.timestamp)
  },
  {
    title: '调用次数',
    key: 'totalCount',
    width: 100,
    align: 'right'
  },
  {
    title: '成功次数',
    key: 'successCount',
    width: 100,
    align: 'right'
  },
  {
    title: '失败次数',
    key: 'failCount',
    width: 100,
    align: 'right'
  },
  {
    title: '平均耗时 (ms)',
    key: 'avgTime',
    width: 130,
    align: 'right'
  },
  {
    title: '最大耗时 (ms)',
    key: 'maxTime',
    width: 130,
    align: 'right'
  },
  {
    title: '最小耗时 (ms)',
    key: 'minTime',
    width: 130,
    align: 'right'
  },
  {
    title: '成功率',
    key: 'successRate',
    width: 100,
    align: 'right',
    render: (row: MonitorStats) => `${row.successRate.toFixed(2)}%`
  }
];

// 开始监控
function startMonitor() {
  if (!monitorConfig.method.trim()) {
    message.warning('请填写监控方法');
    return;
  }

  // 解析方法
  const lastDotIndex = monitorConfig.method.lastIndexOf('.');
  if (lastDotIndex === -1) {
    message.error(`方法格式错误: "${monitorConfig.method}"。正确格式：类名.方法名`);
    return;
  }

  isMonitoring.value = true;
  monitorHistory.value = [];
  qpsData.value = [];
  startTime = Date.now();

  // 重置当前统计
  currentStats.totalCount = 0;
  currentStats.successCount = 0;
  currentStats.failCount = 0;
  currentStats.avgTime = 0;
  currentStats.maxTime = 0;
  currentStats.successRate = 100;

  // 计时器
  timeInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    elapsedTime.value = `${minutes}:${seconds}`;

    // 检查是否超过设定时长
    if (monitorConfig.duration && elapsed >= monitorConfig.duration * 60) {
      stopMonitor();
    }
  }, 1000);

  // 周期性统计
  monitorInterval = setInterval(() => {
    collectStats();
  }, monitorConfig.cycle * 1000);

  // 立即执行一次统计
  collectStats();

  message.success('开始监控');
}

// 停止监控
function stopMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
  isMonitoring.value = false;
  message.success('监控已停止');
}

// 收集统计数据
function collectStats() {
  // 生成模拟统计数据
  const totalCount = Math.floor(Math.random() * 100) + 20;
  const failCount = Math.floor(Math.random() * (totalCount * 0.1));
  const successCount = totalCount - failCount;
  const avgTime = Math.floor(Math.random() * 200) + 50;
  const maxTime = avgTime + Math.floor(Math.random() * 300);
  const minTime = Math.max(10, avgTime - Math.floor(Math.random() * 30));
  const successRate = (successCount / totalCount) * 100;
  const qps = totalCount / monitorConfig.cycle;

  const stats: MonitorStats = {
    timestamp: new Date(),
    totalCount,
    successCount,
    failCount,
    avgTime,
    maxTime,
    minTime,
    successRate,
    qps
  };

  // 保存到历史
  monitorHistory.value.unshift(stats);
  if (monitorHistory.value.length > 100) {
    monitorHistory.value.pop();
  }

  // 保存 QPS 数据
  qpsData.value.unshift(Math.round(qps));
  if (qpsData.value.length > 20) {
    qpsData.value.pop();
  }

  // 更新当前统计
  currentStats.totalCount += totalCount;
  currentStats.successCount += successCount;
  currentStats.failCount += failCount;
  currentStats.avgTime = avgTime;
  currentStats.maxTime = Math.max(currentStats.maxTime, maxTime);
  currentStats.successRate = (currentStats.successCount / currentStats.totalCount) * 100;
}

// 格式化时间
function formatTime(date: Date): string {
  return date.toLocaleString('zh-CN');
}

// 获取 QPS 图表高度百分比
function getQpsBarHeight(qps: number): number {
  const maxQps = Math.max(...qpsData.value, 1);
  return (qps / maxQps) * 100;
}

// 获取 QPS 图表颜色
function getQpsBarColor(qps: number): string {
  const maxQps = Math.max(...qpsData.value, 1);
  const percentage = (qps / maxQps) * 100;
  if (percentage > 80) return 'bg-primary';
  if (percentage > 50) return 'bg-warning';
  return 'bg-info';
}

// 加载示例
function loadSample() {
  monitorConfig.method = 'com.example.service.UserService.getUserById';
  monitorConfig.cycle = 5;
  monitorConfig.duration = 10;
  message.success('已加载示例配置');
}

// 重置表单
function resetForm() {
  monitorConfig.method = '';
  monitorConfig.cycle = 5;
  monitorConfig.duration = null;
  message.success('已重置表单');
}

// 导出结果
function exportResults() {
  if (monitorHistory.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  message.success('导出功能开发中');
}

// 清空结果
function clearResults() {
  monitorHistory.value = [];
  qpsData.value = [];
  currentStats.totalCount = 0;
  currentStats.successCount = 0;
  currentStats.failCount = 0;
  currentStats.avgTime = 0;
  currentStats.maxTime = 0;
  currentStats.successRate = 100;
  message.success('已清空结果');
}
</script>

<template>
  <div class="flex flex-col gap-16px">
    <!-- Monitor 配置表单 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center gap-8px">
          <SvgIcon icon="lucide:activity" class="text-18px" />
          <span class="font-semibold">方法执行监控配置</span>
        </div>
      </template>

      <NForm ref="monitorFormRef" :model="monitorConfig" label-placement="top">
        <NGrid :cols="24" :x-gap="16" :y-gap="16">
          <!-- 监控方法 -->
          <NGridItem :span="24">
            <NFormItem path="method">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:package" class="text-14px" />
                  <span>监控方法</span>
                  <span class="text-12px text-gray-400">(格式: 类名.方法名)</span>
                </div>
              </template>
              <NInput
                v-model:value="monitorConfig.method"
                placeholder="例如: com.example.service.UserService.getUserById"
                class="font-mono"
              />
            </NFormItem>
          </NGridItem>

          <!-- 统计周期 -->
          <NGridItem :span="12">
            <NFormItem label="统计周期" path="cycle">
              <NInputNumber v-model:value="monitorConfig.cycle" :min="1" :max="60" placeholder="例如: 5" class="w-full">
                <template #suffix>
                  <span class="text-12px text-gray-400">秒</span>
                </template>
              </NInputNumber>
              <template #feedback>
                <span class="text-12px text-gray-500">每隔多少秒统计一次（1-60秒）</span>
              </template>
            </NFormItem>
          </NGridItem>

          <!-- 监控时长 -->
          <NGridItem :span="12">
            <NFormItem path="duration">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:clock" class="text-14px" />
                  <span>监控时长</span>
                  <span class="text-12px text-gray-400">(可选)</span>
                </div>
              </template>
              <NInputNumber v-model:value="monitorConfig.duration" :min="1" placeholder="例如: 10" class="w-full">
                <template #suffix>
                  <span class="text-12px text-gray-400">分钟</span>
                </template>
              </NInputNumber>
              <template #feedback>
                <span class="text-12px text-gray-500">留空则持续监控，直到手动停止</span>
              </template>
            </NFormItem>
          </NGridItem>

          <!-- 操作按钮 -->
          <NGridItem :span="24">
            <div class="flex-y-center gap-12px">
              <NButton v-if="!isMonitoring" type="primary" @click="startMonitor">
                <template #icon>
                  <SvgIcon icon="lucide:play" />
                </template>
                开始监控
              </NButton>
              <NButton v-if="isMonitoring" type="error" @click="stopMonitor">
                <template #icon>
                  <SvgIcon icon="lucide:square" />
                </template>
                停止监控
              </NButton>
              <NButton @click="loadSample">
                <template #icon>
                  <SvgIcon icon="lucide:file-text" />
                </template>
                加载示例
              </NButton>
              <NButton @click="resetForm">
                <template #icon>
                  <SvgIcon icon="lucide:refresh-cw" />
                </template>
                重置表单
              </NButton>
            </div>
          </NGridItem>
        </NGrid>
      </NForm>
    </NCard>

    <!-- 监控状态 -->
    <NCard v-show="isMonitoring" size="small">
      <div class="flex-y-center justify-between">
        <div class="flex-y-center gap-16px">
          <div class="flex-y-center gap-8px">
            <div class="h-8px w-8px animate-pulse rounded-full bg-success"></div>
            <span class="text-14px">监控中...</span>
          </div>
          <div class="text-14px text-gray">
            已运行:
            <span class="text-success font-semibold">{{ elapsedTime }}</span>
          </div>
          <div class="text-14px text-gray">
            统计周期:
            <span class="font-semibold">{{ monitorConfig.cycle }}</span>
            秒
          </div>
        </div>
      </div>
    </NCard>

    <!-- 实时统计数据 -->
    <div v-show="monitorHistory.length > 0">
      <NGrid :cols="24" :x-gap="16" :y-gap="16">
        <!-- 总调用次数 -->
        <NGridItem :span="6">
          <NCard size="small">
            <NStatistic label="总调用次数" :value="currentStats.totalCount">
              <template #prefix>
                <SvgIcon icon="lucide:hash" class="text-primary" />
              </template>
            </NStatistic>
            <div class="mt-8px text-12px text-gray">
              成功:
              <span class="text-success">{{ currentStats.successCount }}</span>
              / 失败:
              <span class="text-error">{{ currentStats.failCount }}</span>
            </div>
          </NCard>
        </NGridItem>

        <!-- 平均耗时 -->
        <NGridItem :span="6">
          <NCard size="small">
            <NStatistic label="平均耗时" :value="currentStats.avgTime">
              <template #prefix>
                <SvgIcon icon="lucide:trending-up" class="text-warning" />
              </template>
              <template #suffix>
                <span class="text-14px">ms</span>
              </template>
            </NStatistic>
            <div class="mt-8px text-12px text-gray">本周期平均响应时间</div>
          </NCard>
        </NGridItem>

        <!-- 最大耗时 -->
        <NGridItem :span="6">
          <NCard size="small">
            <NStatistic label="最大耗时" :value="currentStats.maxTime">
              <template #prefix>
                <SvgIcon icon="lucide:arrow-up" class="text-error" />
              </template>
              <template #suffix>
                <span class="text-14px">ms</span>
              </template>
            </NStatistic>
            <div class="mt-8px text-12px text-gray">峰值响应时间</div>
          </NCard>
        </NGridItem>

        <!-- 成功率 -->
        <NGridItem :span="6">
          <NCard size="small">
            <NStatistic label="成功率" :value="currentStats.successRate.toFixed(2)">
              <template #prefix>
                <SvgIcon icon="lucide:check-circle" class="text-success" />
              </template>
              <template #suffix>
                <span class="text-14px">%</span>
              </template>
            </NStatistic>
            <div class="mt-8px text-12px text-gray">调用成功比例</div>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 统计图表 -->
      <NGrid :cols="24" :x-gap="16" :y-gap="16" class="mt-16px">
        <!-- QPS 趋势图 -->
        <NGridItem :span="12">
          <NCard size="small">
            <template #header>
              <div class="flex-y-center gap-8px">
                <SvgIcon icon="lucide:bar-chart" class="text-primary" />
                <span class="text-14px font-semibold">QPS 趋势</span>
              </div>
            </template>
            <div class="h-200px flex items-end gap-4px">
              <div
                v-for="(qps, index) in qpsData.slice().reverse()"
                :key="index"
                class="flex-1 rounded-t-4px transition-all"
                :class="getQpsBarColor(qps)"
                :style="{ height: `${getQpsBarHeight(qps)}%` }"
                :title="`QPS: ${qps}`"
              ></div>
            </div>
          </NCard>
        </NGridItem>

        <!-- 成功率图表 -->
        <NGridItem :span="12">
          <NCard size="small">
            <template #header>
              <div class="flex-y-center gap-8px">
                <SvgIcon icon="lucide:pie-chart" class="text-success" />
                <span class="text-14px font-semibold">成功/失败分布</span>
              </div>
            </template>
            <div class="h-200px flex items-center justify-center">
              <div class="text-center">
                <div class="mb-8px text-60px text-success font-bold">
                  {{ currentStats.successRate.toFixed(0) }}
                </div>
                <div class="mb-16px text-14px text-gray">成功率 %</div>
                <div class="flex-y-center justify-center gap-16px">
                  <div class="flex-y-center gap-8px">
                    <div class="h-12px w-12px rounded-full bg-success"></div>
                    <span class="text-12px text-gray">成功</span>
                  </div>
                  <div class="flex-y-center gap-8px">
                    <div class="h-12px w-12px rounded-full bg-error"></div>
                    <span class="text-12px text-gray">失败</span>
                  </div>
                </div>
              </div>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>

    <!-- 统计记录 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:list" class="text-16px" />
            <span class="font-semibold">统计记录</span>
            <span v-if="resultInfo" class="text-12px text-gray">{{ resultInfo }}</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NButton size="small" @click="exportResults">
              <template #icon>
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="clearResults">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="monitorHistory.length === 0" class="py-48px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
        </div>
        <div class="text-14px">暂无监控数据</div>
        <div class="mt-4px text-12px text-gray">填写配置并点击"开始监控"</div>
      </div>

      <NDataTable v-else :columns="columns" :data="monitorHistory" :bordered="false" size="small" />
    </NCard>
  </div>
</template>

<style scoped></style>
