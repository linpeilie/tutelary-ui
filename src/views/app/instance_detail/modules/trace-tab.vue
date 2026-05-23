<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
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
  NModal,
  NProgress,
  NTag,
  NAlert
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { cancelCommandTask, fetchTraceCommand } from '@/service/api/instance';
import { fetchBrowserSessionTraceSession } from '@/service/api/browser-session';
import eventbus from '@/utils/eventbus';
import { div4Round } from '@/utils/math';
import { commandEnum } from '@/enum/commandEnums';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { TraceResponse } from '@/proto/command/result/TraceResponse';
import type { TraceNode } from '@/proto/command/domain/TraceNode';
import type { EnhanceCommandComplete } from '@/proto/command/result/EnhanceCommandComplete';
import type { TraceRequest } from '@/proto/command/param/TraceRequest';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;

// Props
interface Props {
  instanceId: string;
  browserSessionId: string;
  launchAction?: TraceLaunchAction | null;
}

interface TraceLaunchAction {
  id: number;
  className: string;
  methodName: string;
}

const props = defineProps<Props>();

// 表单数据
const formData = ref({
  className: 'com.tutelary.example.MathGame',
  methodName: 'primeFactors',
  count: 10,
  minTime: null as number | null,
  includeJdk: false,
  skipConstructor: false,
  deepTrace: true
});

