<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NStatistic, NTag } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { fetchTimeTunnelCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { TimeTunnelResponse } from '@/proto/command/result/TimeTunnelResponse';

interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

// TimeTunnel 配置
interface TTConfig {
  qualifiedClassName: string;
  methodName: string;
  condition: string;
  maxCount: number;
  costThreshold: number | null;
}

const ttConfig = ref<TTConfig>({
  qualifiedClassName: '',
  methodName: '',
  condition: '',
  maxCount: 100,
  costThreshold: null
});

// 快照记录
interface TTSnapshot {
  index: number;
  finishTime: string;
  className: string;
  methodName: string;
  cost: number;
  hasException: boolean;
  params: string;
  targetClassName: string;
  targetHashCode: string;
  returnType: string;
  returnValue: string;
  exceptionType: string;
  exceptionMessage: string;
  exceptionStackTrace: string[];
}

const ttRecords = ref<TTSnapshot[]>([]);
const isRecording = ref(false);
const currentFilter = ref<'all' | 'success' | 'exception'>('all');
const selectedSnapshot = ref<TTSnapshot | null>(null);
const showDetailModal = ref(false);

// 筛选选项
const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '仅成功', value: 'success' },
  { label: '仅异常', value: 'exception' }
];

// 统计数据
const stats = computed(() => {
  const total = ttRecords.value.length;
  const success = ttRecords.value.filter(r => !r.hasException).length;
  const error = ttRecords.value.filter(r => r.hasException).length;
  const avgCost = total > 0 ? Math.floor(ttRecords.value.reduce((sum, r) => sum + r.cost, 0) / total) : 0;

  return { total, success, error, avgCost };
});

// 过滤后的记录
const filteredRecords = computed(() => {
  if (currentFilter.value === 'all') return ttRecords.value;
  if (currentFilter.value === 'success') return ttRecords.value.filter(r => !r.hasException);
  return ttRecords.value.filter(r => r.hasException);
});

// 开始记录
const startRecording = () => {
  if (!ttConfig.value.qualifiedClassName.trim()) {
    window.$message?.warning('请填写类名');
    return;
  }
  if (!ttConfig.value.methodName.trim()) {
    window.$message?.warning('请填写方法名');
    return;
  }

  isRecording.value = true;
  ttRecords.value = [];

  fetchTimeTunnelCommand({
    instanceId: props.instanceId,
    param: {
      qualifiedClassName: ttConfig.value.qualifiedClassName,
      methodName: ttConfig.value.methodName,
      condition: ttConfig.value.condition,
      maxCount: ttConfig.value.maxCount,
      costThreshold: ttConfig.value.costThreshold || 0
    }
  }).catch(() => {
    isRecording.value = false;
  });

  window.$message?.success('开始记录方法调用快照');
};

// 停止记录
const stopRecording = () => {
  isRecording.value = false;
  window.$message?.info('TimeTunnel 记录已停止');
};

// eventBus 回调
function handleTimeTunnelResult(response: CommandExecuteResponse<TimeTunnelResponse>) {
  const data = response.data as TimeTunnelResponse | undefined;
  if (!data || data.state === 0) {
    if (data?.message) window.$message?.error(data.message);
    isRecording.value = false;
    return;
  }

  const snapshot: TTSnapshot = {
    index: data.index,
    finishTime: data.finishTime,
    className: data.className,
    methodName: data.methodName,
    cost: data.cost,
    hasException: data.hasException,
    params: data.params,
    targetClassName: data.targetClassName,
    targetHashCode: data.targetHashCode,
    returnType: data.returnType,
    returnValue: data.returnValue,
    exceptionType: data.exceptionType,
    exceptionMessage: data.exceptionMessage,
    exceptionStackTrace: data.exceptionStackTrace || []
  };

  ttRecords.value.unshift(snapshot);
  if (ttRecords.value.length > ttConfig.value.maxCount) {
    ttRecords.value.pop();
  }

  if (ttConfig.value.maxCount > 0 && ttRecords.value.length >= ttConfig.value.maxCount) {
    isRecording.value = false;
    window.$message?.success(`记录完成,共捕获 ${ttRecords.value.length} 个快照`);
  }
}

onMounted(() => {
  eventBus.on('command:time-tunnel', handleTimeTunnelResult);
});

onUnmounted(() => {
  eventBus.off('command:time-tunnel', handleTimeTunnelResult);
});

// 加载示例
const loadSample = () => {
  ttConfig.value = {
    qualifiedClassName: 'com.example.service.UserService',
    methodName: 'getUserById',
    condition: '',
    maxCount: 100,
    costThreshold: null
  };
};

