import { request } from '@/service/request';
import { createRestCommand } from '@/service/api/command';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;
import type { DecompileRequest } from '@/proto/command/param/DecompileRequest';
import type { FileListRequest } from '@/proto/command/param/FileListRequest';
import type { GetStaticRequest } from '@/proto/command/param/GetStaticRequest';
import type { HeapDumpRequest } from '@/proto/command/param/HeapDumpRequest';
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
  return createRestCommand(`/command/creation/overview`, data);
}

export function fetchSystemInfoCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/systemInfo`, data);
}

export function fetchSystemMetricsCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/systemMetricsMonitoring`, data);
}

export function fetchThreadListCommand(data: CommandCreateRequest<ThreadListRequest>) {
  return createRestCommand(`/command/creation/threadList`, data);
}

export function fetchThreadDetailCommand(data: CommandCreateRequest<ThreadDetailRequest>) {
  return createRestCommand(`/command/creation/threadDetail`, data);
}

export function fetchDecompileCommand(data: CommandCreateRequest<DecompileRequest>) {
  return createRestCommand(`/command/creation/decompile`, data);
}

export function fetchHeapDumpCommand(data: CommandCreateRequest<HeapDumpRequest>) {
  return createRestCommand(`/command/creation/heapDump`, data);
}

export function fetchFileListCommand(data: CommandCreateRequest<FileListRequest>) {
  return createRestCommand(`/command/creation/fileList`, data);
}

export function fetchGetStaticCommand(data: CommandCreateRequest<GetStaticRequest>) {
  return createRestCommand(`/command/creation/getStatic`, data);
}

export function fetchJvmMemoryCommand(data: CommandCreateRequest<Record<string, never>>) {
  return createRestCommand(`/command/creation/jvmMemory`, data);
}

export function fetchVmOptionCommand(data: CommandCreateRequest<VmOptionRequest>) {
  return createRestCommand(`/command/creation/getVmOption`, data);
}

export function fetchSetVmOptionCommand(data: CommandCreateRequest<SetVmOptionRequest>) {
  return createRestCommand(`/command/creation/setVmOption`, data);
}

export function fetchLoggerInfoCommand(data: CommandCreateRequest<LoggerInfoRequest>) {
  return createRestCommand(`/command/creation/loggerInfo`, data);
}

export function fetchUpdateLoggerLevelCommand(data: CommandCreateRequest<UpdateLoggerLevelRequest>) {
  return createRestCommand(`/command/creation/updateLoggerLevel`, data);
}

export function fetchTraceCommand(data: CommandCreateRequest<TraceRequest>) {
  return createRestCommand(`/command/creation/traceMethod`, data);
}

export function fetchStackCommand(data: CommandCreateRequest<StackRequest>) {
  return createRestCommand(`/command/creation/stackMethod`, data);
}

export function fetchSearchClassCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/searchClass`, data);
}

export function fetchSearchMethodCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/searchMethod`, data);
}

export function fetchClassLoaderTreeCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/classLoaderTree`, data);
}

export function fetchOgnlCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/ognl`, data);
}

export function fetchWatchCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/watchMethod`, data);
}

export function fetchMonitorCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/monitorMethod`, data);
}

export function fetchTimeTunnelCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/timeTunnel`, data);
}

export function fetchProfilerStartCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/profilerStart`, data);
}

export function fetchProfilerStopCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/profilerStop`, data);
}

export function fetchJfrStartCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/jfrStart`, data);
}

export function fetchJfrStopCommand(data: CommandCreateRequest<any>) {
  return createRestCommand(`/command/creation/jfrStop`, data);
}

export function fetchRetransformCommand(data: CommandCreateRequest<RetransformRequest>) {
  return createRestCommand(`/command/creation/retransform`, data);
}

export function fetchRetransformHistoryCommand(data: CommandCreateRequest<Record<string, never>>) {
  return createRestCommand(`/command/creation/retransformHistory`, data);
}

export function fetchRetransformDetailCommand(data: CommandCreateRequest<RetransformDetailRequest>) {
  return createRestCommand(`/command/creation/retransformDetail`, data);
}

export function fetchRetransformRevertCommand(data: CommandCreateRequest<RetransformRevertRequest>) {
  return createRestCommand(`/command/creation/retransformRevert`, data);
}

export function fetchEnhanceTaskListCommand(data: CommandCreateRequest<Record<string, never>>) {
  return createRestCommand(`/command/creation/traceTaskList`, data);
}

export function cancelCommandTask(instanceId: string, taskId: string) {
  return request<void>({
    url: `/command/creation/cancelTask`,
    method: 'post',
    params: { instanceId, taskId }
  });
}
