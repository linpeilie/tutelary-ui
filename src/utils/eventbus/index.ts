import { EventBus } from './EventBus'

import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse'

export default new EventBus<{
  command: CommandExecuteResponse<any>
}>()
