/**
 * WebSocket 命令路由配置
 * 将命令码映射到对应的事件名称，实现命令分发的解耦
 */

import type { GlobalEvents } from '@/utils/eventbus';
import { commandEnum } from '@/enum/commandEnums';

type GlobalEventKey = keyof GlobalEvents;

/**
 * 命令事件映射类型
 */
export interface CommandEventMapping {
  /** 命令码 */
  code: number;
  /** 事件名称 */
  eventName: GlobalEventKey;
  /** 命令描述 (可选，用于调试) */
  description?: string;
}

/**
 * 命令路由配置表
 * 每个命令码对应一个事件名称
 */
export const commandRouterConfig: CommandEventMapping[] = [
  // 系统信息类命令
  {
    code: commandEnum.JVM_MEMORY.value as number,
    eventName: 'command:jvm-memory',
    description: 'JVM 内存信息'
  },
  {
    code: commandEnum.SYSTEM_INFO.value as number,
    eventName: 'command:system-info',
    description: '系统信息'
  },
  {
    code: commandEnum.SYSTEM_METRICS.value as number,
    eventName: 'command:system-metrics',
    description: '系统指标监控'
  },
  {
    code: commandEnum.GET_VM_OPTION.value as number,
    eventName: 'command:vm-option',
    description: 'VM 选项'
  },
  {
    code: commandEnum.SET_VM_OPTION.value as number,
    eventName: 'command:vm-option-set',
    description: '设置 VM 选项'
  },

  // 线程相关命令
  {
    code: commandEnum.THREAD_LIST.value as number,
    eventName: 'command:thread-list',
    description: '线程列表'
  },
  {
    code: commandEnum.THREAD_DETAIL.value as number,
    eventName: 'command:thread-detail',
    description: '线程详情'
  },

  // 日志相关命令
  {
    code: commandEnum.LOGGER_INFO.value as number,
    eventName: 'command:logger-info',
    description: '日志信息'
  },
  {
    code: commandEnum.UPDATE_LOGGER_LEVEL.value as number,
    eventName: 'command:logger-level-update',
    description: '更新日志级别'
  },

  // 文件相关命令
  {
    code: commandEnum.FILE_LIST.value as number,
    eventName: 'command:file-list',
    description: '文件列表'
  },
  {
    code: commandEnum.FILE_DOWNLOAD.value as number,
    eventName: 'command:file-download',
    description: '文件下载'
  },

  // 诊断相关命令
  {
    code: commandEnum.HEAP_DUMP.value as number,
    eventName: 'command:heap-dump',
    description: '堆转储'
  },
  {
    code: commandEnum.DECOMPILE.value as number,
    eventName: 'command:decompile',
    description: '反编译'
  },
  {
    code: commandEnum.GET_STATIC.value as number,
    eventName: 'command:get-static',
    description: '获取静态字段'
  },

  // 增强相关命令
  {
    code: commandEnum.ENHANCE_AFFECT.value as number,
    eventName: 'command:enhance-affect',
    description: '增强影响'
  },
  {
    code: commandEnum.ENHANCE_COMPLETE.value as number,
    eventName: 'command:enhance-complete',
    description: '增强完成'
  },
  {
    code: commandEnum.TRACE_METHOD.value as number,
    eventName: 'command:trace',
    description: '方法追踪'
  },
  {
    code: commandEnum.STACK_METHOD.value as number,
    eventName: 'command:stack',
    description: '方法调用栈'
  },
  {
    code: commandEnum.RETRANSFORM.value as number,
    eventName: 'command:retransform',
    description: '重置类'
  },
  {
    code: commandEnum.RETRANSFORM_HISTORY.value as number,
    eventName: 'command:retransform-history',
    description: '热更新历史'
  },
  {
    code: commandEnum.RETRANSFORM_DETAIL.value as number,
    eventName: 'command:retransform-detail',
    description: '热更新类详情'
  },

  // 概览命令
  {
    code: commandEnum.OVERVIEW.value as number,
    eventName: 'command:overview',
    description: '概览'
  },

  // ClassExplorer 命令
  {
    code: commandEnum.SEARCH_CLASS.value as number,
    eventName: 'command:search-class',
    description: '搜索类'
  },
  {
    code: commandEnum.SEARCH_METHOD.value as number,
    eventName: 'command:search-method',
    description: '搜索方法'
  },
  {
    code: commandEnum.CLASS_LOADER_TREE.value as number,
    eventName: 'command:class-loader-tree',
    description: '类加载器树'
  },

  // OGNL 命令
  {
    code: commandEnum.OGNL.value as number,
    eventName: 'command:ognl',
    description: 'OGNL 表达式执行'
  },

  // 增强类命令 (Watch/Monitor/TimeTunnel)
  {
    code: commandEnum.WATCH_METHOD.value as number,
    eventName: 'command:watch',
    description: '方法观察'
  },
  {
    code: commandEnum.MONITOR_METHOD.value as number,
    eventName: 'command:monitor',
    description: '方法监控'
  },
  {
    code: commandEnum.TIME_TUNNEL.value as number,
    eventName: 'command:time-tunnel',
    description: '时空隧道'
  },

  // Profiler 命令
  {
    code: commandEnum.PROFILER_START.value as number,
    eventName: 'command:profiler-start',
    description: '启动性能分析'
  },
  {
    code: commandEnum.PROFILER_STOP.value as number,
    eventName: 'command:profiler-stop',
    description: '停止性能分析'
  },

  // JFR 命令
  {
    code: commandEnum.JFR_START.value as number,
    eventName: 'command:jfr-start',
    description: '启动JFR录制'
  },
  {
    code: commandEnum.JFR_STOP.value as number,
    eventName: 'command:jfr-stop',
    description: '停止JFR录制'
  }
];

/**
 * 命令码到事件名称的映射 Map (用于快速查找)
 */
const commandEventMap = new Map<number, GlobalEventKey>(
  commandRouterConfig.map(config => [config.code, config.eventName])
);

/**
 * 根据命令码获取对应的事件名称
 * @param commandCode 命令码
 * @returns 事件名称，如果未找到则返回 undefined
 */
export function getEventNameByCommandCode(commandCode: number): GlobalEventKey | undefined {
  return commandEventMap.get(commandCode);
}

/**
 * 检查命令码是否已注册
 * @param commandCode 命令码
 * @returns 是否已注册
 */
export function isCommandRegistered(commandCode: number): boolean {
  return commandEventMap.has(commandCode);
}
