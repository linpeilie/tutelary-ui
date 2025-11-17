<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NStatistic, NTag } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  instanceId: string;
}

defineProps<Props>();

// TimeTunnel 配置
interface TTConfig {
  method: string;
  condition: 'all' | 'exception' | 'success';
  maxCount: number;
  costThreshold: number | null;
}

const ttConfig = ref<TTConfig>({
  method: '',
  condition: 'all',
  maxCount: 100,
  costThreshold: null
});

// 快照记录
interface TTSnapshot {
  index: number;
  timestamp: Date;
  className: string;
  methodName: string;
  fullName: string;
  cost: number;
  hasException: boolean;
  parameters: Array<{ type: string; value: any }>;
  target: {
    className: string;
    hashCode: string;
  };
  returnValue: {
    type: string;
    value: any;
  } | null;
  exception: {
    type: string;
    message: string;
    stackTrace: string[];
  } | null;
}

const ttRecords = ref<TTSnapshot[]>([]);
const isRecording = ref(false);
const recordedCount = ref(0);
const exceptionCount = ref(0);
const currentFilter = ref<'all' | 'success' | 'exception'>('all');
const selectedSnapshot = ref<TTSnapshot | null>(null);
const showDetailModal = ref(false);

let recordingInterval: number | null = null;
let snapshotIdCounter = 1;

// 条件选项
const conditionOptions = [
  { label: '所有调用', value: 'all' },
  { label: '仅异常', value: 'exception' },
  { label: '仅成功', value: 'success' }
];

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

// 停止记录
const stopRecording = () => {
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
  isRecording.value = false;
  window.$message?.info('TimeTunnel 记录已停止');
};

// 捕获快照
const captureSnapshot = () => {
  const lastDotIndex = ttConfig.value.method.lastIndexOf('.');
  const className = ttConfig.value.method.substring(0, lastDotIndex);
  const methodName = ttConfig.value.method.substring(lastDotIndex + 1);

  // 生成模拟快照数据
  const hasException = Math.random() < 0.15; // 15% 概率异常
  const cost = Math.floor(Math.random() * 500) + 20;

  // 检查条件
  if (ttConfig.value.condition === 'exception' && !hasException) return;
  if (ttConfig.value.condition === 'success' && hasException) return;
  if (ttConfig.value.costThreshold && cost < ttConfig.value.costThreshold) return;

  const snapshot: TTSnapshot = {
    index: snapshotIdCounter,
    timestamp: new Date(),
    className,
    methodName,
    fullName: ttConfig.value.method,
    cost,
    hasException,
    parameters: hasException
      ? [{ type: 'Long', value: null }]
      : [{ type: 'Long', value: Math.floor(Math.random() * 1000) + 1 }],
    target: {
      className,
      hashCode: `0x${Math.floor(Math.random() * 0xffffffff).toString(16)}`
    },
    returnValue: hasException
      ? null
      : {
          type: 'User',
          value: {
            id: Math.floor(Math.random() * 1000) + 1,
            name: `User${Math.floor(Math.random() * 100)}`,
            email: 'user@example.com',
            age: Math.floor(Math.random() * 50) + 20
          }
        },
    exception: hasException
      ? {
          type: 'UserNotFoundException',
          message: `User not found with id: ${Math.floor(Math.random() * 1000)}`,
          stackTrace: [
            'com.example.service.UserService.getUserById(UserService.java:45)',
            'com.example.controller.UserController.getUser(UserController.java:28)',
            'sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)',
            'sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)'
          ]
        }
      : null
  };

  snapshotIdCounter += 1;

  ttRecords.value.unshift(snapshot);
  if (ttRecords.value.length > ttConfig.value.maxCount) {
    ttRecords.value.pop();
  }

  recordedCount.value += 1;
  if (hasException) exceptionCount.value += 1;
};

