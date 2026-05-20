import { onUnmounted, ref } from 'vue';
import {
  bindBrowserInstanceSession,
  issueBrowserInstanceSession
} from '@/service/api/browser-session';
import eventBus from '@/utils/eventbus';
import {
  getStoredInstanceCommandSessionId,
  setStoredInstanceCommandSessionId
} from '@/utils/instance-command-session';
import { useWebSocketStore } from '@/store/modules/websocket';

function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function useInstanceCommandSession(instanceId: string) {
  const sessionId = ref('');
  const ready = ref(false);
  const bound = ref(false);
  const webSocketStore = useWebSocketStore();

  async function bind(retry = 10) {
    if (!sessionId.value) return false;

    for (let index = 0; index < retry; index += 1) {
      const response = await bindBrowserInstanceSession({
        instanceId,
        sessionId: sessionId.value
      });

      if (response.data?.bound) {
        bound.value = true;
        ready.value = true;
        return true;
      }

      await wait(300);
    }

    bound.value = false;
    return false;
  }

  async function init() {
    webSocketStore.initWebSocket();

    const preferredSessionId = getStoredInstanceCommandSessionId(instanceId);
    const response = await issueBrowserInstanceSession({
      instanceId,
      sessionId: preferredSessionId
    });

    if (!response.data?.sessionId) {
      ready.value = false;
      return;
    }

    sessionId.value = response.data.sessionId;
    setStoredInstanceCommandSessionId(instanceId, sessionId.value);
    ready.value = await bind();
  }

  function handleWsConnected() {
    bind();
  }

  eventBus.on('ws:connected', handleWsConnected);

  onUnmounted(() => {
    eventBus.off('ws:connected', handleWsConnected);
  });

  return {
    sessionId,
    ready,
    bound,
    init,
    bind
  };
}
