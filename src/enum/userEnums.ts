import { EnumItem } from '@/utils/common/enum'

export const userStateEnum = Object.freeze({
  AVAILABLE: EnumItem.of('00', '正常', { type: 'info' }),
  DISABLED: EnumItem.of('10', '禁用', { type: 'error' }),
} as const)
