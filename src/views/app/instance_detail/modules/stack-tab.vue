<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { cancelCommandTask, fetchStackCommand } from '@/service/api/instance';
import { fetchBrowserSessionStackSession } from '@/service/api/browser-session';
import eventBus from '@/utils/eventbus';
import { commandEnum } from '@/enum/commandEnums';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { StackTraceNode } from '@/proto/command/domain/StackTraceNode';
import type { EnhanceAffect } from '@/proto/command/result/EnhanceAffect';
import type { EnhanceCommandComplete } from '@/proto/command/result/EnhanceCommandComplete';
import type { StackResponse } from '@/proto/command/result/StackResponse';
import type { StackRequest } from '@/proto/command/param/StackRequest';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;

defineOptions({
  name: 'StackTab'
});

interface Props {
  instanceId: string;
  browserSessionId: string;
}

const props = defineProps<Props>();

const formData = ref({
  className: 'com.tutelary.example.MathGame',
  methodName: 'primeFactors',
  count: 5
});

const isCapturing = ref(false);
const isRecovering = ref(false);
const isRestoringStackSession = ref(false);
const connectionInterrupted = ref(false);
const capturedCount = ref(0);
const totalCount = ref(5);
const currentTaskId = ref('');
const stackStartedAt = ref(0);
const nowTime = ref(Date.now());
const stackResults = ref<StackResponse[]>([]);
const stackResultKeys = new Set<string>();
const showDetailModal = ref(false);
const selectedStack = ref<StackResponse | null>(null);
let durationTimer: ReturnType<typeof setInterval> | undefined;

const hasResults = computed(() => stackResults.value.length > 0);
const stackTarget = computed(() => {
  if (!formData.value.className || !formData.value.methodName) return '-';
  return `${formData.value.className}.${formData.value.methodName}()`;
});
const elapsedMs = computed(() => {
  if (!isCapturing.value || stackStartedAt.value === 0) return 0;
  return Math.max(0, nowTime.value - stackStartedAt.value);
});
const elapsedLabel = computed(() => {
  const totalSeconds = Math.floor(elapsedMs.value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
  return `${seconds}秒`;
});
const elapsedClockLabel = computed(() => formatDurationClock(elapsedMs.value));
const progress = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.min(100, Math.round((capturedCount.value / totalCount.value) * 100));
});
const isWaitingStackResult = computed(() => isCapturing.value && !hasResults.value);
const hasWaitedTooLong = computed(() => isWaitingStackResult.value && elapsedMs.value >= 60_000);
const shouldLockStackInputs = computed(() => isCapturing.value && Boolean(formData.value.className && formData.value.methodName));
const resultInfo = computed(() => {
  if (!hasResults.value) return '';
  const first = stackResults.value[0];
  return `捕获: ${first.className}.${first.methodName}()`;
});