// 追踪状态
const isTracing = ref(false);
const isRecovering = ref(false);
const isRestoringTraceSession = ref(false);
const connectionInterrupted = ref(false);
const capturedCount = ref(0);
const totalCount = ref(10);
const currentTaskId = ref('');
const handledLaunchActionId = ref(0);
const traceStartedAt = ref(0);
const nowTime = ref(Date.now());
let durationTimer: ReturnType<typeof setInterval> | undefined;
const traceResults = ref<TraceResponse[]>([]);
const traceResultKeys = new Set<string>();
const hasResults = computed(() => traceResults.value.length > 0);
const progress = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((capturedCount.value / totalCount.value) * 100);
});
const traceTarget = computed(() => {
  if (!formData.value.className || !formData.value.methodName) return '-';
  return `${formData.value.className}.${formData.value.methodName}()`;
});
const traceCondition = computed(() => {
  if (typeof formData.value.minTime === 'number' && formData.value.minTime > 0) {
    return `总耗时 >= ${formData.value.minTime}ms`;
  }
  return '全部调用';
});
const elapsedMs = computed(() => {
  if (!isTracing.value || traceStartedAt.value === 0) return 0;
  return Math.max(0, nowTime.value - traceStartedAt.value);
});
const elapsedLabel = computed(() => {
  const totalSeconds = Math.floor(elapsedMs.value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
  return `${seconds}秒`;
});
const elapsedClockLabel = computed(() => formatDurationClock(elapsedMs.value));
const isWaitingTraceResult = computed(() => isTracing.value && !hasResults.value);
const hasWaitedTooLong = computed(() => isWaitingTraceResult.value && elapsedMs.value >= 60_000);
const shouldLockTraceInputs = computed(() => isTracing.value && Boolean(formData.value.className && formData.value.methodName));

// 详情模态框
const showDetailModal = ref(false);
const selectedTrace = ref<TraceResponse | null>(null);

// 获取耗时标签类型
const getDurationTagType = (duration: number) => {
  if (duration > 200) return 'error';
  if (duration > 100) return 'warning';
  return 'success';
};

// 查看详情
const handleViewDetail = (trace: TraceResponse) => {
  selectedTrace.value = trace;
  showDetailModal.value = true;
};

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

function clearTraceResults() {
  traceResults.value = [];
  traceResultKeys.clear();
  capturedCount.value = 0;
}

function buildTraceResultKey(trace: TraceResponse, taskId?: string) {
  if (taskId && trace.currentTimes) {
    return `${taskId}:${trace.currentTimes}`;
  }

  return [
    taskId || 'unknown',
    trace.finishTime || '',
    trace.node?.className || '',
    trace.node?.methodName || '',
    trace.node?.totalCost || 0,
    trace.thread?.id || ''
  ].join('|');
}

function appendTraceResult(trace: TraceResponse, taskId?: string) {
  const key = buildTraceResultKey(trace, taskId || currentTaskId.value);
  if (traceResultKeys.has(key)) return false;

  traceResultKeys.add(key);
  traceResults.value.push(trace);
  capturedCount.value = Math.max(capturedCount.value, trace.currentTimes || traceResults.value.length);
  return true;
}

function appendTraceResults(results: unknown[] = [], taskId?: string) {
  let appended = 0;
  for (const result of results) {
    if (appendTraceResult(result as TraceResponse, taskId)) {
      appended += 1;
    }
  }
  return appended;
}

function applyTraceParam(param?: string) {
  if (!param) return;

  try {
    const traceParam = JSON.parse(param) as TraceRequest;
    formData.value = {
      ...formData.value,
      className: traceParam.qualifiedClassName || '',
      methodName: traceParam.methodNames?.[0] || '',
      count: traceParam.times || 10,
      minTime: typeof traceParam.cost === 'number' ? traceParam.cost : null
    };
    totalCount.value = traceParam.times || 10;
  } catch {
    window.$message?.warning('Trace 参数恢复失败，请检查历史任务数据');
  }
}

function applyRecoveredTrace(task: Api.Instance.Command.BrowserSessionEnhanceTaskResponse, appendOnly = false) {
  currentTaskId.value = task.taskId || '';
  applyTraceParam(task.param);
  traceStartedAt.value = parseTime(task.createTime) || Date.now();
  nowTime.value = Date.now();

  if (!appendOnly) {
    clearTraceResults();
  }

  appendTraceResults(task.results || [], task.taskId);
  totalCount.value = Math.max(totalCount.value, capturedCount.value);
  isTracing.value = !task.completeTime;
}

async function loadLatestTraceSession(options: {
  onlyActive?: boolean;
  notifyRecovered?: boolean;
  reconnectPull?: boolean;
} = {}) {
  if (!props.browserSessionId) return false;

  isRecovering.value = true;
  try {
    const { data: task, error } = await fetchBrowserSessionTraceSession({
      instanceId: props.instanceId,
      sessionId: props.browserSessionId
    });

    if (error) return false;
    if (!task) {
      if (options.reconnectPull) {
        connectionInterrupted.value = false;
        window.$message?.success('页面连接已恢复，断开期间没有新的 Trace 结果');
      }
      return false;
    }
    if (options.onlyActive && task.completeTime) return false;

    const isRunningTask = !task.completeTime;
    isRestoringTraceSession.value = isRunningTask && !options.reconnectPull;
    const beforeCount = traceResults.value.length;
    applyRecoveredTrace(task, options.reconnectPull);
    const appendedCount = Math.max(0, traceResults.value.length - beforeCount);

    if (options.reconnectPull) {
      connectionInterrupted.value = false;
      const message =
        appendedCount > 0
          ? `页面连接已恢复，已补拉 ${appendedCount} 条新 Trace 结果`
          : '页面连接已恢复，断开期间没有新的 Trace 结果';
      window.$message?.success(message);
    } else if (options.notifyRecovered && isRunningTask) {
      window.$message?.success('已恢复 Trace 会话，继续等待目标方法调用');
    }

    return isRunningTask;
  } finally {
    isRecovering.value = false;
    isRestoringTraceSession.value = false;
  }
}

function launchTrace(action?: TraceLaunchAction | null) {
  if (!action || action.id === handledLaunchActionId.value) return;

  handledLaunchActionId.value = action.id;
  if (isTracing.value) {
    window.$message?.warning('已有进行中的 Trace，会话已恢复，停止后才能追踪新方法');
    return;
  }

  formData.value = {
    ...formData.value,
    className: action.className,
    methodName: action.methodName,
    count: 10,
    minTime: null
  };
  handleStartTrace();
}

// 递归渲染调用栈树为缩进列表
function flattenTraceTree(node: TraceNode, depth: number = 0): Array<{ node: TraceNode; depth: number }> {
  const result: Array<{ node: TraceNode; depth: number }> = [{ node, depth }];
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTraceTree(child, depth + 1));
    }
  }
  return result;
}

