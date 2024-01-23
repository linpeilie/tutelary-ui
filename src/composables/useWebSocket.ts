import WebSocketBean from '@/utils/ws/WebSocketBean'
import type { IWebSocketBeanParam } from '@/utils/ws/websocket'

export function useWebSocket(param: IWebSocketBeanParam) {
  const ws = new WebSocketBean(param)

  const status = ws.status

  const start = ws.start

  const send = ws.send

  const close = ws.close

  const dispose = ws.dispose

  return {
    status,
    start,
    send,
    close,
    dispose,
  }
}