function formatDurationClock(duration: number) {
  const totalSeconds = Math.floor(Math.max(0, duration) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function parseTime(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getDuration(response: StackResponse) {
  if (!response.startTimestamp || !response.endTimestamp) return 0;
  return Math.max(Math.round((response.endTimestamp - response.startTimestamp) / 1_000_000), 0);
}

function getDurationTagType(duration: number) {
  if (duration > 200) return 'error';
  if (duration > 100) return 'warning';
  return 'success';
}

function getStackDepth(response: StackResponse) {
  return response.stackTraceNodeList?.length || 0;
}

function formatStackLocation(node: StackTraceNode) {
  const classShortName = node.declaringClass.split('.').pop() || 'Unknown';
  if (node.isNative) return 'Native Method';
  if (node.lineNumber > 0) return `${classShortName}.java:${node.lineNumber}`;
  return 'Unknown Source';
}

function formatStackTraceNode(node: StackTraceNode) {
  return `at ${node.declaringClass}.${node.methodName}(${formatStackLocation(node)})`;
}

function buildStackResultKey(stack: StackResponse, taskId?: string) {
  return [
    taskId || currentTaskId.value || 'unknown',
    stack.finishTime || '',
    stack.className || '',
    stack.methodName || '',
    stack.startTimestamp || 0,
    stack.endTimestamp || 0,
    stack.thread?.id || ''
  ].join('|');
}

function clearStackResults() {
  stackResults.value = [];
  stackResultKeys.clear();
  capturedCount.value = 0;
}

function appendStackResult(stack: StackResponse, taskId?: string) {
  const key = buildStackResultKey(stack, taskId);
  if (stackResultKeys.has(key)) return false;

  stackResultKeys.add(key);
  stackResults.value.push(stack);
  capturedCount.value = stackResults.value.length;
  return true;
}

function appendStackResults(results: unknown[] = [], taskId?: string) {
  let appended = 0;
  for (const result of results) {
    if (appendStackResult(result as StackResponse, taskId)) {
      appended += 1;
    }
  }
  return appended;
}

function applyStackParam(param?: string) {
  if (!param) return;

  try {
    const stackParam = JSON.parse(param) as StackRequest;
    formData.value = {
      className: stackParam.qualifiedClassName || '',
      methodName: stackParam.methodNames?.[0] || '',
      count: stackParam.times || 5
    };
    totalCount.value = stackParam.times || 5;
  } catch {
    window.$message?.warning('Stack 参数恢复失败，请检查历史任务数据');
  }
}

function applyRecoveredStack(task: Api.Instance.Command.BrowserSessionEnhanceTaskResponse, appendOnly = false) {
  currentTaskId.value = task.taskId || '';
  applyStackParam(task.param);
  stackStartedAt.value = parseTime(task.createTime) || Date.now();
  nowTime.value = Date.now();

  if (!appendOnly) {
    clearStackResults();
  }

  appendStackResults(task.results || [], task.taskId);
  totalCount.value = Math.max(totalCount.value, capturedCount.value);
  isCapturing.value = !task.completeTime;
}

async function loadLatestStackSession(options: {
  onlyActive?: boolean;
  notifyRecovered?: boolean;
  reconnectPull?: boolean;
} = {}) {
  if (!props.browserSessionId) return false;

  isRecovering.value = true;
  try {
    const { data: task, error } = await fetchBrowserSessionStackSession({
      instanceId: props.instanceId,
      sessionId: props.browserSessionId
    });

    if (error) return false;
    if (!task) {
      if (options.reconnectPull) {
        connectionInterrupted.value = false;
        window.$message?.success('页面连接已恢复，断开期间没有新的 Stack 结果');
      }
      return false;
    }
    if (options.onlyActive && task.completeTime) return false;

    const isRunningTask = !task.completeTime;
    isRestoringStackSession.value = isRunningTask && !options.reconnectPull;
    const beforeCount = stackResults.value.length;
    applyRecoveredStack(task, options.reconnectPull);
    const appendedCount = Math.max(0, stackResults.value.length - beforeCount);

    if (options.reconnectPull) {
      connectionInterrupted.value = false;
      const message =
        appendedCount > 0
          ? `页面连接已恢复，已补拉 ${appendedCount} 条 Stack 结果`
          : '页面连接已恢复，断开期间没有新的 Stack 结果';
      window.$message?.success(message);
    } else if (options.notifyRecovered && isRunningTask) {
      window.$message?.success('已恢复 Stack 会话，继续等待目标方法调用');
    }

    return isRunningTask;
  } finally {
    isRecovering.value = false;
    isRestoringStackSession.value = false;
  }
}

function handleStackResult(response: CommandExecuteResponse<StackResponse>) {
  if (currentTaskId.value && response.taskId && response.taskId !== currentTaskId.value) return;

  const data = response.data as StackResponse | undefined;
  if (!data || data.state === 0) {
    if (data?.message) {
      window.$message?.error(data.message);
    }
    return;
  }

  appendStackResult(data, response.taskId);
}

function handleEnhanceAffect(response: CommandExecuteResponse<EnhanceAffect>) {
  if (currentTaskId.value && response.taskId && response.taskId !== currentTaskId.value) return;

  const data = response.data as EnhanceAffect | undefined;
  if (!data || data.state === 0) {
    isCapturing.value = false;
    window.$message?.error(data?.message || 'Stack 增强失败');
    return;
  }

  console.log('data : ', data);

  if (data.methodCount === 0) {
    isCapturing.value = false;
    window.$message?.error('未匹配到可捕获的方法');
  }
}

function handleEnhanceComplete(response: CommandExecuteResponse<EnhanceCommandComplete>) {
  if (!isCapturing.value) return;

  const complete = response.data as EnhanceCommandComplete | undefined;
  if (!complete) return;

  const isStackComplete =
    complete.code === (commandEnum.STACK_METHOD.value as number) ||
    (currentTaskId.value && response.taskId === currentTaskId.value);

  if (!isStackComplete) return;

  isCapturing.value = false;
  currentTaskId.value = '';

  window.$message?.success(`堆栈捕获完成，共捕获 ${capturedCount.value} 个执行栈快照`);
}

function handleConnectionInterrupted() {
  connectionInterrupted.value = true;
}

function handleConnectionError() {
  connectionInterrupted.value = true;
}

function handleConnectionRestored() {
  if (!connectionInterrupted.value) return;
  loadLatestStackSession({ reconnectPull: true });
}

async function startCapture() {
  if (!formData.value.className || !formData.value.methodName || !formData.value.count) {
    window.$message?.warning('请填写完整的捕获参数');
    return;
  }
  if (!props.browserSessionId) {
    window.$message?.warning('浏览器会话尚未准备好，请稍后重试');
    return;
  }

  const hasActiveStack = await loadLatestStackSession({ onlyActive: true, notifyRecovered: true });
  if (hasActiveStack) return;

  isCapturing.value = true;
  stackStartedAt.value = Date.now();
  nowTime.value = stackStartedAt.value;
  totalCount.value = formData.value.count;
  currentTaskId.value = '';
  clearStackResults();

  const { data: taskResponse, error } = await fetchStackCommand({
    instanceId: props.instanceId,
    browserSessionId: props.browserSessionId,
    param: {
      qualifiedClassName: formData.value.className,
      methodNames: [formData.value.methodName],
      times: formData.value.count
    }
  } as CommandCreateRequest<StackRequest>);

  if (error) {
    isCapturing.value = false;
    return;
  }

  if (taskResponse) {
    currentTaskId.value = taskResponse.taskId || '';
    if (taskResponse.param) {
      applyStackParam(taskResponse.param);
    }
  }
}

async function stopCapture() {
  const taskId = currentTaskId.value;
  try {
    if (taskId) {
      currentTaskId.value = '';
      await cancelCommandTask(props.instanceId, taskId);
    }
  } catch {
    window.$message?.warning('停止命令下发失败，已先结束本地捕获状态');
  } finally {
    isCapturing.value = false;
  }
  window.$message?.info('已停止捕获');
}

function showDetail(result: StackResponse) {
  selectedStack.value = result;
  showDetailModal.value = true;
}

function loadSample() {
  formData.value = {
    className: 'com.example.service.OrderService',
    methodName: 'createOrder',
    count: 5
  };
}

function resetForm() {
  formData.value = {
    className: '',
    methodName: '',
    count: 5
  };
}

function clearResults() {
  clearStackResults();
  selectedStack.value = null;
  window.$message?.success('已清空结果');
}

const columns: DataTableColumns<StackResponse> = [
  {
    title: '#',
    key: 'index',
    width: 64,
    render: (_row: StackResponse, rowIndex: number) => `${rowIndex + 1}`
  },
  {
    title: '方法',
    key: 'method',
    minWidth: 220,
    render: (row: StackResponse) => h('span', { class: 'font-mono' }, `${row.className}.${row.methodName}()`)
  },
  {
    title: '调用时间',
    key: 'time',
    width: 190,
    render: (row: StackResponse) => row.finishTime || '-'
  },
  {
    title: '耗时',
    key: 'duration',
    width: 110,
    render: (row: StackResponse) => {
      const duration = getDuration(row);
      return h(
        NTag,
        {
          type: getDurationTagType(duration),
          size: 'small',
          bordered: false
        },
        { default: () => `${duration}ms` }
      );
    }
  },
  {
    title: '线程',
    key: 'thread',
    minWidth: 180,
    render: (row: StackResponse) => row.thread?.name || '未知线程'
  },
  {
    title: '栈深度',
    key: 'depth',
    width: 100,
    render: (row: StackResponse) => `${getStackDepth(row)} 帧`
  },
  {
    title: '操作',
    key: 'actions',
    width: 110,
    align: 'center',
    render: (row: StackResponse) => h(
      NButton,
      {
        size: 'small',
        type: 'primary',
        onClick: () => showDetail(row)
      },
      { default: () => '查看详情' }
    )
  }
];

onMounted(() => {
  durationTimer = setInterval(() => {
    nowTime.value = Date.now();
  }, 1000);

  eventBus.on('command:enhance-affect', handleEnhanceAffect);
  eventBus.on('command:stack', handleStackResult);
  eventBus.on('command:enhance-complete', handleEnhanceComplete);
  eventBus.on('ws:reconnecting', handleConnectionInterrupted);
  eventBus.on('ws:disconnected', handleConnectionInterrupted);
  eventBus.on('ws:error', handleConnectionError);
  eventBus.on('ws:connected', handleConnectionRestored);

  loadLatestStackSession({ notifyRecovered: true });
});

onUnmounted(() => {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = undefined;
  }

  eventBus.off('command:enhance-affect', handleEnhanceAffect);
  eventBus.off('command:stack', handleStackResult);
  eventBus.off('command:enhance-complete', handleEnhanceComplete);
  eventBus.off('ws:reconnecting', handleConnectionInterrupted);
  eventBus.off('ws:disconnected', handleConnectionInterrupted);
  eventBus.off('ws:error', handleConnectionError);
  eventBus.off('ws:connected', handleConnectionRestored);
});
</script>

<template>
  <div class="stack-container">
    <NCard class="id-card mb-6">
      <h4 class="id-card-title-lg">
        <SvgIcon icon="lucide:list-tree" class="text-20px text-primary" />
        方法执行栈配置
      </h4>

      <NForm :model="formData" label-placement="top">
        <NGrid :x-gap="16" :y-gap="16" :cols="3" responsive="screen">
          <NGridItem>
            <NFormItem label="类全限定名" required>
              <NInput
                v-model:value="formData.className"
                :disabled="shouldLockStackInputs"
                placeholder="例如: com.example.service.OrderService"
                class="font-mono"
              />
            </NFormItem>
          </NGridItem>

          <NGridItem>
            <NFormItem label="方法名称" required>
              <NInput
                v-model:value="formData.methodName"
                :disabled="shouldLockStackInputs"
                placeholder="例如: createOrder"
                class="font-mono"
              />
            </NFormItem>
          </NGridItem>

          <NGridItem>
            <NFormItem label="捕获次数" required>
              <NInputNumber
                v-model:value="formData.count"
                :min="1"
                :max="100"
                :disabled="shouldLockStackInputs"
                placeholder="例如: 5"
                class="w-full"
              />
              <template #feedback>
                <span class="text-xs text-gray-500">捕获执行栈的次数（1-100）</span>
              </template>
            </NFormItem>
          </NGridItem>
        </NGrid>

        <div class="id-action-buttons">
          <NButton v-if="!isCapturing" type="primary" :loading="isRecovering" @click="startCapture">
            <template #icon>
              <SvgIcon icon="lucide:play" />
            </template>
            开始捕获
          </NButton>
          <NButton :disabled="shouldLockStackInputs" @click="loadSample">
            <template #icon>
              <SvgIcon icon="lucide:file-code" />
            </template>
            加载示例
          </NButton>
          <NButton :disabled="shouldLockStackInputs" @click="resetForm">
            <template #icon>
              <SvgIcon icon="lucide:rotate-ccw" />
            </template>
            重置
          </NButton>
        </div>

        <NAlert v-if="connectionInterrupted" type="warning" class="stack-connection-alert" :show-icon="true">
          <div class="stack-connection-title">页面连接已断开，正在自动重连。</div>
          <div class="stack-connection-body">重连成功后会自动补拉断开期间产生的结果。</div>
        </NAlert>
      </NForm>
    </NCard>

    <NCard v-if="isRestoringStackSession" class="stack-recovering-card id-card mb-6">
      <div class="stack-recovering-panel">
        <div class="stack-recovering-title">
          <SvgIcon icon="lucide:refresh-cw" class="stack-recovering-icon" />
          <span>正在恢复 Stack 会话</span>
        </div>
        <div class="stack-recovering-grid">
          <div>
            <span class="stack-recovering-label">目标方法：</span>
            <span class="font-mono">{{ stackTarget }}</span>
          </div>
          <div>
            <span class="stack-recovering-label">已知进度：</span>
            <span>{{ capturedCount }}/{{ totalCount }}</span>
          </div>
          <div>
            <span class="stack-recovering-label">运行时长：</span>
            <span>{{ elapsedClockLabel }}</span>
          </div>
        </div>
        <div class="stack-recovering-hint">正在重新连接结果流，请稍后。</div>
      </div>
    </NCard>

    <NCard v-if="isCapturing && !isRestoringStackSession" class="stack-running-card id-card mb-6">
      <div class="stack-running-panel">
        <div class="stack-running-head">
          <div class="stack-running-title">
            <div class="stack-running-pulse" />
            <div>
              <div class="stack-running-name">进行中的堆栈捕获</div>
              <div class="stack-running-subtitle">
                <span class="font-mono">{{ stackTarget }}</span>
              </div>
            </div>
          </div>
          <NButton size="small" type="error" @click="stopCapture">
            <template #icon>
              <SvgIcon icon="lucide:square" />
            </template>
            停止捕获
          </NButton>
        </div>

        <div class="stack-running-body">
          <div class="stack-running-metrics">
            <div class="stack-running-metric">
              <span class="stack-running-label">已收集</span>
              <span class="stack-running-value">{{ capturedCount }} / {{ totalCount }}</span>
            </div>
            <div class="stack-running-metric">
              <span class="stack-running-label">运行时长</span>
              <span class="stack-running-value">{{ elapsedLabel }}</span>
            </div>
            <div class="stack-running-metric">
              <span class="stack-running-label">进度</span>
              <span class="stack-running-value">{{ progress }}%</span>
            </div>
          </div>
          <NProgress type="line" :percentage="progress" :show-indicator="false" class="stack-running-progress" />
        </div>
      </div>
    </NCard>

    <NCard class="id-table-card">
      <template #header>
        <div class="id-table-header">
          <div class="id-table-title">
            <SvgIcon icon="lucide:file-stack" class="text-16px text-success" />
            <span>方法执行栈列表</span>
            <span v-if="resultInfo" class="text-12px text-gray font-normal">{{ resultInfo }}</span>
          </div>
          <div class="id-table-actions">
            <NButton size="small" @click="clearResults">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="!hasResults" class="stack-empty-state">
        <div class="stack-empty-icon">
          <SvgIcon :icon="isWaitingStackResult ? 'lucide:radar' : 'lucide:list-tree'" />
        </div>
        <template v-if="isWaitingStackResult && !hasWaitedTooLong">
          <div class="stack-empty-title">Stack 命令已生效，正在等待目标方法被调用。</div>
          <div class="stack-empty-body">
            <div>你可以：</div>
            <ol class="stack-empty-list">
              <li>触发一次相关业务请求；</li>
              <li>检查类名或方法名是否正确；</li>
              <li>确认当前实例是实际处理请求的实例。</li>
            </ol>
          </div>
        </template>
        <template v-else-if="hasWaitedTooLong">
          <div class="stack-empty-title">未收集到执行栈结果</div>
          <div class="stack-empty-body">
            <div>可能原因：</div>
            <ul class="stack-empty-list">
              <li>目标方法在当前时间段没有被调用；</li>
              <li>类名或方法名不匹配；</li>
              <li>当前实例不是实际处理请求的实例。</li>
            </ul>
          </div>
        </template>
        <template v-else>
          <div class="stack-empty-title">尚未开始收集执行栈</div>
          <div class="stack-empty-body">配置类名、方法名和捕获次数后开始捕获。</div>
        </template>
      </div>

      <NDataTable
        v-else
        :columns="columns"
        :data="stackResults"
        :bordered="false"
        :single-line="false"
        :max-height="500"
        class="id-mono-table"
      />
    </NCard>

    <NModal v-model:show="showDetailModal" preset="card" title="执行栈详情" style="width: 980px">
      <template #header-extra>
        <SvgIcon icon="lucide:code-2" class="text-20px text-blue-500" />
      </template>

      <div v-if="selectedStack" class="stack-detail-content">
        <div class="id-detail-section">
          <h5 class="id-detail-section-title">执行信息</h5>
          <NGrid :x-gap="12" :y-gap="8" :cols="2">
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">调用时间</span>
                <span class="id-detail-value font-mono">{{ selectedStack.finishTime || '-' }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">耗时</span>
                <NTag :type="getDurationTagType(getDuration(selectedStack))" size="small" :bordered="false">
                  {{ getDuration(selectedStack) }}ms
                </NTag>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">类名</span>
                <span class="id-detail-value font-mono">{{ selectedStack.className }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">方法</span>
                <span class="id-detail-value font-mono">{{ selectedStack.methodName }}()</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">栈深度</span>
                <span class="id-detail-value font-mono">{{ getStackDepth(selectedStack) }} 帧</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">Job ID</span>
                <span class="id-detail-value font-mono">{{ selectedStack.jobId || '-' }}</span>
              </div>
            </NGridItem>
          </NGrid>
        </div>

        <div class="id-detail-section">
          <h5 class="id-detail-section-title">线程信息</h5>
          <NGrid :x-gap="12" :y-gap="8" :cols="2">
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">线程</span>
                <span class="id-detail-value font-mono">
                  {{ selectedStack.thread?.name || '未知线程' }} (id={{ selectedStack.thread?.id || 0 }})
                </span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">线程组</span>
                <span class="id-detail-value font-mono">{{ selectedStack.thread?.group || '-' }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">线程状态</span>
                <span class="id-detail-value font-mono">{{ selectedStack.thread?.state || '-' }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="stack-info-item">
                <span class="id-detail-label">优先级 / 守护线程</span>
                <span class="id-detail-value font-mono">
                  {{ selectedStack.thread?.priority || '-' }} / {{ selectedStack.daemon ? '是' : '否' }}
                </span>
              </div>
            </NGridItem>
            <NGridItem :span="2">
              <div class="stack-info-item">
                <span class="id-detail-label">TCCL</span>
                <span class="id-detail-value font-mono">{{ selectedStack.tccl || '-' }}</span>
              </div>
            </NGridItem>
          </NGrid>
        </div>

        <div class="stack-trace-detail">
          <h5 class="stack-trace-title">
            <SvgIcon icon="lucide:list-tree" class="text-16px text-blue-500" />
            完整执行栈
          </h5>
          <div class="stack-trace-content">
            <div
              v-for="(node, index) in selectedStack.stackTraceNodeList"
              :key="`${node.declaringClass}:${node.methodName}:${node.lineNumber}:${index}`"
              class="stack-trace-line"
            >
              <span class="stack-trace-number">{{ index + 1 }}</span>
              <span class="stack-trace-text">{{ formatStackTraceNode(node) }}</span>
            </div>
            <div v-if="!selectedStack.stackTraceNodeList?.length" class="stack-trace-empty">
              后端暂未返回执行栈内容。
            </div>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style lang="scss">
.stack-container {
  padding: 0;
}

.stack-connection-alert {
  margin-top: 14px;
}

.stack-connection-title {
  color: var(--n-text-color);
  font-size: 13px;
  font-weight: 600;
}

.stack-connection-body {
  margin-top: 2px;
  color: var(--n-text-color-2);
  font-size: 12px;
}

.stack-recovering-card,
.stack-running-card {
  :deep(.n-card__content) {
    padding: 16px 18px;
  }
}

.stack-recovering-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stack-recovering-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 700;
}

.stack-recovering-icon {
  color: rgb(var(--primary-color));
  font-size: 17px;
}

.stack-recovering-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(120px, 1fr) minmax(120px, 1fr);
  gap: 10px;
  color: var(--n-text-color);
  font-size: 13px;
  line-height: 1.6;
}

.stack-recovering-label {
  color: var(--n-text-color-3);
}

.stack-recovering-hint {
  color: var(--n-text-color-2);
  font-size: 12px;
}

.stack-running-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stack-running-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.stack-running-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.stack-running-pulse {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 50%;
  background: #18a058;
  box-shadow: 0 0 0 5px rgba(24, 160, 88, 0.14);
}

.stack-running-name {
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.stack-running-subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
  color: var(--n-text-color-2);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}

.stack-running-body {
  display: grid;
  grid-template-columns: minmax(260px, 420px) minmax(0, 1fr);
  gap: 18px;
  align-items: center;
}

.stack-running-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stack-running-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stack-running-label {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.stack-running-value {
  min-width: 0;
  overflow: hidden;
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stack-running-progress {
  min-width: 160px;
}

.stack-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 32px 20px;
  color: var(--n-text-color-2);
  text-align: center;
}

.stack-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: 14px;
  border-radius: 8px;
  background: var(--n-color-modal);
  color: var(--n-text-color-3);
  font-size: 28px;
}

.stack-empty-title {
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 600;
}

.stack-empty-body {
  margin-top: 10px;
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.8;
}

.stack-empty-list {
  margin: 4px 0 0;
  padding-left: 20px;
  text-align: left;
}

.stack-detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stack-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stack-trace-detail {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.stack-trace-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: var(--n-text-color);
  font-size: 14px;
  font-weight: 600;
}

.stack-trace-content {
  max-height: 420px;
  overflow-y: auto;
  border-radius: 6px;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.8;
}

.stack-trace-line {
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    background-color: var(--n-color-target);
  }
}

.stack-trace-number {
  flex-shrink: 0;
  width: 36px;
  color: var(--n-text-color-disabled);
  text-align: right;
  user-select: none;
}

.stack-trace-text {
  min-width: 0;
  color: var(--n-text-color);
  word-break: break-all;
}

.stack-trace-empty {
  padding: 18px 8px;
  color: var(--n-text-color-3);
}

@media (max-width: 960px) {
  .stack-recovering-grid {
    grid-template-columns: 1fr;
  }

  .stack-running-body {
    grid-template-columns: 1fr;
  }

  .stack-running-progress {
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .stack-running-head {
    align-items: stretch;
    flex-direction: column;
  }

  .stack-running-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
