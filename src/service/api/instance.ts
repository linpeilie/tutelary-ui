import { request } from '@/service/request';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;
import type { DecompileRequest } from '@/proto/command/param/DecompileRequest';
import type { LoggerInfoRequest } from '@/proto/command/param/LoggerInfoRequest';
import type { SetVmOptionRequest } from '@/proto/command/param/SetVmOptionRequest';
import type { StackRequest } from '@/proto/command/param/StackRequest';
import type { ThreadDetailRequest } from '@/proto/command/param/ThreadDetailRequest';
import type { ThreadListRequest } from '@/proto/command/param/ThreadListRequest';
import type { TraceRequest } from '@/proto/command/param/TraceRequest';
import type { UpdateLoggerLevelRequest } from '@/proto/command/param/UpdateLoggerLevelRequest';
import type { VmOptionRequest } from '@/proto/command/param/VmOptionRequest';

export function fetchInstanceDetail(instanceId: string) {
  return request<Api.Instance.InstanceInfo>({
    url: `/instance/detail`,
    method: 'post',
    params: {
      instanceId
    }
  });
}

export function fetchDashboardCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/overview`,
    method: 'post',
    data
  });
}

export function fetchSystemInfoCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/systemInfo`,
    method: 'post',
    data
  });
}

export function fetchSystemMetricsCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/systemMetricsMonitoring`,
    method: 'post',
    data
  });
}

export function fetchThreadListCommand(data: CommandCreateRequest<ThreadListRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/threadList`,
    method: 'post',
    data
  });
}

export function fetchThreadDetailCommand(data: CommandCreateRequest<ThreadDetailRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/threadDetail`,
    method: 'post',
    data
  });
}

export function fetchDecompileCommand(data: CommandCreateRequest<DecompileRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/decompile`,
    method: 'post',
    data
  });
}

export function fetchJvmMemoryCommand(data: CommandCreateRequest<Record<string, never>>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/jvmMemory`,
    method: 'post',
    data
  });
}

export function fetchVmOptionCommand(data: CommandCreateRequest<VmOptionRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/getVmOption`,
    method: 'post',
    data
  });
}

export function fetchSetVmOptionCommand(data: CommandCreateRequest<SetVmOptionRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/setVmOption`,
    method: 'post',
    data
  });
}

export function fetchLoggerInfoCommand(data: CommandCreateRequest<LoggerInfoRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/loggerInfo`,
    method: 'post',
    data
  });
}

export function fetchUpdateLoggerLevelCommand(data: CommandCreateRequest<UpdateLoggerLevelRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/updateLoggerLevel`,
    method: 'post',
    data
  });
}

export function fetchTraceCommand(data: CommandCreateRequest<TraceRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/traceMethod`,
    method: 'post',
    data
  });
}

export function fetchStackCommand(data: CommandCreateRequest<StackRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/stackMethod`,
    method: 'post',
    data
  });
}

export function fetchSearchClassCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/searchClass`,
    method: 'post',
    data
  });
}

export function fetchSearchMethodCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/searchMethod`,
    method: 'post',
    data
  });
}

export function fetchClassLoaderTreeCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/classLoaderTree`,
    method: 'post',
    data
  });
}

export function fetchOgnlCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/ognl`,
    method: 'post',
    data
  });
}

export function fetchWatchCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/watchMethod`,
    method: 'post',
    data
  });
}

export function fetchMonitorCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/monitorMethod`,
    method: 'post',
    data
  });
}

export function fetchTimeTunnelCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/timeTunnel`,
    method: 'post',
    data
  });
}

export function fetchProfilerStartCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/profilerStart`,
    method: 'post',
    data
  });
}

export function fetchProfilerStopCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/profilerStop`,
    method: 'post',
    data
  });
}

export function fetchJfrStartCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/jfrStart`,
    method: 'post',
    data
  });
}

export function fetchJfrStopCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/jfrStop`,
    method: 'post',
    data
  });
}

export function fetchRetransformCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/retransform`,
    method: 'post',
    data
  });
}

export function fetchRetransformHistoryCommand(data: CommandCreateRequest<Record<string, never>>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/retransformHistory`,
    method: 'post',
    data
  });
}

export function fetchRetransformDetailCommand(data: CommandCreateRequest<{ qualifiedClassName: string }>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/retransformDetail`,
    method: 'post',
    data
  });
}

export function fetchRetransformRevertCommand(data: CommandCreateRequest<{ qualifiedClassName: string }>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/retransformRevert`,
    method: 'post',
    data
  });
}

export function fetchEnhanceTaskListCommand(data: CommandCreateRequest<Record<string, never>>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/traceTaskList`,
    method: 'post',
    data
  });
}

export function cancelCommandTask(instanceId: string, taskId: string) {
  return request<void>({
    url: `/command/creation/cancelTask`,
    method: 'post',
    params: { instanceId, taskId }
  });
}
