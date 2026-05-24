import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { cancelCommandTask, fetchInspectCommand } from '@/service/api/instance';
import { fetchBrowserSessionInspectSession } from '@/service/api/browser-session';
import { commandEnum } from '@/enum/commandEnums';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { InspectRequest } from '@/proto/command/param/InspectRequest';
import type { InspectResponse } from '@/proto/command/result/InspectResponse';
import type { EnhanceCommandComplete } from '@/proto/command/result/EnhanceCommandComplete';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;

interface UseInspectTaskOptions {
  instanceId: () => string;
  browserSessionId: () => string;
  applyRecoveredParam: (param?: string) => InspectRequest | undefined;
}

function parseTime(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function expectedResultCount(request?: InspectRequest) {
  if (!request) return 0;
  return Math.max(request.methodNames?.length || 0, 1) * Math.max(request.times || 1, 1);
}

function buildResultKey(result: InspectResponse, taskId?: string) {
  return [
    taskId || 'unknown',
    result.finishTime || '',
    result.className || '',
    result.methodName || '',
    result.cost || 0,
    result.thread?.id || '',
    result.exception || ''
  ].join('|');
}

function formatElapsed(duration: number) {
  const totalSeconds = Math.floor(Math.max(0, duration) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
  return `${seconds}秒`;
}

export function useInspectTask(options: UseInspectTaskOptions) {
  const isRunning = shallowRef(false);
  const isRecovering = shallowRef(false);
  const connectionInterrupted = shallowRef(false);
  const currentTaskId = shallowRef('');
  const inspectStartedAt = shallowRef(0);
  const nowTime = shallowRef(Date.now());
  const totalExpectedCount = shallowRef(0);
  const results = ref<InspectResponse[]>([]);
  const resultKeys = new Set<string>();
  let durationTimer: ReturnType<typeof setInterval> | undefined;

  const capturedCount = computed(() => results.value.length);
  const progress = computed(() => {
    if (totalExpectedCount.value <= 0) return 0;
    return Math.min(Math.round((capturedCount.value / totalExpectedCount.value) * 100), 100);
  });
  const elapsedMs = computed(() => {
    if (!isRunning.value || inspectStartedAt.value <= 0) return 0;
    return Math.max(0, nowTime.value - inspectStartedAt.value);
  });
  const elapsedLabel = computed(() => formatElapsed(elapsedMs.value));
  const isWaitingResult = computed(() => isRunning.value && results.value.length === 0);
  const hasWaitedTooLong = computed(() => isWaitingResult.value && elapsedMs.value >= 60_000);

  function clearResults() {
    results.value = [];
    resultKeys.clear();
  }

  function appendResult(result: InspectResponse, taskId?: string) {
    const key = buildResultKey(result, taskId || currentTaskId.value);
    if (resultKeys.has(key)) return false;
    resultKeys.add(key);
    results.value.push(result);
    return true;
  }

  function appendResults(recoveredResults: unknown[] = [], taskId?: string) {
    let appended = 0;
    for (const result of recoveredResults) {
      if (appendResult(result as InspectResponse, taskId)) {
        appended += 1;
      }
    }
    return appended;
  }

  function applyRecoveredTask(task: Api.Instance.Command.BrowserSessionEnhanceTaskResponse, appendOnly = false) {
    currentTaskId.value = task.taskId || '';
    const request = options.applyRecoveredParam(task.param);
    totalExpectedCount.value = Math.max(expectedResultCount(request), task.results?.length || 0);
    inspectStartedAt.value = parseTime(task.createTime) || Date.now();
    nowTime.value = Date.now();
    if (!appendOnly) {
      clearResults();
    }
    appendResults(task.results || [], task.taskId);
    isRunning.value = !task.completeTime;
  }

  async function loadLatest(optionsOverride: {
    onlyActive?: boolean;
    notifyRecovered?: boolean;
    reconnectPull?: boolean;
  } = {}) {
    const sessionId = options.browserSessionId();
    if (!sessionId) return false;

    isRecovering.value = true;
    try {
      const { data: task, error } = await fetchBrowserSessionInspectSession({
        instanceId: options.instanceId(),
        sessionId
      });

      if (error) return false;
      if (!task) {
        if (optionsOverride.reconnectPull) {
          connectionInterrupted.value = false;
          window.$message?.success('页面连接已恢复，断开期间没有新的 Inspect 结果');
        }
        return false;
      }
      if (optionsOverride.onlyActive && task.completeTime) return false;

      const beforeCount = results.value.length;
      const isRunningTask = !task.completeTime;
      applyRecoveredTask(task, optionsOverride.reconnectPull);
      const appendedCount = Math.max(0, results.value.length - beforeCount);

      if (optionsOverride.reconnectPull) {
        connectionInterrupted.value = false;
        const message = appendedCount > 0
          ? `页面连接已恢复，已补拉 ${appendedCount} 条新 Inspect 结果`
          : '页面连接已恢复，断开期间没有新的 Inspect 结果';
        window.$message?.success(message);
      } else if (optionsOverride.notifyRecovered && isRunningTask) {
        window.$message?.success('已恢复 Inspect 会话，继续等待目标方法调用');
      }

      return isRunningTask;
    } finally {
      isRecovering.value = false;
    }
  }

  async function start(request: InspectRequest) {
    const sessionId = options.browserSessionId();
    if (!sessionId) {
      window.$message?.warning('浏览器会话尚未准备好，请稍后重试');
      return false;
    }

    const hasActiveInspect = await loadLatest({ onlyActive: true, notifyRecovered: true });
    if (hasActiveInspect) return false;

    isRunning.value = true;
    inspectStartedAt.value = Date.now();
    nowTime.value = inspectStartedAt.value;
    totalExpectedCount.value = expectedResultCount(request);
    currentTaskId.value = '';
    clearResults();

    const payload = {
      instanceId: options.instanceId(),
      browserSessionId: sessionId,
      param: request
    } as CommandCreateRequest<InspectRequest>;

    const { data: taskResponse, error } = await fetchInspectCommand(payload);
    if (error) {
      isRunning.value = false;
      return false;
    }
    if (taskResponse) {
      currentTaskId.value = taskResponse.taskId || '';
      if (taskResponse.param) {
        const recoveredRequest = options.applyRecoveredParam(taskResponse.param);
        totalExpectedCount.value = expectedResultCount(recoveredRequest || request);
      }
    }
    return true;
  }

  async function cancel() {
    const taskId = currentTaskId.value;
    try {
      if (taskId) {
        currentTaskId.value = '';
        await cancelCommandTask(options.instanceId(), taskId);
      }
    } catch {
      window.$message?.warning('停止命令下发失败，已先结束本地 Inspect 状态');
    } finally {
      isRunning.value = false;
    }
    window.$message?.info('已停止 Inspect');
  }

  function handleInspectResult(response: CommandExecuteResponse<InspectResponse>) {
    if (currentTaskId.value && response.taskId && response.taskId !== currentTaskId.value) return;
    if (response.data) {
      appendResult(response.data as InspectResponse, response.taskId);
    }
  }

  function handleEnhanceComplete(response: CommandExecuteResponse<EnhanceCommandComplete>) {
    if (!isRunning.value) return;
    const complete = response.data as EnhanceCommandComplete | undefined;
    if (!complete) return;
    const isInspectComplete =
      complete.code === (commandEnum.INSPECT_METHOD.value as number) ||
      (currentTaskId.value && response.taskId === currentTaskId.value);
    if (!isInspectComplete) return;

    isRunning.value = false;
    currentTaskId.value = '';
    window.$message?.success(`Inspect 完成，已捕获 ${capturedCount.value} 条调用记录`);
  }

  function handleConnectionInterrupted() {
    connectionInterrupted.value = true;
  }

  function handleConnectionRestored() {
    if (!connectionInterrupted.value) return;
    loadLatest({ reconnectPull: true });
  }

  onMounted(() => {
    durationTimer = setInterval(() => {
      nowTime.value = Date.now();
    }, 1000);
    eventBus.on('command:inspect', handleInspectResult);
    eventBus.on('command:enhance-complete', handleEnhanceComplete);
    eventBus.on('ws:reconnecting', handleConnectionInterrupted);
    eventBus.on('ws:disconnected', handleConnectionInterrupted);
    eventBus.on('ws:error', handleConnectionInterrupted);
    eventBus.on('ws:connected', handleConnectionRestored);
  });

  onUnmounted(() => {
    if (durationTimer) {
      clearInterval(durationTimer);
      durationTimer = undefined;
    }
    eventBus.off('command:inspect', handleInspectResult);
    eventBus.off('command:enhance-complete', handleEnhanceComplete);
    eventBus.off('ws:reconnecting', handleConnectionInterrupted);
    eventBus.off('ws:disconnected', handleConnectionInterrupted);
    eventBus.off('ws:error', handleConnectionInterrupted);
    eventBus.off('ws:connected', handleConnectionRestored);
  });

  return {
    isRunning,
    isRecovering,
    connectionInterrupted,
    currentTaskId,
    totalExpectedCount,
    capturedCount,
    progress,
    elapsedLabel,
    isWaitingResult,
    hasWaitedTooLong,
    results,
    start,
    cancel,
    clearResults,
    loadLatest
  };
}
