import { createEnum } from '@/utils/common/enum'

export const enableStatusEnum = createEnum([
  {
    label: '启用',
    value: 1,
  },
  {
    label: '未启用',
    value: 0,
  },
] as const)
