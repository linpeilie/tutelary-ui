import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { Overview } from '@/proto/command/result/Overview';
import type { WebSocketStatusEnum } from '../ws/WebSocketStatusEnum';
import { EventBus } from './EventBus';
import { SystemMetricsResponse } from '@/proto/command/result/SystemMetricsResponse';
import { SystemInfoResponse } from '@/proto/command/result/SystemInfoResponse';
import { DecompileResponse } from '@/proto/command/result/DecompileResponse';

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
  'command:jvm-memory': CommandExecuteResponse<any>; // JVM 内存信息
  'command:system-info': CommandExecuteResponse<SystemInfoResponse>; // 系统信息
  'command:system-metrics': CommandExecuteResponse<SystemMetricsResponse>
  'command:vm-option': CommandExecuteResponse<any>; // VM 选项
  'command:vm-option-set': CommandExecuteResponse<any>; // 设置 VM 选项

  // 线程相关命令
  'command:thread-list': CommandExecuteResponse<any>; // 线程列表
  'command:thread-detail': CommandExecuteResponse<any>; // 线程详情

  // 日志相关命令
  'command:logger-info': CommandExecuteResponse<any>; // 日志信息
  'command:logger-level-update': CommandExecuteResponse<any>; // 更新日志级别

  // 文件相关命令
  'command:file-list': CommandExecuteResponse<any>; // 文件列表
  'command:file-download': CommandExecuteResponse<any>; // 文件下载

  // 诊断相关命令
  'command:heap-dump': CommandExecuteResponse<any>; // 堆转储
  'command:decompile': CommandExecuteResponse<DecompileResponse>; // 反编译
  'command:get-static': CommandExecuteResponse<any>; // 获取静态字段

  // 增强相关命令
  'command:enhance-affect': CommandExecuteResponse<any>; // 增强影响
  'command:enhance-complete': CommandExecuteResponse<any>; // 增强完成
  'command:trace': CommandExecuteResponse<any>; // 方法追踪
  'command:stack': CommandExecuteResponse<any>; // 方法调用栈
  'command:retransform': CommandExecuteResponse<any>; // 重置类

  // 概览命令
  'command:overview': CommandExecuteResponse<Overview>; // 概览

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
