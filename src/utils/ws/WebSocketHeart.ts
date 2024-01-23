import type { IWebSocketBean, IWebSocketHeart } from './websocket'

/**
 * WebSocket 心跳机制
 */
export default class WebSocketHeart implements IWebSocketHeart {
  websocket: IWebSocketBean
  heartSend: string
  heartGet: string
  heartGapTime: number
  failNum: number = 0
  heartFailNum: number

  constructor(websocket: IWebSocketBean) {
    this.websocket = websocket
    this.heartSend = this.websocket.param.heartSend ?? 'heartbeat'
    this.heartGet = this.websocket.param.heartGet ?? 'heartbeat'
    this.heartGapTime = this.websocket.param.heartGapTime ?? 30000
    this.heartFailNum = this.websocket.param.heartFailNum ?? 10
  }

  timer: number = null as any

  start = () => {
    if (this.timer !== null)
      return

    this.failNum = 0
    this.timer = setInterval(() => {
      if (this.failNum >= this.heartFailNum) {
        this.stop()
        this.websocket.onError()
        return
      }
      this.websocket.send(this.heartSend)
      this.failNum++
    }, this.heartGapTime) as any
  }

  stop = () => {
    clearInterval(this.timer)
    this.timer = null as any
  }

  onMessage = (ev: any) => {
    const messagePrefix = this.websocket.param.messagePrefix ?? ''
    const messageSuffix = this.websocket.param.messageSuffix ?? ''
    const heartGetMessage = messagePrefix + this.heartGet + messageSuffix
    if (ev === heartGetMessage)
      this.failNum = 0
  }
}
