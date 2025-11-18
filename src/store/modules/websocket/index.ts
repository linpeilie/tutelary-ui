import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useWebSocket } from '@/composables/useWebSocket';
import type { IWebSocketBeanParam } from '@/utils/ws/websocket';
import type { WebSocketStatusEnum } from '@/utils/ws/WebSocketStatusEnum';
import eventBus from '@/utils/eventbus';
import type { Any } from '@/proto/Any';
import { SetupStoreId } from '@/enum';
import { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import { getToken } from '../auth/shared';

/**
 * 获取 WebSocket 连接地址
 */
function getWsUrl() {
  const loc = window.location;
  let wsUrl;
  if (loc.protocol === 'https:') {
    wsUrl = 'wss:';
  } else {
    wsUrl = 'ws:';
  }

  return (wsUrl += `//${loc.host}/api/ws?_tt=${getToken()}`);
}

export const useWebSocketStore = defineStore(SetupStoreId.WebSocket, () => {
  // WebSocket 连接实例
  const wsInstance = ref<ReturnType<typeof useWebSocket> | null>(null);

  // 连接状态
  const connectionStatus = ref<WebSocketStatusEnum | null>(null);

  // 是否已初始化
  const isInitialized = ref(false);

  /**
   * 初始化 WebSocket 连接
   */
  function initWebSocket() {
    if (isInitialized.value) {
      return;
    }

    const token = getToken();
    if (!token) {
      console.warn('[WebSocket] 未找到 token，跳过连接');
      return;
    }

    const wsUrl = getWsUrl();

    const wsParams: IWebSocketBeanParam = {
      url: wsUrl,
      needReconnect: true,
      reconnectMaxNum: 5, // 最大重连 5 次
      reconnectGapTime: 3000, // 重连间隔 3 秒
      heartGapTime: 30000, // 心跳间隔 30 秒
      heartSend: 'ping',
      heartGet: 'pong',
      heartFailNum: 3, // 心跳失败 3 次则触发重连

      onOpen: async () => {
        console.log('[WebSocket] 连接成功');
        window.$message?.success('WebSocket 连接成功');
        // 触发连接成功事件
        eventBus.emit('ws:connected', undefined);
      },

      onMessage: (ev: MessageEvent) => {
        console.log('[WebSocket] 收到原始消息:', ev.data);
        // 处理二进制消息 (protobuf)
        handleMessage(ev.data);
      },

      onError: () => {
        console.error('[WebSocket] 连接异常');
        window.$message?.error('WebSocket 连接异常');
        // 触发错误事件
        eventBus.emit('ws:error', new Error('WebSocket 连接异常'));
      },

      onReconnect: () => {
        console.log('[WebSocket] 尝试重连...');
        window.$message?.warning('WebSocket 连接断开，正在重连...');
      },

      onFailReconnect: () => {
        console.error('[WebSocket] 重连失败');
        window.$message?.error('WebSocket 重连失败，请刷新页面');
      }
    };

    wsInstance.value = useWebSocket(wsParams);
    wsInstance.value.start();
    isInitialized.value = true;

    // 监听状态变化
    watchStatus();
  }

  /**
   * 处理接收到的消息 (protobuf 格式)
   */
  function handleMessage(data: ArrayBuffer | string) {
    try {
      // 兼容处理：如果是字符串类型，尝试 JSON 解析（心跳等场景）
      if (typeof data === 'string') {
        console.log('[WebSocket] 收到文本消息:', data);
        return;
      }

      // 解析 protobuf 二进制数据
      const uint8Array = new Uint8Array(data as ArrayBuffer);
      const response = CommandExecuteResponse.decode(uint8Array);

      console.log('[WebSocket] 解析 protobuf 消息:', {
        taskId: response.taskId,
        code: response.code,
        status: response.status,
        message: response.message,
        timestamp: response.timestamp,
        metadata: response.metadata
      });

      // 触发通用消息事件
      eventBus.emit('ws:message', response);

      // 处理响应码
      if (!response.status) {
        window.$message?.error(response.message || '操作失败');
        return;
      }

      // 根据业务需要解码 data 字段
      // response.data 是 Any 类型，需要根据实际类型进行二次解码
      if (response.data) {
        handleResponseData(response);
      }
    } catch (error) {
      console.error('[WebSocket] 解析消息失败:', error);
      window.$message?.error('消息解析失败');
    }
  }

  /**
   * 处理响应数据 (根据类型解码 Any)
   */
  function handleResponseData(response: CommandExecuteResponse<Any>) {
    try {
      console.log('[WebSocket] 收到数据响应:', response.data);

      // 根据 taskId 前缀判断命令类型并触发对应事件
      const taskId = response.taskId || '';

      if (taskId.startsWith('jvm-memory')) {
        eventBus.emit('command:jvm-memory', response);
      } else if (taskId.startsWith('thread-list')) {
        eventBus.emit('command:thread-list', response);
      } else if (taskId.startsWith('thread-detail')) {
        eventBus.emit('command:thread-detail', response);
      } else if (taskId.startsWith('logger-info')) {
        eventBus.emit('command:logger-info', response);
      } else if (taskId.startsWith('vm-option')) {
        eventBus.emit('command:vm-option', response);
      } else if (taskId.startsWith('heap-dump')) {
        eventBus.emit('command:heap-dump', response);
      } else if (taskId.startsWith('trace')) {
        eventBus.emit('command:trace', response);
      } else if (taskId.startsWith('decompile')) {
        eventBus.emit('command:decompile', response);
      } else if (taskId.startsWith('file-list')) {
        eventBus.emit('command:file-list', response);
      } else {
        eventBus.emit('command:other', response);
      }
    } catch (error) {
      console.error('[WebSocket] 解码数据失败:', error);
    }
  }

  /**
   * 监听 WebSocket 状态变化
   */
  function watchStatus() {
    if (!wsInstance.value) return undefined;

    // 使用 setInterval 定期检查状态
    const timer = setInterval(() => {
      if (wsInstance.value && wsInstance.value.status) {
        connectionStatus.value = wsInstance.value.status;
      }
    }, 1000);

    // 可以在组件销毁时清除定时器
    return () => clearInterval(timer);
  }

  /**
   * 发送消息 (protobuf 编码)
   * @param data 要发送的 protobuf 消息对象
   * @param encoder protobuf 编码器 (例如 CommandExecuteResponse.encode)
   * @param resend 是否重发
   */
  function sendMessage<T>(data: T, encoder: { encode: (message: T) => { finish: () => Uint8Array } }, resend = false) {
    if (!wsInstance.value) {
      console.warn('[WebSocket] 连接未初始化');
      return false;
    }

    try {
      // 编码为 protobuf 二进制
      const uint8Array = encoder.encode(data).finish();
      return wsInstance.value.send(uint8Array, resend);
    } catch (error) {
      console.error('[WebSocket] 编码消息失败:', error);
      return false;
    }
  }

  /**
   * 发送原始数据 (兼容心跳等场景)
   */
  function sendRaw(data: string | ArrayBufferLike | Blob | ArrayBufferView, resend = false) {
    if (!wsInstance.value) {
      console.warn('[WebSocket] 连接未初始化');
      return false;
    }

    return wsInstance.value.send(data, resend);
  }

  /**
   * 关闭连接
   */
  function closeConnection() {
    if (!wsInstance.value) {
      return;
    }

    wsInstance.value.close();
    isInitialized.value = false;
    connectionStatus.value = null;
    console.log('[WebSocket] 连接已关闭');

    // 触发断开连接事件
    eventBus.emit('ws:disconnected', undefined);
  }

  /**
   * 销毁 WebSocket 实例
   */
  function dispose() {
    if (!wsInstance.value) {
      return;
    }

    wsInstance.value.dispose();
    wsInstance.value = null;
    isInitialized.value = false;
    connectionStatus.value = null;
    console.log('[WebSocket] 已销毁');
  }

  /**
   * 重新连接
   */
  function reconnect() {
    dispose();
    initWebSocket();
  }

  return {
    wsInstance,
    connectionStatus,
    isInitialized,
    initWebSocket,
    sendMessage,
    sendRaw,
    closeConnection,
    dispose,
    reconnect
  };
});