// 获取树节点的耗时颜色
function getNodeCostClass(nodeCost: number, rootCost: number): string {
  if (rootCost === 0) return 'text-green-400';
  const ratio = nodeCost / rootCost;
  if (ratio > 0.3) return 'text-red-400';
  if (ratio > 0.1) return 'text-yellow-400';
  return 'text-green-400';
}

// 表格列配置
const columns: DataTableColumns<TraceResponse> = [
  {
    title: '#',
    key: 'index',
    width: 60,
    render: (_row: TraceResponse, rowIndex: number) => `${rowIndex + 1}`
  },
  {
    title: '方法',
    key: 'method',
    width: 200,
    render: (row: TraceResponse) => {
      if (row.node.throwEx) {
        return h('div', [
          h('span', row.node.methodName),
          h(
            'span',
            {
              class: 'text-red-600/[.40] font-semibold'
            },
            ' Throw ex'
          )
        ]);
      }
      return h('div', `${row.node.methodName}`);
    }
  },
  {
    title: '调用时间',
    key: 'time',
    width: 200,
    render: (row: TraceResponse) => row.finishTime
  },
  {
    title: '总耗时 (ms)',
    key: 'duration',
    width: 150,
    render: (row: TraceResponse) => {
      return h(
        NTag,
        {
          type: getDurationTagType(div4Round(row.node.totalCost, 1000000, 0)),
          size: 'small',
          bordered: false
        },
        { default: () => `${div4Round(row.node.totalCost, 1000000, 0)}ms` }
      );
    }
  },
  {
    title: '调用深度',
    key: 'depth',
    width: 120,
    render: (row: TraceResponse) => `${row.node.children.length} 层`
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center',
    render: (row: TraceResponse) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => handleViewDetail(row)
        },
        { default: () => '查看详情' }
      );
    }
  }
];

// 处理 trace 结果
function handleTraceResult(data: CommandExecuteResponse<TraceResponse>) {
  if (currentTaskId.value && data.taskId && data.taskId !== currentTaskId.value) return;

  if (data.data) {
    const traceResponse = data.data as TraceResponse;
    appendTraceResult(traceResponse, data.taskId);
  }
}

// 处理增强完成回调
function handleEnhanceComplete(data: CommandExecuteResponse<EnhanceCommandComplete>) {
  if (!isTracing.value) return;
  const complete = data.data as EnhanceCommandComplete | undefined;
  if (!complete) return;

  // 匹配 trace 命令码，或匹配当前任务ID
  const isTraceComplete =
    complete.code === (commandEnum.TRACE_METHOD.value as number) ||
    (currentTaskId.value && data.taskId === currentTaskId.value);

  if (isTraceComplete) {
    isTracing.value = false;
    currentTaskId.value = '';
    window.$message?.success(`追踪完成! 已捕获 ${capturedCount.value} 条调用记录`);
  }
}

function handleConnectionInterrupted() {
  connectionInterrupted.value = true;
}

function handleConnectionError() {
  connectionInterrupted.value = true;
}

function handleConnectionRestored() {
  if (!connectionInterrupted.value) return;
  loadLatestTraceSession({ reconnectPull: true });
}

onMounted(() => {
  durationTimer = setInterval(() => {
    nowTime.value = Date.now();
  }, 1000);
  eventbus.on('command:trace', handleTraceResult);
  eventbus.on('command:enhance-complete', handleEnhanceComplete);
  eventbus.on('ws:reconnecting', handleConnectionInterrupted);
  eventbus.on('ws:disconnected', handleConnectionInterrupted);
  eventbus.on('ws:error', handleConnectionError);
  eventbus.on('ws:connected', handleConnectionRestored);

  loadLatestTraceSession({ notifyRecovered: true }).then(() => {
    launchTrace(props.launchAction);
  });
});

