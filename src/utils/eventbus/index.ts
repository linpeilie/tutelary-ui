import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { Overview } from '@/proto/command/result/Overview';
import type { SystemMetricsResponse } from '@/proto/command/result/SystemMetricsResponse';
import type { SystemInfoResponse } from '@/proto/command/result/SystemInfoResponse';
import type { DecompileResponse } from '@/proto/command/result/DecompileResponse';
import type { EnhanceAffect } from '@/proto/command/result/EnhanceAffect';
import type { EnhanceCommandComplete } from '@/proto/command/result/EnhanceCommandComplete';
import type { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse';
import type { LoggerInfoResponse } from '@/proto/command/result/LoggerInfoResponse';
import type { SetVmOptionResponse } from '@/proto/command/result/SetVmOptionResponse';
import type { StackResponse } from '@/proto/command/result/StackResponse';
import type { TraceResponse } from '@/proto/command/result/TraceResponse';
import type { UpdateLoggerLevelResponse } from '@/proto/command/result/UpdateLoggerLevelResponse';
import type { VmOptionResponse } from '@/proto/command/result/VmOptionResponse';
import type { SearchClassResponse } from '@/proto/command/result/SearchClassResponse';
import type { SearchMethodResponse } from '@/proto/command/result/SearchMethodResponse';
import type { ClassLoaderTreeResponse } from '@/proto/command/result/ClassLoaderTreeResponse';
import type { OgnlResponse } from '@/proto/command/result/OgnlResponse';
import type { WatchResponse } from '@/proto/command/result/WatchResponse';
import type { MonitorResponse } from '@/proto/command/result/MonitorResponse';
import type { TimeTunnelResponse } from '@/proto/command/result/TimeTunnelResponse';
import type { ProfilerStartResponse } from '@/proto/command/result/ProfilerStartResponse';
import type { ProfilerStopResponse } from '@/proto/command/result/ProfilerStopResponse';
import type { JfrStartResponse } from '@/proto/command/result/JfrStartResponse';
import type { JfrStopResponse } from '@/proto/command/result/JfrStopResponse';
import type { RetransformHistoryResponse } from '@/proto/command/result/RetransformHistoryResponse';
import type { RetransformDetailResponse } from '@/proto/command/result/RetransformDetailResponse';
import type { WebSocketStatusEnum } from '../ws/WebSocketStatusEnum';
import { EventBus } from './EventBus';

/**
 * 全局事件总线事件类型定义
 */
export interface GlobalEvents {
  // WebSocket 相关事件
  'ws:connected': undefined; // WebSocket 连接成功
  'ws:disconnected': undefined; // WebSocket 断开连接
  'ws:error': Error; // WebSocket 错误
  'ws:reconnecting': number; // WebSocket 重连中（重连次数）
  'ws:status-change': WebSocketStatusEnum; // WebSocket 状态变化
  'ws:message': CommandExecuteResponse<any>; // WebSocket 收到消息

  // 通用命令响应事件
  'command:response': CommandExecuteResponse<any>; // 所有命令都会触发
  'command:unknown': CommandExecuteResponse<any>; // 未知命令码

  // 系统信息类命令
  'command:jvm-memory': CommandExecuteResponse<JvmMemoryResponse>; // JVM 内存信息
  'command:system-info': CommandExecuteResponse<SystemInfoResponse>; // 系统信息
  'command:system-metrics': CommandExecuteResponse<SystemMetricsResponse>;
  'command:vm-option': CommandExecuteResponse<VmOptionResponse>; // VM 选项
  'command:vm-option-set': CommandExecuteResponse<SetVmOptionResponse>; // 设置 VM 选项

  // 线程相关命令
  'command:thread-list': CommandExecuteResponse<any>; // 线程列表
  'command:thread-detail': CommandExecuteResponse<any>; // 线程详情

  // 日志相关命令
  'command:logger-info': CommandExecuteResponse<LoggerInfoResponse>; // 日志信息
  'command:logger-level-update': CommandExecuteResponse<UpdateLoggerLevelResponse>; // 更新日志级别

  // 文件相关命令
  'command:file-list': CommandExecuteResponse<any>; // 文件列表
  'command:file-download': CommandExecuteResponse<any>; // 文件下载

  // 诊断相关命令
  'command:heap-dump': CommandExecuteResponse<any>; // 堆转储
  'command:decompile': CommandExecuteResponse<DecompileResponse>; // 反编译
  'command:get-static': CommandExecuteResponse<any>; // 获取静态字段

  // 增强相关命令
  'command:enhance-affect': CommandExecuteResponse<EnhanceAffect>; // 增强影响
  'command:enhance-complete': CommandExecuteResponse<EnhanceCommandComplete>; // 增强完成
  'command:trace': CommandExecuteResponse<TraceResponse>; // 方法追踪
  'command:stack': CommandExecuteResponse<StackResponse>; // 方法调用栈
  'command:retransform': CommandExecuteResponse<any>; // 重置类
  'command:retransform-history': CommandExecuteResponse<RetransformHistoryResponse>; // 热更新历史
  'command:retransform-detail': CommandExecuteResponse<RetransformDetailResponse>; // 热更新类详情

  // 概览命令
  'command:overview': CommandExecuteResponse<Overview>; // 概览

  // ClassExplorer 命令
  'command:search-class': CommandExecuteResponse<SearchClassResponse>; // 搜索类
  'command:search-method': CommandExecuteResponse<SearchMethodResponse>; // 搜索方法
  'command:class-loader-tree': CommandExecuteResponse<ClassLoaderTreeResponse>; // 类加载器树

  // OGNL 命令
  'command:ognl': CommandExecuteResponse<OgnlResponse>; // OGNL 表达式

  // Watch/Monitor/TimeTunnel 命令
  'command:watch': CommandExecuteResponse<WatchResponse>; // 方法观察
  'command:monitor': CommandExecuteResponse<MonitorResponse>; // 方法监控
  'command:time-tunnel': CommandExecuteResponse<TimeTunnelResponse>; // 时空隧道

  // Profiler 命令
  'command:profiler-start': CommandExecuteResponse<ProfilerStartResponse>; // 启动性能分析
  'command:profiler-stop': CommandExecuteResponse<ProfilerStopResponse>; // 停止性能分析

  // JFR 命令
  'command:jfr-start': CommandExecuteResponse<JfrStartResponse>; // 启动JFR录制
  'command:jfr-stop': CommandExecuteResponse<JfrStopResponse>; // 停止JFR录制

  // 兼容旧的事件
  'command:other': CommandExecuteResponse<any>; // 其他命令响应
}

/**
 * 全局事件总线实例
 */
const eventBus = new EventBus<GlobalEvents>();

// 导出类型和实例
export { EventBus };
export default eventBus;
