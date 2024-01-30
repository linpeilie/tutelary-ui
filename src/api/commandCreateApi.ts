import type { CommandCreateRequest, CommandTaskResponse } from './types/commandCreateTypes'
import type { DecompileRequest } from '@/proto/command/param/DecompileRequest'
import type { ThreadDetailRequest } from '@/proto/command/param/ThreadDetailRequest'
import type { ThreadListRequest } from '@/proto/command/param/ThreadListRequest'
import type { VmOptionRequest } from '@/proto/command/param/VmOptionRequest'
import { request } from '@/utils'

export default {
  createThreadListCommand: (data: CommandCreateRequest<ThreadListRequest>) =>
    request.post<CommandCreateRequest<ThreadListRequest>, CommandTaskResponse>('command/creation/threadList', data, { showLoading: false }),
  createThreadDetail: (data: CommandCreateRequest<ThreadDetailRequest>) =>
    request.post<CommandCreateRequest<ThreadDetailRequest>, CommandTaskResponse>('command/creation/threadDetail', data, { showLoading: false }),
  createDecompile: (data: CommandCreateRequest<DecompileRequest>) =>
    request.post<CommandCreateRequest<DecompileRequest>, CommandTaskResponse>('command/creation/decompile', data, { showLoading: false }),
  createGetVmOption: (data: CommandCreateRequest<VmOptionRequest>) =>
    request.post<CommandCreateRequest<VmOptionRequest>, CommandTaskResponse>('command/creation/getVmOption', data, { showLoading: false }),
}
