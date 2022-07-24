import { boot } from 'quasar/wrappers'

import protobuf from 'protobufjs'
import { PATH_PREF, CMD_PROTO } from 'src/proto/proto'
import { ref } from 'vue'

const PROTOCOL_TAB = ref({})

for (const ele of CMD_PROTO) {
  const cmd = ele.cmd
  const proto = ele.proto
  if (!proto) {
    continue
  }
  protobuf.load(PATH_PREF + proto + '.proto', (err, root) => {
    if (err) {
      console.log('protobuf load err', err)
      throw err
    }
    const messageCodec = root.lookupType(proto)
    if (!messageCodec) {
      console.log('找不到.proto文件', proto)
      throw new Error('找不到对应的.proto文件 : ' + proto)
    }
    PROTOCOL_TAB[cmd] = messageCodec
  })
}

const decode = (message) => {
  const dataView = new DataView(message)
  const cmd = dataView.getUint8(0)
  const dataLength = dataView.getUint32(1)
  const body = dataView.buffer.slice(5, dataLength + 5)
  const codec = PROTOCOL_TAB[cmd]
  if (!codec) {
    console.warn(`没有找到对应的解码器, cmd : ${cmd}`)
    return
  }
  const result = codec.decode(new Uint8Array(body))
  result.cmd = cmd
  return result
}

const encode = (cmd, message) => {
  const codec = PROTOCOL_TAB[cmd]
  if (!codec) {
    console.warn(`没有找到对应的解码器, cmd : ${cmd}`)
    return
  }
  const msg = codec.create(message)
  const bytes = codec.encode(msg).finish()
  const byteLength = bytes.byteLength
  const buffer = new ArrayBuffer(byteLength + 5)
  const view = new DataView(buffer)
  view.setUint8(0, cmd)
  view.setUint32(1, byteLength)
  for (let i = 0; i < byteLength; i++) {
    view.setUint8(i + 5, bytes[i])
  }
  return view.buffer
}

export default boot(({ app }) => {
  app.config.globalProperties.$protobufDecode = decode
  app.config.globalProperties.$protobufEncode = encode
})

export {
  encode,
  decode
}