onUnmounted(() => {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = undefined;
  }
  eventbus.off('command:trace', handleTraceResult);
  eventbus.off('command:enhance-complete', handleEnhanceComplete);
  eventbus.off('ws:reconnecting', handleConnectionInterrupted);
  eventbus.off('ws:disconnected', handleConnectionInterrupted);
  eventbus.off('ws:error', handleConnectionError);
  eventbus.off('ws:connected', handleConnectionRestored);
});

watch(
  () => props.launchAction?.id,
  () => {
    launchTrace(props.launchAction);
  }
);

// 开始追踪
const handleStartTrace = async () => {
  if (!formData.value.className || !formData.value.methodName || !formData.value.count) {
    window.$message?.warning('请填写完整的追踪参数');
    return;
  }
  if (!props.browserSessionId) {
    window.$message?.warning('浏览器会话尚未准备好，请稍后重试');
    return;
  }

  const hasActiveTrace = await loadLatestTraceSession({ onlyActive: true, notifyRecovered: true });
  if (hasActiveTrace) return;

  isTracing.value = true;
  traceStartedAt.value = Date.now();
  nowTime.value = traceStartedAt.value;
  totalCount.value = formData.value.count;
  currentTaskId.value = '';
  clearTraceResults();

  const params = {
    instanceId: props.instanceId,
    browserSessionId: props.browserSessionId,
    param: {
      qualifiedClassName: formData.value.className,
      methodNames: [formData.value.methodName],
      times: formData.value.count,
      cost: formData.value.minTime
    }
  } as CommandCreateRequest<TraceRequest>;

  const { data: taskResponse, error } = await fetchTraceCommand(params);
  if (error) {
    isTracing.value = false;
    return;
  }
  if (taskResponse) {
    currentTaskId.value = taskResponse.taskId || '';
    if (taskResponse.param) {
      applyTraceParam(taskResponse.param);
    }
  }
};

// 停止追踪
const handleStopTrace = async () => {
  const taskId = currentTaskId.value;
  try {
    if (taskId) {
      currentTaskId.value = '';
      await cancelCommandTask(props.instanceId, taskId);
    }
  } catch {
    window.$message?.warning('停止命令下发失败，已先结束本地追踪状态');
  } finally {
    isTracing.value = false;
  }
  window.$message?.info('已停止追踪');
};

// 加载示例
const handleLoadSample = () => {
  formData.value.className = 'com.example.service.UserService';
  formData.value.methodName = 'getUserById';
  formData.value.count = 10;
  formData.value.minTime = 100;
};

// 重置表单
const handleReset = () => {
  formData.value = {
    className: '',
    methodName: '',
    count: 10,
    minTime: null,
    includeJdk: false,
    skipConstructor: false,
    deepTrace: true
  };
};

// 导出结果
const handleExport = () => {
  console.log('导出追踪结果');
  window.$message?.info('导出功能开发中');
};

// 清空结果
const handleClear = () => {
  clearTraceResults();
  window.$message?.success('已清空追踪结果');
};
</script>

