import { EnumItem } from '@/utils/common/enum'

export const threadStates = Object.freeze({
  NEW: EnumItem.of('NEW', 'NEW', { type: 'info' }),
  RUNNABLE: EnumItem.of('RUNNABLE', 'RUNNABLE', { type: 'success' }),
  BLOCKED: EnumItem.of('BLOCKED', 'BLOCKED', { type: 'error' }),
  WAITING: EnumItem.of('WAITING', 'WAITING', { type: 'warning' }),
  TIMED_WAITING: EnumItem.of('TIMED_WAITING', 'TIMED_WAITING', { type: 'warning' }),
  TERMINATED: EnumItem.of('TERMINATED', 'TERMINATED'),
} as const)
