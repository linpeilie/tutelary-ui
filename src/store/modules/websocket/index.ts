import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useWebSocket } from '@/composables/useWebSocket';
import type { IWebSocketBeanParam } from '@/utils/ws/websocket';
import type { WebSocketStatusEnum } from '@/utils/ws/WebSocketStatusEnum';
import { SetupStoreId } from '@/enum';
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
      },

      onMessage: (ev: MessageEvent) => {
        console.log('[WebSocket] 收到消息:', ev.data);
        // 在这里处理接收到的消息
        handleMessage(ev.data);
      },

      onError: () => {
        console.error('[WebSocket] 连接异常');
        window.$message?.error('WebSocket 连接异常');
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
   * 处理接收到的消息
   */
  function handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      console.log('[WebSocket] 解析消息:', message);

      // 根据消息类型进行不同处理
      // 可以在这里实现消息路由逻辑
      switch (message.type) {
        case 'notification':
          // 处理通知消息
          window.$notification?.info({
            title: message.title || '通知',
            content: message.content,
            duration: 3000
          });
          break;
        case 'update':
          // 处理更新消息
          console.log('[WebSocket] 收到更新:', message.data);
          break;
        default:
          console.log('[WebSocket] 未知消息类型:', message.type);
      }
    } catch {
      // 如果不是 JSON 格式，直接处理原始数据
      console.log('[WebSocket] 收到非 JSON 消息:', data);
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
   * 发送消息
   */
  function sendMessage(data: any, resend = false) {
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
    closeConnection,
    dispose,
    reconnect
  };
});
