import { EnumItem } from '@/utils/common/enum'

export const messageTypeEnum = Object.freeze({
  ERROR: EnumItem.of(0, 'Error'),
  CLIENT_COMMAND_RESPONSE: EnumItem.of(4, 'ClientCommandResponse'),
} as const)