// 开始记录
const startRecording = () => {
  if (!ttConfig.value.method.trim()) {
    window.$message?.warning('请填写监控方法');
    return;
  }

  // 解析方法
  const lastDotIndex = ttConfig.value.method.lastIndexOf('.');
  if (lastDotIndex === -1) {
    window.$message?.error(`方法格式错误: "${ttConfig.value.method}"。正确格式：类名.方法名`);
    return;
  }

  isRecording.value = true;
  recordedCount.value = 0;
  exceptionCount.value = 0;

  // 模拟记录过程
  recordingInterval = window.setInterval(
    () => {
      if (recordedCount.value >= ttConfig.value.maxCount) {
        stopRecording();
        return;
      }

      captureSnapshot();
    },
    1000 + Math.random() * 2000
  ); // 随机1-3秒记录一次

  window.$message?.success('开始记录方法调用快照');
};

// 加载示例
const loadSample = () => {
  ttConfig.value = {
    method: 'com.example.service.UserService.getUserById',
    condition: 'all',
    maxCount: 100,
    costThreshold: null
  };
  startRecording();
};

// 重置配置
const resetConfig = () => {
  if (isRecording.value) {
    stopRecording();
  }
  ttConfig.value = {
    method: '',
    condition: 'all',
    maxCount: 100,
    costThreshold: null
  };
  ttRecords.value = [];
  recordedCount.value = 0;
  exceptionCount.value = 0;
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
  recordedCount.value = 0;
  exceptionCount.value = 0;
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

// 回放快照
const replaySnapshot = (snapshot: TTSnapshot) => {
  window.$message?.info(`回放快照 #${snapshot.index} (功能开发中)`);
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
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour12: false });
};

