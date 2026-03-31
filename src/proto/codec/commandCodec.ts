import { commandEnum } from '@/enum/commandEnums'
import { DecompileResponse } from '@/proto/command/result/DecompileResponse'
import { EnhanceAffect } from '@/proto/command/result/EnhanceAffect'
import { EnhanceCommandComplete } from '@/proto/command/result/EnhanceCommandComplete'
import { FileListResponse } from '@/proto/command/result/FileListResponse'
import { GetStaticResponse } from '@/proto/command/result/GetStaticResponse'
import { HeapDumpResponse } from '@/proto/command/result/HeapDumpResponse'
import { LoggerInfoResponse } from '@/proto/command/result/LoggerInfoResponse'
import { Overview } from '@/proto/command/result/Overview'
import { RetransformResponse } from '@/proto/command/result/RetransformResponse'
import { RetransformHistoryResponse } from '@/proto/command/result/RetransformHistoryResponse'
import { RetransformDetailResponse } from '@/proto/command/result/RetransformDetailResponse'
import { RetransformRevertResponse } from '@/proto/command/result/RetransformRevertResponse'
import { EnhanceTaskListResponse } from '@/proto/command/result/EnhanceTaskListResponse'
import { SetVmOptionResponse } from '@/proto/command/result/SetVmOptionResponse'
import { StackResponse } from '@/proto/command/result/StackResponse'
import { ThreadDetail } from '@/proto/command/result/ThreadDetail'
import { ThreadList } from '@/proto/command/result/ThreadList'
import { TraceResponse } from '@/proto/command/result/TraceResponse'
import { UpdateLoggerLevelResponse } from '@/proto/command/result/UpdateLoggerLevelResponse'
import { VmOptionResponse } from '@/proto/command/result/VmOptionResponse'
import { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse'
import { SystemInfoResponse } from '@/proto/command/result/SystemInfoResponse'
import { SystemMetricsResponse } from '@/proto/command/result/SystemMetricsResponse';
import { SearchClassResponse } from '@/proto/command/result/SearchClassResponse';
import { SearchMethodResponse } from '@/proto/command/result/SearchMethodResponse';
import { ClassLoaderTreeResponse } from '@/proto/command/result/ClassLoaderTreeResponse';
import { OgnlResponse } from '@/proto/command/result/OgnlResponse';
import { WatchResponse } from '@/proto/command/result/WatchResponse';
import { MonitorResponse } from '@/proto/command/result/MonitorResponse';
import { TimeTunnelResponse } from '@/proto/command/result/TimeTunnelResponse';
import { ProfilerStartResponse } from '@/proto/command/result/ProfilerStartResponse';
import { ProfilerStopResponse } from '@/proto/command/result/ProfilerStopResponse';
import { JfrStartResponse } from '@/proto/command/result/JfrStartResponse';
import { JfrStopResponse } from '@/proto/command/result/JfrStopResponse';

export default {
  decode: (command: number, unit8Array: Uint8Array) => {
    // overview
    if (command === commandEnum.OVERVIEW.value)
      return Overview.decode(unit8Array)

    // threadList
    if (command === commandEnum.THREAD_LIST.value)
      return ThreadList.decode(unit8Array)

    // threadDetail
    if (command === commandEnum.THREAD_DETAIL.value)
      return ThreadDetail.decode(unit8Array)

    // heapDump
    if (command === commandEnum.HEAP_DUMP.value)
      return HeapDumpResponse.decode(unit8Array)

    // fileList
    if (command === commandEnum.FILE_LIST.value)
      return FileListResponse.decode(unit8Array)

    // decompile
    if (command === commandEnum.DECOMPILE.value)
      return DecompileResponse.decode(unit8Array)

    // loggerInfo
    if (command === commandEnum.LOGGER_INFO.value)
      return LoggerInfoResponse.decode(unit8Array)

    // updateLoggerLevel
    if (command === commandEnum.UPDATE_LOGGER_LEVEL.value)
      return UpdateLoggerLevelResponse.decode(unit8Array)

    // getStatic
    if (command === commandEnum.GET_STATIC.value)
      return GetStaticResponse.decode(unit8Array)

    // getVmOption
    if (command === commandEnum.GET_VM_OPTION.value)
      return VmOptionResponse.decode(unit8Array)

    // setVmOption
    if (command === commandEnum.SET_VM_OPTION.value)
      return SetVmOptionResponse.decode(unit8Array)

    if (command === commandEnum.ENHANCE_AFFECT.value)
      return EnhanceAffect.decode(unit8Array)

    if (command === commandEnum.ENHANCE_COMPLETE.value)
      return EnhanceCommandComplete.decode(unit8Array)

    // traceMethod
    if (command === commandEnum.TRACE_METHOD.value)
      return TraceResponse.decode(unit8Array)

    // stackMethod
    if (command === commandEnum.STACK_METHOD.value)
      return StackResponse.decode(unit8Array)

    // retransform
    if (command === commandEnum.RETRANSFORM.value)
      return RetransformResponse.decode(unit8Array)

    if (command === commandEnum.RETRANSFORM_HISTORY.value)
      return RetransformHistoryResponse.decode(unit8Array)

    if (command === commandEnum.RETRANSFORM_DETAIL.value)
      return RetransformDetailResponse.decode(unit8Array)

    if (command === commandEnum.RETRANSFORM_REVERT.value)
      return RetransformRevertResponse.decode(unit8Array)

    if (command === commandEnum.ENHANCE_TASK_LIST.value)
      return EnhanceTaskListResponse.decode(unit8Array)

    if (command === commandEnum.JVM_MEMORY.value)
      return JvmMemoryResponse.decode(unit8Array)

    if (command === commandEnum.SYSTEM_INFO.value)
      return SystemInfoResponse.decode(unit8Array)

    if (command === commandEnum.SYSTEM_METRICS.value)
      return SystemMetricsResponse.decode(unit8Array)

    if (command === commandEnum.SEARCH_CLASS.value)
      return SearchClassResponse.decode(unit8Array)

    if (command === commandEnum.SEARCH_METHOD.value)
      return SearchMethodResponse.decode(unit8Array)

    if (command === commandEnum.CLASS_LOADER_TREE.value)
      return ClassLoaderTreeResponse.decode(unit8Array)

    if (command === commandEnum.OGNL.value)
      return OgnlResponse.decode(unit8Array)

    if (command === commandEnum.WATCH_METHOD.value)
      return WatchResponse.decode(unit8Array)

    if (command === commandEnum.MONITOR_METHOD.value)
      return MonitorResponse.decode(unit8Array)

    if (command === commandEnum.TIME_TUNNEL.value)
      return TimeTunnelResponse.decode(unit8Array)

    if (command === commandEnum.PROFILER_START.value)
      return ProfilerStartResponse.decode(unit8Array)

    if (command === commandEnum.PROFILER_STOP.value)
      return ProfilerStopResponse.decode(unit8Array)

    if (command === commandEnum.JFR_START.value)
      return JfrStartResponse.decode(unit8Array)

    if (command === commandEnum.JFR_STOP.value)
      return JfrStopResponse.decode(unit8Array)

    return undefined
  },
}
