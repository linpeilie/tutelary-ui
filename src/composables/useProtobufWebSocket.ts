/**
 * Protobuf WebSocket 使用示例
 *
 * 此文件演示如何在业务代码中正确使用 protobuf 消息
 */

import { useWebSocketStore } from '@/store/modules/websocket';
import { getToken } from '@/store/modules/auth/shared';
import { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse';
import { ThreadListRequest } from '@/proto/command/param/ThreadListRequest';
import type { Metadata } from '@/proto/Metadata';

/**
 * 解码 CommandExecuteResponse 中的 Any 类型数据
 * @param response CommandExecuteResponse
 * @param decoder 具体类型的解码器
 */
function decodeResponseData<T>(
  response: CommandExecuteResponse<any>,
  decoder: { decode: (input: Uint8Array) => T }
): T | null {
  if (!response.data || !response.data.value) {
    return null;
  }

  try {
    return decoder.decode(response.data.value);
  } catch (error) {
    console.error('[Protobuf] 解码失败:', error);
    return null;
  }
}

/**
 * 发送获取 JVM 内存信息的请求示例
 */
export function sendJvmMemoryRequest() {
  const wsStore = useWebSocketStore();

  // 构造请求元数据
  const metadata: Metadata = {
    token: getToken() || ''
  };

  // 构造请求消息
  const request: CommandExecuteResponse<any> = {
    taskId: `jvm-memory-${Date.now()}`,
    code: 0,
    timestamp: Date.now(),
    data: undefined,
    status: true,
    message: 'Get JVM Memory',
    metadata
  };

  // 发送消息 (使用 protobuf 编码)
  wsStore.sendMessage(request, CommandExecuteResponse);

  console.log('[Protobuf] 已发送 JVM 内存请求:', request.taskId);
}

/**
 * 发送获取线程列表的请求示例
 */
export function sendThreadListRequest() {
  const wsStore = useWebSocketStore();

  // 构造线程列表请求参数
  const threadListReq: ThreadListRequest = {
    // ThreadListRequest 是空接口,无需参数
  };

  const metadata: Metadata = {
    token: getToken() || ''
  };

  // 将请求参数序列化为 Any 类型
  const requestData = ThreadListRequest.encode(threadListReq).finish();

  const request: CommandExecuteResponse<any> = {
    taskId: `thread-list-${Date.now()}`,
    code: 0,
    timestamp: Date.now(),
    data: {
      typeUrl: 'ThreadListRequest',
      value: requestData
    },
    status: true,
    message: 'Get Thread List',
    metadata
  };

  wsStore.sendMessage(request, CommandExecuteResponse);

  console.log('[Protobuf] 已发送线程列表请求:', request.taskId);
}

/**
 * 处理接收到的 JVM 内存响应示例
 */
export function handleJvmMemoryResponse(response: CommandExecuteResponse<any>) {
  // 解码 JVM 内存数据
  const jvmMemory = decodeResponseData(response, JvmMemoryResponse);

  if (!jvmMemory) {
    console.error('[Protobuf] JVM 内存数据为空');
    return;
  }

  console.log('[Protobuf] JVM 内存信息:', {
    heap: jvmMemory.heap,
    nonHeap: jvmMemory.nonHeap,
    memoryPools: jvmMemory.memoryPools,
    garbageCollectors: jvmMemory.garbageCollectors
  });

  // 在这里可以更新 Pinia store 或触发其他业务逻辑
  // 例如: useJvmStore().updateMemory(jvmMemory);
}

/**
 * 演示完整的请求-响应流程
 */
export function useProtobufWebSocket() {
  return {
    sendJvmMemoryRequest,
    sendThreadListRequest,
    handleJvmMemoryResponse,
    decodeResponseData
  };
}
