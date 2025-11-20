import { EnumItem } from '@/utils/enum';

export const commandEnum = Object.freeze({
  OVERVIEW: EnumItem.of(200010, 'Overview'),
  THREAD_LIST: EnumItem.of(200011, 'ThreadList'),
  THREAD_DETAIL: EnumItem.of(200012, 'ThreadDetail'),
  HEAP_DUMP: EnumItem.of(200013, 'HeapDump'),
  FILE_LIST: EnumItem.of(200014, 'FileList'),
  FILE_DOWNLOAD: EnumItem.of(200015, 'FileDownload'),
  DECOMPILE: EnumItem.of(200016, 'Decompile'),
  LOGGER_INFO: EnumItem.of(200017, 'LoggerInfo'),
  UPDATE_LOGGER_LEVEL: EnumItem.of(200018, 'UpdateLoggerLevel'),
  GET_STATIC: EnumItem.of(200019, 'GetStatic'),
  GET_VM_OPTION: EnumItem.of(200020, 'GetVmOption'),
  SET_VM_OPTION: EnumItem.of(200021, 'SetVmOption'),
  JVM_MEMORY: EnumItem.of(200022, 'JvmMemory'),
  SYSTEM_INFO: EnumItem.of(200023, 'System Info'),

  ENHANCE_AFFECT: EnumItem.of(210001, 'EnhanceAffect'),
  ENHANCE_COMPLETE: EnumItem.of(210002, 'EnhanceComplete'),
  TRACE_METHOD: EnumItem.of(210011, 'TraceMethod'),
  STACK_METHOD: EnumItem.of(210012, 'StackMethod'),
  RETRANSFORM: EnumItem.of(210013, 'Retransform')
} as const);
