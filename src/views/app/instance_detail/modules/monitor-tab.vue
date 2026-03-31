<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
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
import { cancelCommandTask, fetchMonitorCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import { commandEnum } from '@/enum/commandEnums';
import EnhanceTaskRecords from '@/components/custom/enhance-task-records.vue';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { MonitorResponse } from '@/proto/command/result/MonitorResponse';

interface MonitorStats {
  timestamp: number;
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

const props = defineProps<Props>();

const message = useMessage();

const monitorFormRef = ref();
const isMonitoring = ref(false);
const currentTaskId = ref('');

const monitorConfig = ref({
  qualifiedClassName: '',
  methodName: '',
  cycle: 5
});

const currentStats = ref({
  totalCount: 0,
  successCount: 0,
  failCount: 0,
  avgTime: 0,
  maxTime: 0,
  successRate: 100
});

const monitorHistory = ref<MonitorStats[]>([]);
const qpsData = ref<number[]>([]);

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
async function startMonitor() {
  if (!monitorConfig.value.qualifiedClassName.trim()) {
    message.warning('请填写类名');
    return;
  }
  if (!monitorConfig.value.methodName.trim()) {
    message.warning('请填写方法名');
    return;
  }

  isMonitoring.value = true;
  monitorHistory.value = [];
  qpsData.value = [];

  currentStats.value = {
    totalCount: 0,
    successCount: 0,
    failCount: 0,
    avgTime: 0,
    maxTime: 0,
    successRate: 100
  };

  const { data: taskResponse, error } = await fetchMonitorCommand({
    instanceId: props.instanceId,
    param: {
      qualifiedClassName: monitorConfig.value.qualifiedClassName,
      methodName: monitorConfig.value.methodName,
      cycle: monitorConfig.value.cycle
    }
  });

  if (error) {
    isMonitoring.value = false;
    return;
  }
  if (taskResponse) {
    currentTaskId.value = taskResponse.taskId || '';
  }

  message.success('开始监控');
}

// 停止监控
async function stopMonitor() {
  if (currentTaskId.value) {
    await cancelCommandTask(props.instanceId, currentTaskId.value);
    currentTaskId.value = '';
  }
  isMonitoring.value = false;
  message.success('监控已停止');
}

// eventBus 回调
function handleMonitorResult(response: CommandExecuteResponse<MonitorResponse>) {
  const data = response.data as MonitorResponse | undefined;
  if (!data || data.state === 0) {
    if (data?.message) message.error(data.message);
    isMonitoring.value = false;
    return;
  }

  const stats: MonitorStats = {
    timestamp: data.timestamp,
    totalCount: data.totalCount,
    successCount: data.successCount,
    failCount: data.failCount,
    avgTime: data.avgTime,
    maxTime: data.maxTime,
    minTime: data.minTime,
    successRate: data.successRate,
    qps: data.qps
  };

  monitorHistory.value.unshift(stats);
  if (monitorHistory.value.length > 100) {
    monitorHistory.value.pop();
  }

  qpsData.value.unshift(Math.round(stats.qps));
  if (qpsData.value.length > 20) {
    qpsData.value.pop();
  }

  // 更新累计统计
  currentStats.value.totalCount += stats.totalCount;
  currentStats.value.successCount += stats.successCount;
  currentStats.value.failCount += stats.failCount;
  currentStats.value.avgTime = stats.avgTime;
  currentStats.value.maxTime = Math.max(currentStats.value.maxTime, stats.maxTime);
  currentStats.value.successRate =
    currentStats.value.totalCount > 0 ? (currentStats.value.successCount / currentStats.value.totalCount) * 100 : 100;
}

onMounted(() => {
  eventBus.on('command:monitor', handleMonitorResult);
});

onUnmounted(() => {
  eventBus.off('command:monitor', handleMonitorResult);
});

// 格式化时间
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
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
  monitorConfig.value.qualifiedClassName = 'com.example.service.UserService';
  monitorConfig.value.methodName = 'getUserById';
  monitorConfig.value.cycle = 5;
  message.success('已加载示例配置');
}

// 重置表单
function resetForm() {
  monitorConfig.value = {
    qualifiedClassName: '',
    methodName: '',
    cycle: 5
  };
  message.success('已重置表单');
}

// 导出结果
function exportResults() {
  if (monitorHistory.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  const blob = new Blob([JSON.stringify(monitorHistory.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'monitor-results.json';
  a.click();
  URL.revokeObjectURL(url);
  message.success('导出成功');
}

// 清空结果
function clearResults() {
  monitorHistory.value = [];
  qpsData.value = [];
  currentStats.value = {
    totalCount: 0,
    successCount: 0,
    failCount: 0,
    avgTime: 0,
    maxTime: 0,
    successRate: 100
  };
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
          <!-- 类名 -->
          <NGridItem :span="24">
            <NFormItem path="qualifiedClassName">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:package" class="text-14px" />
                  <span>类名</span>
                  <span class="text-12px text-gray-400">(完整类名)</span>
                </div>
              </template>
              <NInput
                v-model:value="monitorConfig.qualifiedClassName"
                placeholder="例如: com.example.service.UserService"
                class="font-mono"
                :disabled="isMonitoring"
              />
            </NFormItem>
          </NGridItem>

          <!-- 方法名 -->
          <NGridItem :span="12">
            <NFormItem path="methodName">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:list" class="text-14px" />
                  <span>方法名</span>
                </div>
              </template>
              <NInput
                v-model:value="monitorConfig.methodName"
                placeholder="例如: getUserById"
                class="font-mono"
                :disabled="isMonitoring"
              />
            </NFormItem>
          </NGridItem>

          <!-- 统计周期 -->
          <NGridItem :span="12">
            <NFormItem label="统计周期" path="cycle">
              <NInputNumber
                v-model:value="monitorConfig.cycle"
                :min="1"
                :max="60"
                placeholder="例如: 5"
                class="w-full"
                :disabled="isMonitoring"
              >
                <template #suffix>
                  <span class="text-12px text-gray-400">秒</span>
                </template>
              </NInputNumber>
              <template #feedback>
                <span class="text-12px text-gray-500">每隔多少秒统计一次（1-60秒）</span>
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
              <NButton :disabled="isMonitoring" @click="loadSample">
                <template #icon>
                  <SvgIcon icon="lucide:file-text" />
                </template>
                加载示例
              </NButton>
              <NButton :disabled="isMonitoring" @click="resetForm">
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

    <!-- Monitor 任务记录 -->
    <EnhanceTaskRecords
      :instance-id="props.instanceId"
      :command-code="commandEnum.MONITOR_METHOD.value as number"
      running-label="进行中的监控"
      recent-label="最近完成"
    />

    <!-- 监控状态 -->
    <NCard v-show="isMonitoring" size="small">
      <div class="flex-y-center justify-between">
        <div class="flex-y-center gap-16px">
          <div class="flex-y-center gap-8px">
            <div class="h-8px w-8px animate-pulse rounded-full bg-success"></div>
            <span class="text-14px">监控中...</span>
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
