<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { fetchStackCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { StackTraceNode } from '@/proto/command/domain/StackTraceNode';
import type { EnhanceAffect } from '@/proto/command/result/EnhanceAffect';
import type { EnhanceCommandComplete } from '@/proto/command/result/EnhanceCommandComplete';
import type { StackResponse } from '@/proto/command/result/StackResponse';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;
import type { StackRequest } from '@/proto/command/param/StackRequest';

interface StackConfig {
  className: string;
  methodName: string;
  count: number;
  includeArgs: boolean;
  includeReturn: boolean;
  includeException: boolean;
  formatJson: boolean;
}

interface StackResult {
  index: number;
  time: string;
  duration: number;
  hasException: boolean;
  className: string;
  methodName: string;
  args: string;
  returnValue: string;
  exception: string;
  fullException: string;
  stackPreview: string[];
  stackDepth: number;
  fullStack: string;
  threadName: string;
  threadState: string;
  threadId: number;
  daemon: boolean;
  tccl: string;
  opacity: number;
  jobId: number;
}

interface HistoryRecord {
  id: number;
  className: string;
  methodName: string;
  count: number;
  resultCount: number;
  status: 'completed' | 'failed';
  duration: number;
  time: string;
  results: StackResult[];
}

defineOptions({
  name: 'StackTab'
});

interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

const PARAM_PLACEHOLDER = '后端暂未返回方法参数，当前先保留展示区域。';
const RETURN_PLACEHOLDER = '后端暂未返回返回值，当前先保留展示区域。';
const EXCEPTION_PLACEHOLDER = '后端暂未返回异常信息，当前先保留展示区域。';

const stackFormRef = ref();
const showAdvanced = ref(false);
const isCapturing = ref(false);
const showDetailModal = ref(false);
const showHistoryModal = ref(false);
const selectedStack = ref<StackResult | null>(null);
const currentTaskId = ref('');
const currentRunStartedAt = ref(0);
const currentRunResults = ref<StackResult[]>([]);

const stackConfig = reactive<StackConfig>({
  className: '',
  methodName: '',
  count: 5,
  includeArgs: true,
  includeReturn: true,
  includeException: true,
  formatJson: false
});

const captureProgress = reactive({
  captured: 0,
  total: 0,
  percent: 0
});

const stackResults = ref<StackResult[]>([]);
const historyRecords = ref<HistoryRecord[]>([]);

const resultInfo = computed(() => {
  if (stackResults.value.length === 0) return '';
  return `捕获: ${stackResults.value[0].className}.${stackResults.value[0].methodName}()`;
});

function formatStackTraceNode(node: StackTraceNode): string {
  const classShortName = node.declaringClass.split('.').pop() || 'Unknown';
  const location = node.isNative
    ? 'Native Method'
    : node.lineNumber > 0
      ? `${classShortName}.java:${node.lineNumber}`
      : 'Unknown Source';
  return `at ${node.declaringClass}.${node.methodName}(${location})`;
}

function getDuration(response: StackResponse): number {
  if (!response.startTimestamp || !response.endTimestamp) {
    return 0;
  }

  return Math.max(response.endTimestamp - response.startTimestamp, 0);
}

function mapStackResponse(response: StackResponse, index: number): StackResult {
  const stackLines = (response.stackTraceNodeList || []).map(formatStackTraceNode);
  const fullStack = stackLines.length > 0 ? stackLines.join('\n') : '后端暂未返回执行栈内容。';
  const previewLines = stackLines.length > 0 ? stackLines.slice(0, 3) : ['后端暂未返回执行栈帧。'];

  return {
    index,
    time: response.finishTime || new Date().toLocaleString('zh-CN'),
    duration: getDuration(response),
    hasException: false,
    className: response.className,
    methodName: response.methodName,
    args: PARAM_PLACEHOLDER,
    returnValue: RETURN_PLACEHOLDER,
    exception: EXCEPTION_PLACEHOLDER,
    fullException: EXCEPTION_PLACEHOLDER,
    stackPreview: previewLines,
    stackDepth: Math.max(stackLines.length - previewLines.length, 0),
    fullStack,
    threadName: response.thread?.name || '未知线程',
    threadState: response.thread?.state || '-',
    threadId: response.thread?.id || 0,
    daemon: response.daemon || response.thread?.daemon || false,
    tccl: response.tccl || '-',
    opacity: 0,
    jobId: response.jobId
  };
}

function resetProgress(total: number) {
  captureProgress.captured = 0;
  captureProgress.total = total;
  captureProgress.percent = 0;
}

function updateProgress() {
  captureProgress.captured = currentRunResults.value.length;
  captureProgress.percent =
    captureProgress.total === 0
      ? 0
      : Math.min(100, Math.round((captureProgress.captured / captureProgress.total) * 100));
}

function finishCapture(status: 'completed' | 'failed', message?: string) {
  const startedAt = currentRunStartedAt.value;

  if (!startedAt) {
    isCapturing.value = false;
    currentTaskId.value = '';
    return;
  }

  const duration = Date.now() - startedAt;
  historyRecords.value.unshift({
    id: startedAt,
    className: stackConfig.className,
    methodName: stackConfig.methodName,
    count: stackConfig.count,
    resultCount: currentRunResults.value.length,
    status,
    duration,
    time: new Date().toLocaleString('zh-CN'),
    results: currentRunResults.value.map(result => ({ ...result, opacity: 1 }))
  });

  isCapturing.value = false;
  currentTaskId.value = '';
  currentRunStartedAt.value = 0;
  currentRunResults.value = [];

  if (message) {
    if (status === 'failed') {
      window.$message?.error(message);
    } else if (stackResults.value.length === 0) {
      window.$message?.info(message);
    } else {
      window.$message?.success(message);
    }
  }
}

async function startCapture() {
  if (!stackConfig.className || !stackConfig.methodName || !stackConfig.count) {
    window.$message?.warning('请填写完整的配置信息');
    return;
  }

  isCapturing.value = true;
  stackResults.value = [];
  currentRunResults.value = [];
  currentTaskId.value = '';
  currentRunStartedAt.value = Date.now();
  resetProgress(stackConfig.count);

  try {
    const response = await fetchStackCommand({
      instanceId: props.instanceId,
      param: {
        qualifiedClassName: stackConfig.className,
        methodNames: [stackConfig.methodName],
        times: stackConfig.count
      }
    } as CommandCreateRequest<StackRequest>);

    currentTaskId.value =
      typeof response === 'object' && response && 'taskId' in response ? String(response.taskId ?? '') : '';
  } catch {
    isCapturing.value = false;
    currentTaskId.value = '';
    currentRunStartedAt.value = 0;
    currentRunResults.value = [];
  }
}

function stopCapture() {
  window.$message?.info('后端暂未提供停止 Stack 命令，当前先保留页面样式');
}

function handleEnhanceAffect(response: CommandExecuteResponse<EnhanceAffect>) {
  if (currentTaskId.value && response.taskId !== currentTaskId.value) {
    return;
  }

  const data = response.data as EnhanceAffect | undefined;

  if (!data || data.state === 0) {
    finishCapture('failed', data?.message || 'Stack 增强失败');
    return;
  }

  if (data.mCnt === 0) {
    finishCapture('failed', '未匹配到可捕获的方法');
  }
}

function handleStack(response: CommandExecuteResponse<StackResponse>) {
  if (currentTaskId.value && response.taskId !== currentTaskId.value) {
    return;
  }

  const data = response.data as StackResponse | undefined;

  if (!data || data.state === 0) {
    if (data?.message) {
      window.$message?.error(data.message);
    }
    return;
  }

  const nextResult = mapStackResponse(data, currentRunResults.value.length + 1);
  currentRunResults.value.push(nextResult);
  stackResults.value.push(nextResult);
  updateProgress();

  setTimeout(() => {
    nextResult.opacity = 1;
  }, 10);
}

function handleEnhanceComplete(response: CommandExecuteResponse<EnhanceCommandComplete>) {
  if (currentTaskId.value && response.taskId !== currentTaskId.value) {
    return;
  }

  const data = response.data as EnhanceCommandComplete | undefined;

  if (!data || data.state === 0) {
    finishCapture('failed', data?.message || 'Stack 执行失败');
    return;
  }

  finishCapture(
    'completed',
    stackResults.value.length > 0
      ? `堆栈捕获完成，共捕获 ${stackResults.value.length} 个执行栈快照`
      : '命令执行完成，暂无执行栈数据'
  );
}

function showDetail(result: StackResult) {
  selectedStack.value = result;
  showDetailModal.value = true;
}

function showHistory() {
  showHistoryModal.value = true;
}

function loadHistoryRecord(record: HistoryRecord) {
  stackResults.value = record.results.map(result => ({ ...result, opacity: 1 }));
  stackConfig.className = record.className;
  stackConfig.methodName = record.methodName;
  stackConfig.count = record.count;
  showHistoryModal.value = false;
  window.$message?.success('已加载历史记录');
}

function exportResults() {
  if (stackResults.value.length === 0) {
    window.$message?.warning('暂无数据可导出');
    return;
  }

  window.$message?.info('导出功能后续补充，当前先保留页面样式');
}

function clearResults() {
  stackResults.value = [];
  selectedStack.value = null;
  captureProgress.captured = 0;
  captureProgress.percent = 0;
  window.$message?.success('已清空结果');
}

function loadSample() {
  stackConfig.className = 'com.example.service.OrderService';
  stackConfig.methodName = 'createOrder';
  stackConfig.count = 5;
  window.$message?.success('已加载示例配置');
}

function resetForm() {
  stackConfig.className = '';
  stackConfig.methodName = '';
  stackConfig.count = 5;
  stackConfig.includeArgs = true;
  stackConfig.includeReturn = true;
  stackConfig.includeException = true;
  stackConfig.formatJson = false;
  window.$message?.success('已重置表单');
}

onMounted(() => {
  eventBus.on('command:enhance-affect', handleEnhanceAffect);
  eventBus.on('command:stack', handleStack);
  eventBus.on('command:enhance-complete', handleEnhanceComplete);
});

onUnmounted(() => {
  eventBus.off('command:enhance-affect', handleEnhanceAffect);
  eventBus.off('command:stack', handleStack);
  eventBus.off('command:enhance-complete', handleEnhanceComplete);
});
</script>

<template>
  <div class="space-y-16px">
    <NCard :bordered="false" class="card-wrapper rounded-12px">
      <div class="mb-16px flex-y-center gap-8px">
        <div class="i-lucide:layers text-18px text-purple-500"></div>
        <h4 class="text-14px text-white font-semibold">方法执行栈配置</h4>
      </div>

      <NForm ref="stackFormRef" :model="stackConfig" label-placement="top" require-mark-placement="left">
        <NGrid :cols="24" :x-gap="16" :y-gap="16">
          <NGridItem :span="8">
            <NFormItem label="类全限定名" path="className">
              <NInput
                v-model:value="stackConfig.className"
                placeholder="例如: com.example.service.OrderService"
                class="font-mono"
              />
            </NFormItem>
          </NGridItem>

          <NGridItem :span="8">
            <NFormItem label="方法名称" path="methodName">
              <NInput v-model:value="stackConfig.methodName" placeholder="例如: createOrder" class="font-mono" />
            </NFormItem>
          </NGridItem>

          <NGridItem :span="8">
            <NFormItem label="捕获次数" path="count">
              <NInputNumber
                v-model:value="stackConfig.count"
                :min="1"
                :max="100"
                placeholder="例如: 5"
                class="w-full"
              />
              <template #feedback>
                <span class="text-12px text-gray-500">捕获执行栈的次数（1-100）</span>
              </template>
            </NFormItem>
          </NGridItem>

          <NGridItem :span="24">
            <div class="border-t border-gray-700 pt-16px">
              <div
                class="mb-12px flex-y-center cursor-pointer gap-8px text-12px text-gray-400 hover:text-purple-400"
                @click="showAdvanced = !showAdvanced"
              >
                <div :class="showAdvanced ? 'i-lucide:chevron-up' : 'i-lucide:chevron-down'" class="text-12px"></div>
                高级选项
              </div>
              <div v-show="showAdvanced">
                <NGrid :cols="24" :x-gap="16">
                  <NGridItem :span="6">
                    <NCheckbox v-model:checked="stackConfig.includeArgs">包含参数值</NCheckbox>
                  </NGridItem>
                  <NGridItem :span="6">
                    <NCheckbox v-model:checked="stackConfig.includeReturn">包含返回值</NCheckbox>
                  </NGridItem>
                  <NGridItem :span="6">
                    <NCheckbox v-model:checked="stackConfig.includeException">包含异常信息</NCheckbox>
                  </NGridItem>
                  <NGridItem :span="6">
                    <NCheckbox v-model:checked="stackConfig.formatJson">JSON格式化</NCheckbox>
                  </NGridItem>
                </NGrid>
                <div class="mt-12px text-12px text-gray-500">
                  当前后端仅返回线程与栈帧信息，高级选项先保留页面样式。
                </div>
              </div>
            </div>
          </NGridItem>

          <NGridItem :span="24">
            <div class="flex-y-center gap-12px pt-8px">
              <NButton type="primary" @click="startCapture">
                <template #icon>
                  <div class="i-lucide:play"></div>
                </template>
                开始捕获
              </NButton>
              <NButton @click="loadSample">
                <template #icon>
                  <div class="i-lucide:file-code"></div>
                </template>
                加载示例
              </NButton>
              <NButton v-if="isCapturing" type="error" @click="stopCapture">
                <template #icon>
                  <div class="i-lucide:square"></div>
                </template>
                停止捕获
              </NButton>
              <NButton @click="resetForm">
                <template #icon>
                  <div class="i-lucide:rotate-ccw"></div>
                </template>
                重置
              </NButton>
            </div>
          </NGridItem>
        </NGrid>
      </NForm>
    </NCard>

    <NCard v-show="isCapturing" :bordered="false" class="card-wrapper rounded-12px">
      <div class="flex-y-center justify-between">
        <div class="flex-y-center gap-16px">
          <div class="flex-y-center gap-8px">
            <div class="h-8px w-8px animate-pulse rounded-full bg-purple-500"></div>
            <span class="text-14px text-white">捕获中...</span>
          </div>
          <div class="text-12px text-gray-400">
            已捕获:
            <span class="text-white font-semibold">{{ captureProgress.captured }}</span>
            /
            <span class="text-white">{{ captureProgress.total }}</span>
          </div>
        </div>
        <div class="flex-y-center gap-8px">
          <NProgress
            type="line"
            :percentage="captureProgress.percent"
            :show-indicator="false"
            status="success"
            :height="8"
            class="w-256px"
          />
          <span class="w-48px text-12px text-gray-400">{{ captureProgress.percent }}%</span>
        </div>
      </div>
    </NCard>

    <NCard :bordered="false" class="overflow-hidden card-wrapper rounded-12px">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <div class="i-lucide:file-stack text-16px text-purple-500"></div>
            <h4 class="text-14px text-white font-semibold">方法执行栈列表</h4>
            <span v-if="resultInfo" class="text-12px text-gray-400">{{ resultInfo }}</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NButton size="small" @click="showHistory">
              <template #icon>
                <div class="i-lucide:history"></div>
              </template>
              历史
            </NButton>
            <NButton size="small" @click="exportResults">
              <template #icon>
                <div class="i-lucide:download"></div>
              </template>
              导出
            </NButton>
            <NButton size="small" @click="clearResults">
              <template #icon>
                <div class="i-lucide:trash-2"></div>
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="stackResults.length === 0" class="p-48px text-center">
        <div class="mb-16px flex justify-center">
          <div class="rounded-full bg-gray-800/50 p-16px">
            <div class="i-lucide:layers text-48px text-gray-600"></div>
          </div>
        </div>
        <h5 class="mb-8px text-14px text-gray-400 font-semibold">暂无执行栈数据</h5>
        <p class="text-12px text-gray-500">请配置捕获参数并点击“开始捕获”按钮</p>
      </div>

      <div v-else class="space-y-16px">
        <div
          v-for="result in stackResults"
          :key="result.index"
          class="overflow-hidden border card-wrapper rounded-8px transition-all duration-300"
          :class="[result.hasException ? 'border-red-500/30' : 'border-gray-700']"
          :style="{ opacity: result.opacity }"
        >
          <div class="border-b border-gray-700 bg-gray-800/30 p-16px">
            <div class="flex-y-center justify-between">
              <div class="flex-y-center gap-12px">
                <div class="rounded bg-purple-500/10 px-8px py-4px text-12px text-purple-400 font-semibold">
                  #{{ result.index }}
                </div>
                <div class="text-12px text-gray-400 font-mono">{{ result.time }}</div>
                <NTag type="success" size="small" :bordered="false" class="text-12px">已捕获</NTag>
                <div class="text-12px text-gray-400">
                  耗时:
                  <span class="text-white font-mono">{{ result.duration }}ms</span>
                </div>
              </div>
              <NButton size="small" type="primary" @click="showDetail(result)">
                <template #icon>
                  <div class="i-lucide:maximize-2"></div>
                </template>
                展开详情
              </NButton>
            </div>
          </div>

          <div class="bg-gray-900/30 p-16px">
            <div class="text-12px font-mono space-y-8px">
              <div class="flex-y-center gap-8px">
                <span class="flex-shrink-0 text-blue-400">调用:</span>
                <span class="text-white">{{ result.className }}.{{ result.methodName }}()</span>
              </div>
              <div class="flex-y-center gap-8px">
                <span class="flex-shrink-0 text-green-400">线程:</span>
                <span class="text-gray-300">{{ result.threadName }} [{{ result.threadState }}]</span>
              </div>
              <div class="flex-y-center gap-8px">
                <span class="flex-shrink-0 text-purple-400">说明:</span>
                <span class="text-gray-300">参数、返回值、异常明细待后端补充，当前保留展示区域</span>
              </div>
              <div class="border-t border-gray-700 pt-8px">
                <div class="mb-4px text-gray-500">执行栈预览:</div>
                <div class="text-gray-400 space-y-2px">
                  <div v-for="(line, idx) in result.stackPreview" :key="idx">{{ line }}</div>
                  <div v-if="result.stackDepth > 0" class="text-gray-600">... {{ result.stackDepth }} more</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <NModal v-model:show="showDetailModal" preset="card" title="执行栈详情" class="w-1200px">
      <template #header-extra>
        <div class="i-lucide:code-2 text-20px text-purple-500"></div>
      </template>

      <div v-if="selectedStack" class="space-y-16px">
        <NCard :bordered="false" title="执行信息" class="bg-gray-800/30">
          <NGrid :cols="2" :x-gap="12" :y-gap="12">
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">序号:</span>
                <span class="text-white">#{{ selectedStack.index }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">完成时间:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.time }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">类名:</span>
                <span class="ml-8px text-12px text-white font-mono">{{ selectedStack.className }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">方法:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.methodName }}()</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">耗时:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.duration }}ms</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">线程:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.threadName }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">线程状态:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.threadState }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">线程ID:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.threadId }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">守护线程:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.daemon ? '是' : '否' }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">TCCL:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.tccl }}</span>
              </div>
            </NGridItem>
          </NGrid>
        </NCard>

        <NCard :bordered="false" title="方法参数" class="bg-gray-800/30">
          <div class="rounded bg-gray-900/50 p-12px">
            <pre class="text-12px text-green-400 font-mono">{{ selectedStack.args }}</pre>
          </div>
        </NCard>

        <NCard :bordered="false" title="返回值" class="bg-gray-800/30">
          <div class="rounded bg-gray-900/50 p-12px">
            <pre class="text-12px text-purple-400 font-mono">{{ selectedStack.returnValue }}</pre>
          </div>
        </NCard>

        <NCard :bordered="false" title="异常信息" class="border border-red-500/20 bg-red-500/10">
          <template #header-extra>
            <div class="i-lucide:alert-circle text-16px text-red-400"></div>
          </template>
          <div class="rounded bg-gray-900/50 p-12px">
            <pre class="text-12px text-red-300 font-mono">{{ selectedStack.fullException }}</pre>
          </div>
        </NCard>

        <NCard :bordered="false" title="完整执行栈" class="bg-gray-800/30">
          <div class="max-h-400px overflow-y-auto rounded bg-gray-900/50 p-12px">
            <pre class="text-12px text-gray-300 leading-relaxed font-mono">{{ selectedStack.fullStack }}</pre>
          </div>
        </NCard>
      </div>
    </NModal>

    <NModal v-model:show="showHistoryModal" preset="card" title="捕获历史" class="w-1000px">
      <template #header-extra>
        <div class="i-lucide:history text-20px text-purple-500"></div>
      </template>

      <div v-if="historyRecords.length === 0" class="p-48px text-center">
        <div class="mb-16px flex justify-center">
          <div class="rounded-full bg-gray-800/50 p-16px">
            <div class="i-lucide:inbox text-48px text-gray-600"></div>
          </div>
        </div>
        <p class="text-14px text-gray-400">暂无历史记录</p>
      </div>

      <div v-else class="space-y-12px">
        <div
          v-for="record in historyRecords"
          :key="record.id"
          class="cursor-pointer border border-gray-700 card-wrapper rounded-8px p-16px transition hover:border-purple-500/50"
          @click="loadHistoryRecord(record)"
        >
          <div class="mb-8px flex-y-center justify-between">
            <div class="flex-y-center gap-12px">
              <div class="text-14px text-white font-semibold font-mono">
                {{ record.className }}.{{ record.methodName }}()
              </div>
              <NTag size="small" :bordered="false" :type="record.status === 'completed' ? 'success' : 'error'">
                {{ record.status === 'completed' ? '已完成' : '失败' }}
              </NTag>
            </div>
            <div class="text-12px text-gray-400">{{ record.time }}</div>
          </div>
          <div class="flex-y-center gap-16px text-12px text-gray-400">
            <span>
              捕获次数:
              <span class="text-white">{{ record.count }}</span>
            </span>
            <span>
              结果数:
              <span class="text-white">{{ record.resultCount }}</span>
            </span>
            <span>
              耗时:
              <span class="text-white">{{ record.duration }}ms</span>
            </span>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.card-wrapper {
  background: var(--n-color);
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
