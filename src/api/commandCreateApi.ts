import type { CommandCreateRequest, CommandTaskResponse, ThreadListRequest } from './types/commandCreateTypes'
import type { ThreadDetailRequest } from '@/proto/command/param/ThreadDetailRequest'
import { request } from '@/utils'

export default {
  createThreadListCommand: (data: CommandCreateRequest<ThreadListRequest>) =>
    request.post<CommandCreateRequest<ThreadListRequest>, CommandTaskResponse>('command/creation/threadList', data, { showLoading: false }),
  createThreadDetail: (data: CommandCreateRequest<ThreadDetailRequest>) =>
    request.post<CommandCreateRequest<ThreadDetailRequest>, CommandTaskResponse>('command/creation/threadDetail', data, { showLoading: false }),
}
