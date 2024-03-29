import type { CommandCreateRequest, CommandTaskResponse } from './types/commandCreateTypes'
import type { LoggerInfoRequest } from '@/proto/command/param/LoggerInfoRequest'
import type { DecompileRequest } from '@/proto/command/param/DecompileRequest'
import type { ThreadDetailRequest } from '@/proto/command/param/ThreadDetailRequest'
import type { ThreadListRequest } from '@/proto/command/param/ThreadListRequest'
import type { VmOptionRequest } from '@/proto/command/param/VmOptionRequest'
import { request } from '@/utils'
import type { TraceRequest } from '@/proto/command/param/TraceRequest'

export default {
  createThreadListCommand: (data: CommandCreateRequest<ThreadListRequest>) =>
    request.post<CommandCreateRequest<ThreadListRequest>, CommandTaskResponse>('command/creation/threadList', data, { showLoading: false }),
  createThreadDetail: (data: CommandCreateRequest<ThreadDetailRequest>) =>
    request.post<CommandCreateRequest<ThreadDetailRequest>, CommandTaskResponse>('command/creation/threadDetail', data, { showLoading: false }),
  createDecompile: (data: CommandCreateRequest<DecompileRequest>) =>
    request.post<CommandCreateRequest<DecompileRequest>, CommandTaskResponse>('command/creation/decompile', data, { showLoading: false }),
  createGetVmOption: (data: CommandCreateRequest<VmOptionRequest>) =>
    request.post<CommandCreateRequest<VmOptionRequest>, CommandTaskResponse>('command/creation/getVmOption', data, { showLoading: false }),
  createLoggerInfo: (data: CommandCreateRequest<LoggerInfoRequest>) =>
    request.post<CommandCreateRequest<LoggerInfoRequest>, CommandTaskResponse>('command/creation/loggerInfo', data, { showLoading: false }),
  createTraceCommand: (data: CommandCreateRequest<TraceRequest>) =>
    request.post<CommandCreateRequest<TraceRequest>, CommandTaskResponse>('command/creation/traceMethod', data, { showLoading: false }),
}
