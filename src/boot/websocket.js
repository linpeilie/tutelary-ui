import { boot } from 'quasar/wrappers'

import api from 'src/config/api.js'

import VueNativeSock from 'vue-native-websocket-vue3'

export default boot(({
  app,
  store
}) => {
  app.use(VueNativeSock, `${api.wsBaseUrl}`, {
    // 启用 Vuex 集成
    store,
    // 开启手动调用 connect() 连接服务器
    connectManually: false,
    // 开启自动重连
    reconnection: false,
    // 重连间隔时间
    reconnectionAttempts: 3000
  })
})