// 重置配置
const resetConfig = () => {
  if (isRecording.value) {
    stopRecording();
  }
  ttConfig.value = {
    qualifiedClassName: '',
    methodName: '',
    condition: '',
    maxCount: 100,
    costThreshold: null
  };
  ttRecords.value = [];
};

// 导出记录
const exportRecords = () => {
  const data = filteredRecords.value;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'timetunnel-snapshots.json';
  a.click();
  URL.revokeObjectURL(url);
  window.$message?.success('导出成功');
};

// 清空记录
const clearRecords = () => {
  ttRecords.value = [];
  window.$message?.success('已清空所有快照');
};

// 显示快照详情
const showDetail = (snapshot: TTSnapshot) => {
  selectedSnapshot.value = snapshot;
  showDetailModal.value = true;
};

// 关闭详情
const closeDetail = () => {
  showDetailModal.value = false;
  selectedSnapshot.value = null;
};

// 复制快照数据
const copySnapshot = () => {
  if (!selectedSnapshot.value) return;

  const data = JSON.stringify(selectedSnapshot.value, null, 2);
  navigator.clipboard.writeText(data).then(() => {
    window.$message?.success('快照数据已复制到剪贴板');
  });
};

// 格式化时间
const formatTime = (finishTime: string) => {
  return finishTime || '-';
};

// 获取耗时颜色
const getCostColor = (cost: number) => {
  if (cost < 100) return 'success';
  if (cost < 300) return 'warning';
  return 'error';
};
</script>

