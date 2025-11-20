import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getToken } from '@/store/modules/auth/shared';
import { useWebSocket } from '@/composables/useWebSocket';
import type { IWebSocketBeanParam } from '@/utils/ws/websocket';
import type { WebSocketStatusEnum } from '@/utils/ws/WebSocketStatusEnum';
import eventBus from '@/utils/eventbus';
import type { Any } from '@/proto/Any';
import { SetupStoreId } from '@/enum';
import { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import { messageTypeEnum } from '@/enum/messageTypeEnums';
import commandCodec from '@/proto/codec/commandCodec';
import { ErrorMessage } from '@/proto/ErrorMessage';
import { getEventNameByCommandCode } from './command-router';

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
        console.debug('[WebSocket] 收到原始消息:', ev.data);
        // 处理二进制消息 (protobuf)
        handleBlobMessage(ev.data);
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
   * 分发命令响应消息到对应的事件总线
   * 使用命令路由配置实现解耦，避免大量 if-else 判断
   */
  function dispatchCommandResponseMessage(commandExecuteResponse: CommandExecuteResponse<Any>) {
    console.debug('[WebSocket] 解析 protobuf 消息:', commandExecuteResponse);

    const commandCode = commandExecuteResponse.code;

    // 首先触发通用的命令响应事件 (所有命令都会触发)
    eventBus.emit('command:response', commandExecuteResponse);

    // 根据命令码查找对应的事件名称
    const eventName = getEventNameByCommandCode(commandCode);

    if (eventName) {
      // 找到对应的事件，触发特定命令事件
      console.debug(`[WebSocket] 分发命令事件: ${eventName}, 命令码: ${commandCode}`);
      eventBus.emit(eventName, commandExecuteResponse);
    } else {
      // 未找到对应的事件配置，记录警告并触发兜底事件
      console.warn(`[WebSocket] 未找到命令码 ${commandCode} 对应的事件配置`);
      eventBus.emit('command:unknown', commandExecuteResponse);
    }
  }

  /**
   * 处理接收到的消息 (protobuf 格式)
   */
  function handleBlobMessage(_data: ArrayBuffer) {
    try {
      const uint8Array = new Uint8Array(_data);
      // cmd
      const cmd = uint8Array.at(0);

      if (cmd === messageTypeEnum.CLIENT_COMMAND_RESPONSE.value) {
        const commandExecuteResponse = CommandExecuteResponse.decode(uint8Array.slice(5));
        // status
        if (!commandExecuteResponse.status) {
          window.$message?.error(
            `task ${commandExecuteResponse.taskId} failed to execute, error message : ${commandExecuteResponse.message}`
          );
          return;
        }
        commandExecuteResponse.data = commandCodec.decode(
          commandExecuteResponse.code,
          commandExecuteResponse.data?.byteArray
        );
        if (!commandExecuteResponse.data) {
          window.$message?.error(`unknown command code : ${commandExecuteResponse.code}`);
          return;
        }
        dispatchCommandResponseMessage(commandExecuteResponse);
      } else if (cmd === messageTypeEnum.ERROR.value) {
        const errorMessage = ErrorMessage.decode(uint8Array.slice(5));
        window.$message?.error(errorMessage.message);
      } else {
        window.$message?.error(`unknown message type : ${cmd}`);
      }
    } catch (error) {
      console.error('[WebSocket] 解析消息失败:', error);
      window.$message?.error('消息解析失败');
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
