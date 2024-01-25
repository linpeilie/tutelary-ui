import type { CommandCreateRequest, CommandTaskResponse, ThreadListRequest } from './types/commandCreateTypes'
import { request } from '@/utils'

export default {
  createThreadListCommand: (data: CommandCreateRequest<ThreadListRequest>) => request.post<CommandCreateRequest<ThreadListRequest>, CommandTaskResponse>('command/creation/threadList', data),
}
