import { commandEnum } from '@/enum/commandEnums';
import { DecompileResponse } from '@/proto/command/result/DecompileResponse';
import { EnhanceAffect } from '@/proto/command/result/EnhanceAffect';
import { EnhanceCommandComplete } from '@/proto/command/result/EnhanceCommandComplete';
import { FileListResponse } from '@/proto/command/result/FileListResponse';
import { GetStaticResponse } from '@/proto/command/result/GetStaticResponse';
import { HeapDumpResponse } from '@/proto/command/result/HeapDumpResponse';
import { LoggerInfoResponse } from '@/proto/command/result/LoggerInfoResponse';
import { Overview } from '@/proto/command/result/Overview';
import { RetransformResponse } from '@/proto/command/result/RetransformResponse';
import { RetransformHistoryResponse } from '@/proto/command/result/RetransformHistoryResponse';
import { RetransformDetailResponse } from '@/proto/command/result/RetransformDetailResponse';
import { RetransformRevertResponse } from '@/proto/command/result/RetransformRevertResponse';
import { EnhanceTaskListResponse } from '@/proto/command/result/EnhanceTaskListResponse';
import { SetVmOptionResponse } from '@/proto/command/result/SetVmOptionResponse';
import { StackResponse } from '@/proto/command/result/StackResponse';
import { ThreadDetail } from '@/proto/command/result/ThreadDetail';
import { ThreadList } from '@/proto/command/result/ThreadList';
import { TraceResponse } from '@/proto/command/result/TraceResponse';
import { UpdateLoggerLevelResponse } from '@/proto/command/result/UpdateLoggerLevelResponse';
import { VmOptionResponse } from '@/proto/command/result/VmOptionResponse';
import { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse';
import { SystemInfoResponse } from '@/proto/command/result/SystemInfoResponse';
import { SystemMetricsResponse } from '@/proto/command/result/SystemMetricsResponse';
import { SearchClassResponse } from '@/proto/command/result/SearchClassResponse';
import { SearchMethodResponse } from '@/proto/command/result/SearchMethodResponse';
import { ClassLoaderTreeResponse } from '@/proto/command/result/ClassLoaderTreeResponse';
import { OgnlResponse } from '@/proto/command/result/OgnlResponse';
import { WatchResponse } from '@/proto/command/result/WatchResponse';
import { MonitorResponse } from '@/proto/command/result/MonitorResponse';
import { TimeTunnelResponse } from '@/proto/command/result/TimeTunnelResponse';
import { InspectResponse } from '@/proto/command/result/InspectResponse';
import { ProfilerStartResponse } from '@/proto/command/result/ProfilerStartResponse';
import { ProfilerStopResponse } from '@/proto/command/result/ProfilerStopResponse';
import { JfrStartResponse } from '@/proto/command/result/JfrStartResponse';
import { JfrStopResponse } from '@/proto/command/result/JfrStopResponse';

type CommandDecoder<T = unknown> = {
  decode: (input: Uint8Array) => T;
};

const commandDecoderMap = new Map<number, CommandDecoder>([
  [commandEnum.OVERVIEW.value, Overview],
  [commandEnum.THREAD_LIST.value, ThreadList],
  [commandEnum.THREAD_DETAIL.value, ThreadDetail],
  [commandEnum.HEAP_DUMP.value, HeapDumpResponse],
  [commandEnum.FILE_LIST.value, FileListResponse],
  [commandEnum.DECOMPILE.value, DecompileResponse],
  [commandEnum.LOGGER_INFO.value, LoggerInfoResponse],
  [commandEnum.UPDATE_LOGGER_LEVEL.value, UpdateLoggerLevelResponse],
  [commandEnum.GET_STATIC.value, GetStaticResponse],
  [commandEnum.GET_VM_OPTION.value, VmOptionResponse],
  [commandEnum.SET_VM_OPTION.value, SetVmOptionResponse],
  [commandEnum.JVM_MEMORY.value, JvmMemoryResponse],
  [commandEnum.SYSTEM_INFO.value, SystemInfoResponse],
  [commandEnum.SYSTEM_METRICS.value, SystemMetricsResponse],
  [commandEnum.SEARCH_CLASS.value, SearchClassResponse],
  [commandEnum.SEARCH_METHOD.value, SearchMethodResponse],
  [commandEnum.CLASS_LOADER_TREE.value, ClassLoaderTreeResponse],
  [commandEnum.OGNL.value, OgnlResponse],
  [commandEnum.PROFILER_START.value, ProfilerStartResponse],
  [commandEnum.PROFILER_STOP.value, ProfilerStopResponse],
  [commandEnum.JFR_START.value, JfrStartResponse],
  [commandEnum.JFR_STOP.value, JfrStopResponse],
  [commandEnum.RETRANSFORM_HISTORY.value, RetransformHistoryResponse],
  [commandEnum.RETRANSFORM_DETAIL.value, RetransformDetailResponse],
  [commandEnum.RETRANSFORM_REVERT.value, RetransformRevertResponse],
  [commandEnum.ENHANCE_TASK_LIST.value, EnhanceTaskListResponse],
  [commandEnum.ENHANCE_AFFECT.value, EnhanceAffect],
  [commandEnum.ENHANCE_COMPLETE.value, EnhanceCommandComplete],
  [commandEnum.TRACE_METHOD.value, TraceResponse],
  [commandEnum.STACK_METHOD.value, StackResponse],
  [commandEnum.RETRANSFORM.value, RetransformResponse],
  [commandEnum.WATCH_METHOD.value, WatchResponse],
  [commandEnum.MONITOR_METHOD.value, MonitorResponse],
  [commandEnum.TIME_TUNNEL.value, TimeTunnelResponse],
  [commandEnum.INSPECT_METHOD.value, InspectResponse]
]);

function decode(command: number, uint8Array?: Uint8Array) {
  if (!uint8Array) {
    return undefined;
  }

  return commandDecoderMap.get(command)?.decode(uint8Array);
}

export { decode };

export default {
  decode
};