// 格式化完整时间
const formatFullTime = (date: Date) => {
  return date.toLocaleString('zh-CN');
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
        <NFormItem label="监控方法" required>
          <template #label>
            <span>
              监控方法
              <span class="text-error">*</span>
            </span>
            <span class="ml-8px text-12px text-gray font-normal">(格式: 类名.方法名)</span>
          </template>
          <NInput
            v-model:value="ttConfig.method"
            placeholder="例如: com.example.service.UserService.getUserById"
            :disabled="isRecording"
            class="font-mono"
          />
        </NFormItem>

        <div class="grid grid-cols-1 gap-16px md:grid-cols-3">
          <NFormItem label="记录条件">
            <template #label>
              <span>记录条件</span>
              <span class="ml-8px text-12px text-gray font-normal">(可选)</span>
            </template>
            <NSelect v-model:value="ttConfig.condition" :options="conditionOptions" :disabled="isRecording" />
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
            <span class="text-purple font-semibold">{{ recordedCount }}</span>
            次调用
          </div>
          <div class="text-14px text-gray">
            异常:
            <span class="text-error font-semibold">{{ exceptionCount }}</span>
            次
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
          <template #suffix>
            <div class="text-12px text-gray">已保存的方法调用快照</div>
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="成功调用" :value="stats.success">
          <template #prefix>
            <SvgIcon icon="lucide:check-circle" class="text-success" />
          </template>
          <template #suffix>
            <div class="text-12px text-gray">正常返回的调用</div>
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="异常调用" :value="stats.error">
          <template #prefix>
            <SvgIcon icon="lucide:alert-circle" class="text-error" />
          </template>
          <template #suffix>
            <div class="text-12px text-gray">抛出异常的调用</div>
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
            <div class="text-12px text-gray">所有调用的平均时间</div>
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

      <!-- 时间轴视图 -->
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
                    <span class="text-12px text-gray">{{ formatTime(record.timestamp) }}</span>
                    <NTag :type="getCostColor(record.cost)" size="small">{{ record.cost }}ms</NTag>
                  </div>
                  <code class="text-14px text-primary">{{ record.fullName }}</code>
                </div>
                <NButton size="small" type="info" title="回放" @click.stop="replaySnapshot(record)">
                  <template #icon>
                    <SvgIcon icon="lucide:play-circle" />
                  </template>
                  回放
                </NButton>
              </div>

              <div class="text-12px text-gray">
                <div v-if="record.hasException" class="flex-y-center gap-8px text-error">
                  <SvgIcon icon="lucide:alert-triangle" class="text-12px" />
                  <span>{{ record.exception?.type }}: {{ record.exception?.message }}</span>
                </div>
                <div v-else class="flex-y-center gap-8px text-success">
                  <SvgIcon icon="lucide:check" class="text-12px" />
                  <span>调用成功，返回: {{ record.returnValue?.type }}</span>
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
                  <span class="ml-8px">{{ formatFullTime(selectedSnapshot.timestamp) }}</span>
                </div>
                <div>
                  <span class="text-gray">耗时:</span>
                  <NTag :type="getCostColor(selectedSnapshot.cost)" size="small" class="ml-8px">
                    {{ selectedSnapshot.cost }} ms
                  </NTag>
                </div>
                <div class="col-span-2">
                  <span class="text-gray">方法:</span>
                  <code class="ml-8px text-primary">{{ selectedSnapshot.fullName }}</code>
                </div>
              </div>
            </div>

            <!-- 参数 -->
            <div class="border border-gray/20 rounded-8px bg-container/50 p-16px">
              <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
                <SvgIcon icon="lucide:package" class="text-16px text-info" />
                参数
              </h4>
              <div class="space-y-8px">
                <div v-for="(param, index) in selectedSnapshot.parameters" :key="index" class="text-12px">
                  <span class="text-gray">params[{{ index }}]:</span>
                  <span class="ml-8px text-warning">{{ param.type }}</span>
                  <span class="ml-8px font-mono">{{ param.value !== null ? param.value : 'null' }}</span>
                </div>
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
                  <code class="ml-8px text-primary">{{ selectedSnapshot.target.className }}</code>
                </div>
                <div>
                  <span class="text-gray">HashCode:</span>
                  <code class="ml-8px text-warning font-mono">{{ selectedSnapshot.target.hashCode }}</code>
                </div>
              </div>
            </div>

            <!-- 返回值 -->
            <div v-if="selectedSnapshot.returnValue" class="border border-gray/20 rounded-8px bg-container/50 p-16px">
              <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
                <SvgIcon icon="lucide:corner-down-left" class="text-16px text-success" />
                返回值
              </h4>
              <div class="text-12px space-y-8px">
                <div>
                  <span class="text-gray">类型:</span>
                  <span class="ml-8px text-warning">{{ selectedSnapshot.returnValue.type }}</span>
                </div>
                <div>
                  <span class="text-gray">值:</span>
                  <pre class="ml-8px mt-8px overflow-x-auto rounded-6px bg-black/20 p-12px text-11px font-mono">{{
                    JSON.stringify(selectedSnapshot.returnValue.value, null, 2)
                  }}</pre>
                </div>
              </div>
            </div>

            <!-- 异常 -->
            <div v-if="selectedSnapshot.exception" class="border border-error/20 rounded-8px bg-error/5 p-16px">
              <h4 class="mb-12px flex-y-center gap-8px text-14px text-error font-semibold">
                <SvgIcon icon="lucide:alert-triangle" class="text-16px" />
                异常
              </h4>
              <div class="text-12px space-y-12px">
                <div>
                  <span class="text-gray">类型:</span>
                  <span class="ml-8px text-error">{{ selectedSnapshot.exception.type }}</span>
                </div>
                <div>
                  <span class="text-gray">消息:</span>
                  <div class="ml-8px mt-4px text-error">{{ selectedSnapshot.exception.message }}</div>
                </div>
                <div>
                  <span class="text-gray">堆栈跟踪:</span>
                  <pre
                    class="ml-8px mt-8px overflow-x-auto rounded-6px bg-black/20 p-12px text-11px text-error font-mono"
                    >{{ selectedSnapshot.exception.stackTrace.join('\n') }}</pre
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="flex-y-center justify-between border-t border-gray/10 bg-container/50 p-24px">
          <NButton type="info" @click="replaySnapshot(selectedSnapshot)">
            <template #icon>
              <SvgIcon icon="lucide:play-circle" />
            </template>
            回放此调用
          </NButton>
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
