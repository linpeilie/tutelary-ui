import type { IWebSocketBean, IWebSocketBeanParam } from './websocket'

import WebSocketHeart from './WebSocketHeart'
import WebSocketReconnect from './WebSocketReconnect'
import WebSocketSend from './WebSocketSend'

import { WebSocketStatusEnum } from './WebSocketStatusEnum'

export default class WebSocketBean implements IWebSocketBean {
  /**
   * 连接状态
   */
  status: WebSocketStatusEnum = null as any

  /**
   * WebSocket 对象
   */
  websocket: WebSocket = null as any

  /**
   * 心跳对象
   */
  heart: WebSocketHeart = null as any

  /**
   * 重连对象
   */
  reconnect: WebSocketReconnect = null as any

  /**
   * 发送对象
   */
  sendObj: WebSocketSend = null as any

  /**
   * 参数信息
   */
  param: IWebSocketBeanParam

  constructor(param: IWebSocketBeanParam) {
    this.param = param
  }

  onOpen = async () => {
    // 开启心跳
    this.heart.start()

    // 通知连接成功或重连成功
    this.reconnect.stop()

    // 调用生命周期
    if (this.param.onOpen)
      await this.param.onOpen()

    // 修改状态为已连接
    this.status = WebSocketStatusEnum.connected

    // 通知发送消息
    this.sendObj.onOpen()
  }

  onMessage = (ev: MessageEvent<any>) => {
    // 调用生命周期
    if (this.param.onMessage)
      this.param.onMessage(ev)

    this.heart.onMessage(ev.data)
  }

  onError = () => {
    // 调用生命周期
    if (this.param.onError)
      this.param.onError()
    // 销毁对象
    this.close()
    // 开始重连
    this.reconnect.start()
  }

  /**
   * 创建新连接（如果有旧连接的话先关闭）
   * @param param
   * @returns
   */
  start = (param?: IWebSocketBeanParam) => {
    // 如果已经创建需要先关闭
    this.close()

    // 使用新配置或者老配置
    if (param)
      this.param = param
    else param = this.param

    // 创建连接
    this.websocket = new WebSocket(param.url)

    // 修改状态为加载中
    this.status = WebSocketStatusEnum.open

    // 绑定连接成功事件
    this.websocket.onopen = this.onOpen
    // 绑定消息接收事件
    this.websocket.onmessage = this.onMessage
    // 绑定连接异常事件
    this.websocket.onerror = this.onError
    // 绑定连接关闭时间
    this.websocket.onclose = this.onError

    // 创建心跳
    this.heart = new WebSocketHeart(this)

    // 创建重连，如果存在则跳过
    if (this.reconnect === null)
      this.reconnect = new WebSocketReconnect(this)

    // 创建发送数据管理，如果存在则跳过
    if (this.sendObj === null)
      this.sendObj = new WebSocketSend(this)

    // 监听窗口关闭事件，当窗口关闭时，主动去关闭 websocket 连接，防止连接还没断开就关闭窗口，server端会抛出异常
    window.addEventListener('beforeunload', this.dispose)
  }

  /**
   * 发送数据
   * @param data  数据对象
   * @param resend 是否需要在重新连上以后再次发送该数据
   */
  send(data: any, resend?: boolean) {
    return this.sendObj?.send(data, resend)
  }

  /**
   * 销毁需要重发的数据信息
   * @param sendId
   * @returns
   */
  offsend = (sendId: string) => {
    this.sendObj?.offsend(sendId)
  }

  /**
   * 关闭 socket，销毁绑定事件、心跳事件、窗口关闭事件，修改状态为已关闭
   */
  close = () => {
    if (this.websocket === null)
      return
    window.removeEventListener('beforeunload', this.dispose)
    // 销毁绑定事件，关闭 socket
    if (this.websocket) {
      this.websocket.onerror = null
      this.websocket.onmessage = null
      this.websocket.onclose = null
      this.websocket.onopen = null
      this.websocket.close()
      this.websocket = null as any
    }

    // 销毁心跳事件
    if (this.heart) {
      this.heart.stop()
      this.heart = null as any
    }

    // 修改状态为已关闭
    this.status = WebSocketStatusEnum.close
  }

  /**
   * 销毁所有对象
   */
  dispose = () => {
    this.close()
    if (this.reconnect) {
      this.reconnect.stop()
      this.reconnect = null as any
    }
    if (this.sendObj) {
      this.sendObj.clear()
      this.sendObj = null as any
    }
  }
}
