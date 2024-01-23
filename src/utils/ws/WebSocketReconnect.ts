import type { IWebSocketBean, IWebSocketReconnect } from './websocket'

/**
 * WebSocket 重连机制和重连重发数据机制
 */
export default class WebSocketReconnect implements IWebSocketReconnect {
  /**
   * 开启状态
   */
  status: boolean

  /**
   * WebSocket 对象
   */
  websocket: IWebSocketBean

  /**
   * 当前重连次数
   */
  num: number

  /**
   * 最大重连次数，默认无限次
   */
  reconnectMaxNum: number | undefined

  /**
   * 重连间隔时间
   */
  reconnectGapTime: number

  constructor(websocket: IWebSocketBean) {
    this.websocket = websocket
    this.status = websocket.param.needReconnect ?? false
    this.reconnectMaxNum = websocket.param.reconnectMaxNum
    this.reconnectGapTime = websocket.param.heartGapTime ?? 30000
  }

  timer: number = null as any

  /**
   * 开始尝试重连
   */
  start = () => {
    if (!this.status)
      return
    if (this.timer !== null)
      return
    this.num = 0
    if (this.websocket.param.onReconnect)
      this.websocket.param.onReconnect()
    this.timer = setInterval(() => {
      if (this.reconnectMaxNum && this.num >= this.reconnectMaxNum) {
        if (this.websocket.param.onFailReconnect)
          this.websocket.param.onFailReconnect()
        this.stop()
        return
      }
      this.websocket.start()
      this.num++
    }, this.reconnectGapTime) as any
  }

  /**
   * 关闭重连
   */
  stop = () => {
    if (!this.status)
      return
    clearInterval(this.timer)
    this.timer = null as any
  }
}
