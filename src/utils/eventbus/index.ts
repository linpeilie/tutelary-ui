import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
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

  // 命令相关事件（按 taskId 前缀分类）
  'command:jvm-memory': CommandExecuteResponse<any>; // JVM 内存响应
  'command:thread-list': CommandExecuteResponse<any>; // 线程列表响应
  'command:thread-detail': CommandExecuteResponse<any>; // 线程详情响应
  'command:logger-info': CommandExecuteResponse<any>; // Logger 信息响应
  'command:vm-option': CommandExecuteResponse<any>; // VM 选项响应
  'command:heap-dump': CommandExecuteResponse<any>; // Heap Dump 响应
  'command:trace': CommandExecuteResponse<any>; // Trace 响应
  'command:decompile': CommandExecuteResponse<any>; // 反编译响应
  'command:file-list': CommandExecuteResponse<any>; // 文件列表响应
  'command:other': CommandExecuteResponse<any>; // 其他命令响应
}

/**
 * 全局事件总线实例
 */
const eventBus = new EventBus<GlobalEvents>();

// 导出类型和实例
export { EventBus };
export default eventBus;
