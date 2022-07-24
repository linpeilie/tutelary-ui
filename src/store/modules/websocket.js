import { encode, decode } from 'boot/protobuf'

export default {
  state: {
    socketTarget: undefined,
    socket: {
      // 连接状态
      isConnected: false, // 消息内容
      message: '', // 重新连接错误
      reconnectError: false // 心跳消息发送时间
    }
  },
  mutations: {
    // 连接打开
    SOCKET_ONOPEN (state, event) {
      state.socket.isConnected = true
      state.socketTarget = event.currentTarget
    }, // 连接关闭
    SOCKET_ONCLOSE (state, event) {
      state.socket.isConnected = false
      // 连接关闭时停掉心跳消息
      console.log('连接已断开: ' + new Date())
      console.log(event)
    }, // 发生错误
    SOCKET_ONERROR (state, event) {
      console.error(state, event)
    }, // 收到服务端发送的消息
    SOCKET_ONMESSAGE (state, message) {
      const reader = new FileReader()
      reader.onload = () => {
        const data = decode(reader.result)
        console.log('=>(websocket.js:30) data', data)
      }
      reader.readAsArrayBuffer(message.data)
    }, // 自动重连
    SOCKET_RECONNECT (state, count) {
      console.info('消息系统重连中...', state, count)
    }, // 重连错误
    SOCKET_RECONNECT_ERROR (state) {
      state.socket.reconnectError = true
    }
  },
  actions: {
    sendMessage ({ state }, {
      cmd,
      message
    }) {
      const value = encode(cmd, message)
      console.log('state.socketTarget', state.socketTarget)
      state.socketTarget.send(value)
    }
  }
}
