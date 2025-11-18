/**
 * EventBus 使用示例 Composable
 *
 * 演示如何在 Vue 组件中正确使用 EventBus
 */

import { onMounted, onUnmounted } from 'vue';
import eventBus from '@/utils/eventbus';
import type { GlobalEvents } from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';

/**
 * 监听 WebSocket 连接状态
 */
export function useWebSocketStatus() {
  const handleConnected = () => {
    console.log('[EventBus] WebSocket 已连接');
    window.$message?.success('连接成功');
  };

  const handleDisconnected = () => {
    console.log('[EventBus] WebSocket 已断开');
    window.$message?.warning('连接断开');
  };

  const handleError = (error: Error) => {
    console.error('[EventBus] WebSocket 错误:', error);
    window.$message?.error(`连接错误: ${error.message}`);
  };

  onMounted(() => {
    // 订阅事件
    eventBus.on('ws:connected', handleConnected);
    eventBus.on('ws:disconnected', handleDisconnected);
    eventBus.on('ws:error', handleError);
  });

  onUnmounted(() => {
    // 取消订阅（防止内存泄漏）
    eventBus.off('ws:connected', handleConnected);
    eventBus.off('ws:disconnected', handleDisconnected);
    eventBus.off('ws:error', handleError);
  });
}

/**
 * 监听 JVM 内存信息更新
 * @param callback 回调函数
 */
export function useJvmMemory(callback: (response: CommandExecuteResponse<any>) => void) {
  onMounted(() => {
    eventBus.on('command:jvm-memory', callback);
  });

  onUnmounted(() => {
    eventBus.off('command:jvm-memory', callback);
  });
}

/**
 * 监听线程列表更新
 * @param callback 回调函数
 */
export function useThreadList(callback: (response: CommandExecuteResponse<any>) => void) {
  onMounted(() => {
    eventBus.on('command:thread-list', callback);
  });

  onUnmounted(() => {
    eventBus.off('command:thread-list', callback);
  });
}

/**
 * 一次性监听某个命令响应
 * @param eventName 事件名
 * @param callback 回调函数
 */
export function useCommandOnce<K extends keyof GlobalEvents>(eventName: K, callback: (data: GlobalEvents[K]) => void) {
  onMounted(() => {
    // 使用 once 方法，只监听一次
    eventBus.once(eventName, callback);
  });

  // 注意：once 会自动取消订阅，不需要在 onUnmounted 中手动取消
}

/**
 * 通用事件监听 Hook
 * @param eventName 事件名
 * @param callback 回调函数
 * @param options 选项
 */
export function useEventListener<K extends keyof GlobalEvents>(
  eventName: K,
  callback: (data: GlobalEvents[K]) => void,
  options: { once?: boolean } = {}
) {
  onMounted(() => {
    if (options.once) {
      eventBus.once(eventName, callback);
    } else {
      eventBus.on(eventName, callback);
    }
  });

  onUnmounted(() => {
    // once 监听器会自动清除，这里只清除普通监听器
    if (!options.once) {
      eventBus.off(eventName, callback);
    }
  });

  return {
    // 手动取消订阅
    unsubscribe: () => eventBus.off(eventName, callback)
  };
}

/**
 * 监听所有 WebSocket 消息
 * @param callback 回调函数
 */
export function useWebSocketMessages(callback: (response: CommandExecuteResponse<any>) => void) {
  onMounted(() => {
    eventBus.on('ws:message', callback);
  });

  onUnmounted(() => {
    eventBus.off('ws:message', callback);
  });
}
