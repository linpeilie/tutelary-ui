import { EnumItem } from '@/utils/enum';

export const enableStatusEnum = Object.freeze({
  ENABLED: EnumItem.of(1, '启用', { type: 'info' }),
  DISABLED: EnumItem.of(0, '未启用', { type: 'error' })
} as const);
