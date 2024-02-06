import { EnumItem } from '@/utils/common/enum'

export const commandEnum = Object.freeze({
  OVERVIEW: EnumItem.of(20010, 'Overview'),
  THREAD_LIST: EnumItem.of(20011, 'ThreadList'),
  THREAD_DETAIL: EnumItem.of(20012, 'ThreadDetail'),
  HEAP_DUMP: EnumItem.of(20013, 'HeapDump'),
  FILE_LIST: EnumItem.of(20014, 'FileList'),
  FILE_DOWNLOAD: EnumItem.of(20015, 'FileDownload'),
  DECOMPILE: EnumItem.of(20016, 'Decompile'),
  LOGGER_INFO: EnumItem.of(20017, 'LoggerInfo'),
  UPDATE_LOGGER_LEVEL: EnumItem.of(20018, 'UpdateLoggerLevel'),
  GET_STATIC: EnumItem.of(20019, 'GetStatic'),
  GET_VM_OPTION: EnumItem.of(20020, 'GetVmOption'),
  SET_VM_OPTION: EnumItem.of(20021, 'SetVmOption'),

  ENHANCE_AFFECT: EnumItem.of(21001, 'EnhanceAffect'),
  ENHANCE_COMPLETE: EnumItem.of(21002, 'EnhanceComplete'),
  TRACE_METHOD: EnumItem.of(21011, 'TraceMethod'),
  STACK_METHOD: EnumItem.of(21012, 'StackMethod'),
  RETRANSFORM: EnumItem.of(21013, 'Retransform'),

} as const)