<template>
  <div class="trace-container">
    <!-- 追踪配置表单 -->
    <NCard class="id-card mb-6">
      <h4 class="id-card-title-lg">
        <SvgIcon icon="lucide:git-branch" class="text-20px text-primary" />
        方法追踪配置
      </h4>

      <NForm :model="formData" label-placement="top">
        <NGrid :x-gap="16" :y-gap="16" :cols="2">
          <NGridItem>
            <NFormItem label="类全限定名" required>
              <NInput
                v-model:value="formData.className"
                :disabled="shouldLockTraceInputs"
                placeholder="例如: com.example.service.UserService"
              />
            </NFormItem>
          </NGridItem>

          <NGridItem>
            <NFormItem label="方法名称" required>
              <NInput
                v-model:value="formData.methodName"
                :disabled="shouldLockTraceInputs"
                placeholder="例如: getUserById"
              />
            </NFormItem>
          </NGridItem>

          <NGridItem>
            <NFormItem label="追踪次数" required>
              <NInputNumber
                v-model:value="formData.count"
                :min="1"
                :max="1000"
                :disabled="shouldLockTraceInputs"
                placeholder="例如: 10"
                style="width: 100%"
              />
              <template #feedback>
                <span class="text-xs text-gray-500">捕获方法调用的次数(1-1000)</span>
              </template>
            </NFormItem>
          </NGridItem>

          <NGridItem>
            <NFormItem label="最低耗时 (ms)">
              <NInputNumber
                v-model:value="formData.minTime"
                :min="0"
                :disabled="shouldLockTraceInputs"
                placeholder="例如: 100"
                style="width: 100%"
              />
              <template #feedback>
                <span class="text-xs text-gray-500">只记录耗时超过此值的调用</span>
              </template>
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 操作按钮 -->
        <div class="id-action-buttons">
          <NButton v-if="!isTracing" type="primary" :loading="isRecovering" @click="handleStartTrace">
            <template #icon>
              <SvgIcon icon="lucide:play" />
            </template>
            开始追踪
          </NButton>
          <NButton :disabled="shouldLockTraceInputs" @click="handleLoadSample">
            <template #icon>
              <SvgIcon icon="lucide:file-text" />
            </template>
            加载示例
          </NButton>
          <NButton :disabled="shouldLockTraceInputs" @click="handleReset">
            <template #icon>
              <SvgIcon icon="lucide:rotate-ccw" />
            </template>
            重置
          </NButton>
        </div>

        <NAlert v-if="connectionInterrupted" type="warning" class="trace-connection-alert" :show-icon="true">
          <div class="trace-connection-title">页面连接已断开，正在自动重连。</div>
          <div class="trace-connection-body">重连成功后会自动补拉断开期间产生的结果。</div>
        </NAlert>
      </NForm>
    </NCard>

    <!-- 恢复状态 -->
    <NCard v-if="isRestoringTraceSession" class="trace-recovering-card id-card mb-6">
      <div class="trace-recovering-panel">
        <div class="trace-recovering-title">
          <SvgIcon icon="lucide:refresh-cw" class="trace-recovering-icon" />
          <span>正在恢复 Trace 会话</span>
        </div>
        <div class="trace-recovering-grid">
          <div>
            <span class="trace-recovering-label">目标方法：</span>
            <span class="font-mono">{{ traceTarget }}</span>
          </div>
          <div>
            <span class="trace-recovering-label">已知进度：</span>
            <span>{{ capturedCount }}/{{ totalCount }}</span>
          </div>
          <div>
            <span class="trace-recovering-label">运行时长：</span>
            <span>{{ elapsedClockLabel }}</span>
          </div>
        </div>
        <div class="trace-recovering-hint">正在重新连接结果流，请稍后。</div>
      </div>
    </NCard>

    <!-- 追踪状态 -->
    <NCard v-if="isTracing && !isRestoringTraceSession" class="trace-running-card id-card mb-6">
      <div class="trace-running-panel">
        <div class="trace-running-head">
          <div class="trace-running-title">
            <div class="trace-running-pulse" />
            <div>
              <div class="trace-running-name">进行中的追踪</div>
              <div class="trace-running-subtitle">
                <span class="font-mono">{{ traceTarget }}</span>
                <span class="trace-running-divider">/</span>
                <span>{{ traceCondition }}</span>
              </div>
            </div>
          </div>
          <NButton size="small" type="error" @click="handleStopTrace">
            <template #icon>
              <SvgIcon icon="lucide:square" />
            </template>
            停止追踪
          </NButton>
        </div>

        <div class="trace-running-body">
          <div class="trace-running-metrics">
            <div class="trace-running-metric">
              <span class="trace-running-label">已收集</span>
              <span class="trace-running-value">{{ capturedCount }} / {{ totalCount }}</span>
            </div>
            <div class="trace-running-metric">
              <span class="trace-running-label">运行时长</span>
              <span class="trace-running-value">{{ elapsedLabel }}</span>
            </div>
            <div class="trace-running-metric">
              <span class="trace-running-label">进度</span>
              <span class="trace-running-value">{{ progress }}%</span>
            </div>
          </div>
          <NProgress type="line" :percentage="progress" :show-indicator="false" class="trace-running-progress" />
        </div>
      </div>
    </NCard>

    <!-- 追踪结果 -->
    <NCard class="id-table-card">
      <template #header>
        <div class="id-table-header">
          <div class="id-table-title">
            <SvgIcon icon="lucide:list-tree" class="text-16px text-success" />
            <span>调用栈列表</span>
            <span v-if="hasResults" class="text-12px text-gray font-normal">
              追踪: {{ traceResults[0].node.className }}.{{ traceResults[0].node.methodName }}()
            </span>
          </div>
          <div class="id-table-actions">
            <NButton size="small" @click="handleExport">
              <template #icon>
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="handleClear">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-if="!hasResults" class="trace-empty-state">
        <div class="trace-empty-icon">
          <SvgIcon :icon="isWaitingTraceResult ? 'lucide:radar' : 'lucide:git-branch'" />
        </div>
        <template v-if="isWaitingTraceResult && !hasWaitedTooLong">
          <div class="trace-empty-title">追踪命令已生效，正在等待目标方法被调用。</div>
          <div class="trace-empty-body">
            <div>你可以：</div>
            <ol class="trace-empty-list">
              <li>触发一次相关业务请求；</li>
              <li>降低最低耗时阈值；</li>
              <li>检查类名或方法名是否正确。</li>
            </ol>
          </div>
        </template>
        <template v-else-if="hasWaitedTooLong">
          <div class="trace-empty-title">未收集到调用结果</div>
          <div class="trace-empty-body">
            <div>可能原因：</div>
            <ul class="trace-empty-list">
              <li>目标方法在当前时间段没有被调用；</li>
              <li>类名或方法名不匹配；</li>
              <li>最低耗时阈值过高；</li>
              <li>当前实例不是实际处理请求的实例。</li>
            </ul>
          </div>
        </template>
        <template v-else>
          <div class="trace-empty-title">尚未开始收集调用栈</div>
          <div class="trace-empty-body">配置类名、方法名和采样条件后开始追踪。</div>
        </template>
      </div>

      <!-- 结果列表 -->
      <NDataTable
        v-else
        :columns="columns"
        :data="traceResults"
        :bordered="false"
        :single-line="false"
        :max-height="500"
        :row-class-name="(row: TraceResponse) => (row.node.throwEx ? 'trace-row-error' : '')"
        class="id-mono-table"
      />
    </NCard>

    <!-- 调用栈详情模态框 -->
    <NModal v-model:show="showDetailModal" preset="card" title="调用栈详情" style="width: 900px">
      <template #header-extra>
        <div class="i-carbon-branch text-20px text-blue-500" />
      </template>

      <div v-if="selectedTrace" class="detail-content">
        <!-- 追踪信息 -->
        <div class="id-detail-section">
          <h5 class="id-detail-section-title">追踪信息</h5>
          <NGrid :x-gap="12" :y-gap="8" :cols="2">
            <NGridItem>
              <div class="info-item">
                <span class="id-detail-label">调用时间:</span>
                <span class="id-detail-value font-mono">{{ selectedTrace.finishTime }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="id-detail-label">总耗时:</span>
                <NTag
                  :type="getDurationTagType(div4Round(selectedTrace.node.totalCost, 1000000, 0))"
                  size="small"
                  :bordered="false"
                >
                  {{ div4Round(selectedTrace.node.totalCost, 1000000, 0) }}ms
                </NTag>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="id-detail-label">类名:</span>
                <span class="id-detail-value font-mono">{{ selectedTrace.node.className }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="id-detail-label">方法:</span>
                <span class="id-detail-value font-mono">{{ selectedTrace.node.methodName }}()</span>
              </div>
            </NGridItem>
            <NGridItem v-if="selectedTrace.thread">
              <div class="info-item">
                <span class="id-detail-label">线程:</span>
                <span class="id-detail-value font-mono">
                  {{ selectedTrace.thread.name }} (id={{ selectedTrace.thread.id }})
                </span>
              </div>
            </NGridItem>
            <NGridItem v-if="selectedTrace.node.throwEx">
              <div class="info-item">
                <span class="id-detail-label">异常:</span>
                <NTag type="error" size="small" :bordered="false">抛出异常</NTag>
              </div>
            </NGridItem>
          </NGrid>
        </div>

        <!-- 调用栈树 -->
        <div class="trace-tree">
          <h5 class="tree-title">
            <div class="i-carbon-branch text-16px text-blue-500" />
            调用栈树
          </h5>
          <div class="tree-content">
            <div
              v-for="(item, index) in flattenTraceTree(selectedTrace.node)"
              :key="index"
              class="tree-node"
              :style="{ paddingLeft: `${item.depth * 20 + 8}px` }"
            >
              <span class="node-name" :class="{ 'text-red-400': item.node.throwEx }">
                <span v-if="item.depth > 0" class="text-gray-500">{{ '└─ '.repeat(1) }}</span>
                {{ item.node.className }}.{{ item.node.methodName }}()
                <span v-if="item.node.line > 0" class="text-11px text-gray-500">:{{ item.node.line }}</span>
              </span>
              <span :class="getNodeCostClass(item.node.totalCost, selectedTrace.node.totalCost)" class="node-time">
                {{ div4Round(item.node.totalCost, 1000000, 2) }}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style lang="scss">
.trace-container {
  padding: 0;
}

.trace-running-card {
  :deep(.n-card__content) {
    padding: 16px 18px;
  }
}

.trace-connection-alert {
  margin-top: 14px;
}

.trace-connection-title {
  color: var(--n-text-color);
  font-size: 13px;
  font-weight: 600;
}

.trace-connection-body {
  margin-top: 2px;
  color: var(--n-text-color-2);
  font-size: 12px;
}

.trace-recovering-card {
  :deep(.n-card__content) {
    padding: 16px 18px;
  }
}

.trace-recovering-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trace-recovering-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 700;
}

.trace-recovering-icon {
  color: rgb(var(--primary-color));
  font-size: 17px;
}

.trace-recovering-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(120px, 1fr) minmax(120px, 1fr);
  gap: 10px;
  color: var(--n-text-color);
  font-size: 13px;
  line-height: 1.6;
}

