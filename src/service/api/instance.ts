import { request } from '@/service/request';
import { createRestCommand } from '@/service/api/command';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;
import type { DecompileRequest } from '@/proto/command/param/DecompileRequest';
import type { FileListRequest } from '@/proto/command/param/FileListRequest';
import type { GetStaticRequest } from '@/proto/command/param/GetStaticRequest';
import type { HeapDumpRequest } from '@/proto/command/param/HeapDumpRequest';
import type { InspectRequest } from '@/proto/command/param/InspectRequest';
import type { LoggerInfoRequest } from '@/proto/command/param/LoggerInfoRequest';
import type { RetransformDetailRequest } from '@/proto/command/param/RetransformDetailRequest';
import type { RetransformRequest } from '@/proto/command/param/RetransformRequest';
import type { RetransformRevertRequest } from '@/proto/command/param/RetransformRevertRequest';
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
  return createRestCommand('overview', data);
}

export function fetchSystemInfoCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('systemInfo', data);
}

export function fetchSystemMetricsCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('systemMetricsMonitoring', data);
}

export function fetchThreadListCommand(data: CommandCreateRequest<ThreadListRequest>) {
  return createRestCommand('threadList', data);
}

export function fetchThreadDetailCommand(data: CommandCreateRequest<ThreadDetailRequest>) {
  return createRestCommand('threadDetail', data);
}

export function fetchDecompileCommand(data: CommandCreateRequest<DecompileRequest>) {
  return createRestCommand('decompile', data);
}

export function fetchHeapDumpCommand(data: CommandCreateRequest<HeapDumpRequest>) {
  return createRestCommand('heapDump', data);
}

export function fetchFileListCommand(data: CommandCreateRequest<FileListRequest>) {
  return createRestCommand('fileList', data);
}

export function fetchGetStaticCommand(data: CommandCreateRequest<GetStaticRequest>) {
  return createRestCommand('getStatic', data);
}

export function fetchJvmMemoryCommand(data: CommandCreateRequest<Record<string, never>>) {
  return createRestCommand('jvmMemory', data);
}

export function fetchVmOptionCommand(data: CommandCreateRequest<VmOptionRequest>) {
  return createRestCommand('getVmOption', data);
}

export function fetchSetVmOptionCommand(data: CommandCreateRequest<SetVmOptionRequest>) {
  return createRestCommand('setVmOption', data);
}

export function fetchLoggerInfoCommand(data: CommandCreateRequest<LoggerInfoRequest>) {
  return createRestCommand('loggerInfo', data);
}

export function fetchUpdateLoggerLevelCommand(data: CommandCreateRequest<UpdateLoggerLevelRequest>) {
  return createRestCommand('updateLoggerLevel', data);
}

export function fetchTraceCommand(data: CommandCreateRequest<TraceRequest>) {
  return createRestCommand('traceMethod', data);
}

export function fetchStackCommand(data: CommandCreateRequest<StackRequest>) {
  return createRestCommand('stackMethod', data);
}

export function fetchSearchClassCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('searchClass', data);
}

export function fetchSearchMethodCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('searchMethod', data);
}

export function fetchClassLoaderTreeCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('classLoaderTree', data);
}

export function fetchOgnlCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('ognl', data);
}

export function fetchWatchCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('watchMethod', data);
}

export function fetchInspectCommand(data: CommandCreateRequest<InspectRequest>) {
  return createRestCommand('inspectMethod', data);
}

export function fetchMonitorCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('monitorMethod', data);
}

export function fetchTimeTunnelCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('timeTunnel', data);
}

export function fetchProfilerStartCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('profilerStart', data);
}

export function fetchProfilerStopCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('profilerStop', data);
}

export function fetchJfrStartCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('jfrStart', data);
}

export function fetchJfrStopCommand(data: CommandCreateRequest<any>) {
  return createRestCommand('jfrStop', data);
}

export function fetchRetransformCommand(data: CommandCreateRequest<RetransformRequest>) {
  return createRestCommand('retransform', data);
}

export function fetchRetransformHistoryCommand(data: CommandCreateRequest<Record<string, never>>) {
  return createRestCommand('retransformHistory', data);
}

export function fetchRetransformDetailCommand(data: CommandCreateRequest<RetransformDetailRequest>) {
  return createRestCommand('retransformDetail', data);
}

export function fetchRetransformRevertCommand(data: CommandCreateRequest<RetransformRevertRequest>) {
  return createRestCommand('retransformRevert', data);
}

export function fetchEnhanceTaskListCommand(data: CommandCreateRequest<Record<string, never>>) {
  return createRestCommand('traceTaskList', data);
}

export function cancelCommandTask(instanceId: string, taskId: string) {
  return request<void>({
    url: `/command/creation/cancelTask`,
    method: 'post',
    params: { instanceId, taskId }
  });
}