<template>
  <div class="h-full flex flex-col gap-16px">
    <!-- TimeTunnel 配置表单 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center gap-8px">
          <SvgIcon icon="lucide:clock" class="text-16px text-purple" />
          <span class="font-semibold">TimeTunnel 配置 (时空隧道)</span>
        </div>
      </template>

      <NForm label-placement="top" label-width="auto">
        <NFormItem label="类名" required>
          <template #label>
            <span>
              类名
              <span class="text-error">*</span>
            </span>
            <span class="ml-8px text-12px text-gray font-normal">(完整类名)</span>
          </template>
          <NInput
            v-model:value="ttConfig.qualifiedClassName"
            placeholder="例如: com.example.service.UserService"
            :disabled="isRecording"
            class="font-mono"
          />
        </NFormItem>

        <NFormItem label="方法名" required>
          <template #label>
            <span>
              方法名
              <span class="text-error">*</span>
            </span>
          </template>
          <NInput
            v-model:value="ttConfig.methodName"
            placeholder="例如: getUserById"
            :disabled="isRecording"
            class="font-mono"
          />
        </NFormItem>

        <div class="grid grid-cols-1 gap-16px md:grid-cols-3">
          <NFormItem label="条件表达式">
            <template #label>
              <span>条件表达式</span>
              <span class="ml-8px text-12px text-gray font-normal">(可选)</span>
            </template>
            <NInput
              v-model:value="ttConfig.condition"
              placeholder="例如: params[0] > 100"
              :disabled="isRecording"
              class="font-mono"
            />
          </NFormItem>

          <NFormItem label="最大记录数">
            <NInputNumber
              v-model:value="ttConfig.maxCount"
              :min="1"
              :max="1000"
              :disabled="isRecording"
              class="w-full"
            />
          </NFormItem>

          <NFormItem label="耗时阈值 (ms)">
            <template #label>
              <span>耗时阈值 (ms)</span>
              <span class="ml-8px text-12px text-gray font-normal">(可选)</span>
            </template>
            <NInputNumber
              v-model:value="ttConfig.costThreshold"
              :min="0"
              placeholder="仅记录超过此耗时的调用"
              :disabled="isRecording"
              class="w-full"
            />
          </NFormItem>
        </div>

        <div class="flex-y-center gap-8px pt-8px">
          <NButton v-if="!isRecording" type="primary" @click="startRecording">
            <template #icon>
              <SvgIcon icon="lucide:play" />
            </template>
            开始记录
          </NButton>
          <NButton v-else type="error" @click="stopRecording">
            <template #icon>
              <SvgIcon icon="lucide:square" />
            </template>
            停止记录
          </NButton>
          <NButton :disabled="isRecording" @click="loadSample">
            <template #icon>
              <SvgIcon icon="lucide:file-code" />
            </template>
            加载示例
          </NButton>
          <NButton @click="resetConfig">
            <template #icon>
              <SvgIcon icon="lucide:rotate-ccw" />
            </template>
            重置
          </NButton>
        </div>
      </NForm>
    </NCard>

    <!-- 记录状态 -->
    <NCard v-if="isRecording" size="small">
      <div class="flex-y-center justify-between">
        <div class="flex-y-center gap-16px">
          <div class="flex-y-center gap-8px">
            <div class="h-12px w-12px animate-pulse rounded-full bg-purple"></div>
            <span class="text-14px text-gray">正在记录...</span>
          </div>
          <div class="text-14px text-gray">
            已记录:
            <span class="text-purple font-semibold">{{ ttRecords.length }}</span>
            个快照
          </div>
        </div>
      </div>
    </NCard>

    <!-- 快照统计 -->
    <div v-if="ttRecords.length > 0" class="grid grid-cols-1 gap-16px lg:grid-cols-4">
      <NCard size="small">
        <NStatistic label="总快照数" :value="stats.total">
          <template #prefix>
            <SvgIcon icon="lucide:database" class="text-purple" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="成功调用" :value="stats.success">
          <template #prefix>
            <SvgIcon icon="lucide:check-circle" class="text-success" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="异常调用" :value="stats.error">
          <template #prefix>
            <SvgIcon icon="lucide:alert-circle" class="text-error" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="平均耗时" :value="stats.avgCost">
          <template #prefix>
            <SvgIcon icon="lucide:clock" class="text-warning" />
          </template>
          <template #suffix>
            <span class="ml-4px text-14px">ms</span>
          </template>
        </NStatistic>
      </NCard>
    </div>

    <!-- 快照记录列表 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:list" class="text-16px text-purple" />
            <span class="font-semibold">调用快照</span>
            <span v-if="ttRecords.length > 0" class="text-12px text-gray">({{ stats.total }} 个快照)</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NSelect v-model:value="currentFilter" :options="filterOptions" size="small" class="w-120px" />
            <NButton size="small" @click="exportRecords">
              <template #icon>
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="clearRecords">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="ttRecords.length === 0" class="py-48px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
        </div>
        <div class="text-14px">暂无快照记录</div>
        <div class="mt-4px text-12px text-gray">填写配置并点击"开始记录"</div>
      </div>

      <div v-else-if="filteredRecords.length === 0" class="py-32px text-center text-gray">
        <div class="text-14px">没有符合条件的快照</div>
      </div>

      <div v-else class="space-y-12px">
        <div v-for="record in filteredRecords" :key="record.index" class="flex gap-16px">
          <!-- 时间轴线 -->
          <div class="flex flex-col items-center">
            <div
              class="h-40px w-40px flex-center border-2 rounded-full"
              :class="[record.hasException ? 'border-error bg-error/20' : 'border-success bg-success/20']"
            >
              <SvgIcon
                :icon="record.hasException ? 'lucide:x-circle' : 'lucide:check-circle'"
                :class="[record.hasException ? 'text-error' : 'text-success']"
                class="text-20px"
              />
            </div>
            <div class="mt-8px w-2px flex-1 bg-gray/20"></div>
          </div>

          <!-- 快照内容 -->
          <div class="flex-1 pb-24px">
            <div
              class="cursor-pointer border rounded-12px p-16px transition hover:shadow-lg"
              :class="[
                record.hasException ? 'border-error/30 hover:border-error' : 'border-success/30 hover:border-success'
              ]"
              @click="showDetail(record)"
            >
              <div class="mb-12px flex items-start justify-between">
                <div class="flex-1">
                  <div class="mb-4px flex-y-center gap-8px">
                    <span class="text-12px text-gray font-mono">#{{ record.index }}</span>
                    <span class="text-12px text-gray">{{ formatTime(record.finishTime) }}</span>
                    <NTag :type="getCostColor(record.cost)" size="small">{{ record.cost }}ms</NTag>
                  </div>
                  <code class="text-14px text-primary">{{ record.className }}.{{ record.methodName }}</code>
                </div>
              </div>

              <div class="text-12px text-gray">
                <div v-if="record.hasException" class="flex-y-center gap-8px text-error">
                  <SvgIcon icon="lucide:alert-triangle" class="text-12px" />
                  <span>{{ record.exceptionType }}: {{ record.exceptionMessage }}</span>
                </div>
                <div v-else class="flex-y-center gap-8px text-success">
                  <SvgIcon icon="lucide:check" class="text-12px" />
                  <span>调用成功，返回: {{ record.returnType }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 快照详情模态框 -->
    <div
      v-if="showDetailModal && selectedSnapshot"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-16px"
      @click.self="closeDetail"
    >
      <div
        class="max-h-[90vh] max-w-4xl w-full flex flex-col overflow-hidden border border-gray/30 rounded-12px bg-container"
      >
        <!-- 头部 -->
        <div class="flex-y-center justify-between border-b border-gray/10 p-24px">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:eye" class="text-20px text-purple" />
            <h3 class="text-18px font-semibold">快照详情</h3>
            <span class="text-14px text-gray">#{{ selectedSnapshot.index }}</span>
          </div>
          <NButton quaternary circle @click="closeDetail">
            <template #icon>
              <SvgIcon icon="lucide:x" class="text-20px" />
            </template>
          </NButton>
        </div>

        <!-- 内容 -->
        <div class="flex-1 overflow-y-auto p-24px">
          <div class="space-y-24px">
            <!-- 基本信息 -->
            <div class="border border-gray/20 rounded-8px bg-container/50 p-16px">
              <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
                <SvgIcon icon="lucide:info" class="text-16px text-purple" />
                基本信息
              </h4>
              <div class="grid grid-cols-2 gap-12px text-12px">
                <div>
                  <span class="text-gray">时间:</span>
                  <span class="ml-8px">{{ selectedSnapshot.finishTime }}</span>
                </div>
                <div>
                  <span class="text-gray">耗时:</span>
                  <NTag :type="getCostColor(selectedSnapshot.cost)" size="small" class="ml-8px">
                    {{ selectedSnapshot.cost }} ms
                  </NTag>
                </div>
                <div class="col-span-2">
                  <span class="text-gray">方法:</span>
                  <code class="ml-8px text-primary">{{ selectedSnapshot.className }}.{{ selectedSnapshot.methodName }}</code>
                </div>
              </div>
            </div>

            <!-- 参数 -->
            <div v-if="selectedSnapshot.params" class="border border-gray/20 rounded-8px bg-container/50 p-16px">
              <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
                <SvgIcon icon="lucide:package" class="text-16px text-info" />
                参数
              </h4>
              <div class="overflow-x-auto rounded-6px bg-black/20 p-12px">
                <pre class="text-12px font-mono">{{ selectedSnapshot.params }}</pre>
              </div>
            </div>

            <!-- 目标对象 -->
            <div class="border border-gray/20 rounded-8px bg-container/50 p-16px">
              <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
                <SvgIcon icon="lucide:target" class="text-16px text-success" />
                目标对象
              </h4>
              <div class="text-12px space-y-8px">
                <div>
                  <span class="text-gray">类名:</span>
                  <code class="ml-8px text-primary">{{ selectedSnapshot.targetClassName }}</code>
                </div>
                <div>
                  <span class="text-gray">HashCode:</span>
                  <code class="ml-8px text-warning font-mono">{{ selectedSnapshot.targetHashCode }}</code>
                </div>
              </div>
            </div>

            <!-- 返回值 -->
            <div v-if="selectedSnapshot.returnValue && !selectedSnapshot.hasException" class="border border-gray/20 rounded-8px bg-container/50 p-16px">
              <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
                <SvgIcon icon="lucide:corner-down-left" class="text-16px text-success" />
                返回值
              </h4>
              <div class="text-12px space-y-8px">
                <div>
                  <span class="text-gray">类型:</span>
                  <span class="ml-8px text-warning">{{ selectedSnapshot.returnType }}</span>
                </div>
                <div>
                  <span class="text-gray">值:</span>
                  <pre class="ml-8px mt-8px overflow-x-auto rounded-6px bg-black/20 p-12px text-11px font-mono">{{ selectedSnapshot.returnValue }}</pre>
                </div>
              </div>
            </div>

            <!-- 异常 -->
            <div v-if="selectedSnapshot.hasException" class="border border-error/20 rounded-8px bg-error/5 p-16px">
              <h4 class="mb-12px flex-y-center gap-8px text-14px text-error font-semibold">
                <SvgIcon icon="lucide:alert-triangle" class="text-16px" />
                异常
              </h4>
              <div class="text-12px space-y-12px">
                <div>
                  <span class="text-gray">类型:</span>
                  <span class="ml-8px text-error">{{ selectedSnapshot.exceptionType }}</span>
                </div>
                <div>
                  <span class="text-gray">消息:</span>
                  <div class="ml-8px mt-4px text-error">{{ selectedSnapshot.exceptionMessage }}</div>
                </div>
                <div v-if="selectedSnapshot.exceptionStackTrace.length > 0">
                  <span class="text-gray">堆栈跟踪:</span>
                  <pre
                    class="ml-8px mt-8px overflow-x-auto rounded-6px bg-black/20 p-12px text-11px text-error font-mono"
                    >{{ selectedSnapshot.exceptionStackTrace.join('\n') }}</pre
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="flex-y-center justify-end border-t border-gray/10 bg-container/50 p-24px">
          <div class="flex-y-center gap-8px">
            <NButton @click="copySnapshot">
              <template #icon>
                <SvgIcon icon="lucide:copy" />
              </template>
              复制数据
            </NButton>
            <NButton @click="closeDetail">关闭</NButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