.trace-recovering-label {
  color: var(--n-text-color-3);
}

.trace-recovering-hint {
  color: var(--n-text-color-2);
  font-size: 12px;
}

.trace-running-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.trace-running-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.trace-running-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.trace-running-pulse {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 50%;
  background: #18a058;
  box-shadow: 0 0 0 5px rgba(24, 160, 88, 0.14);
}

.trace-running-name {
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.trace-running-subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
  color: var(--n-text-color-2);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}

.trace-running-divider {
  color: var(--n-text-color-3);
}

.trace-running-body {
  display: grid;
  grid-template-columns: minmax(260px, 420px) minmax(0, 1fr);
  gap: 18px;
  align-items: center;
}

.trace-running-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.trace-running-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.trace-running-label {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.trace-running-value {
  min-width: 0;
  overflow: hidden;
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trace-running-progress {
  min-width: 160px;
}

.trace-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 32px 20px;
  color: var(--n-text-color-2);
  text-align: center;
}

.trace-empty-icon {
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

.trace-empty-title {
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 600;
}

.trace-empty-body {
  margin-top: 10px;
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.8;
}

.trace-empty-list {
  margin: 4px 0 0;
  padding-left: 20px;
  text-align: left;
}

@media (max-width: 960px) {
  .trace-recovering-grid {
    grid-template-columns: 1fr;
  }

  .trace-running-body {
    grid-template-columns: 1fr;
  }

  .trace-running-progress {
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .trace-running-head {
    align-items: stretch;
    flex-direction: column;
  }

  .trace-running-metrics {
    grid-template-columns: 1fr;
  }
}

// 异常行样式
.id-mono-table {
  :deep(.trace-row-error) {
    background-color: rgba(239, 68, 68, 0.08);
    border-left: 3px solid rgb(239, 68, 68);

    &:hover {
      background-color: rgba(239, 68, 68, 0.12);
    }
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trace-tree {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.tree-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
  margin: 0 0 12px 0;
}

.tree-content {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.8;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--n-color-target);
  }
}

.node-name {
  flex: 1;
}

.node-time {
  font-weight: 600;
}
</style>
