import { boot } from 'quasar/wrappers'

import protobuf from 'protobufjs'
import { PATH_PREF, COMMAND_REQUEST_CMD, COMMAND_RESPONSE_CMD, CMD_PROTO } from 'src/proto/proto'
import { COMMAND_PATH_PREF, COMMAND_PROTO } from 'src/proto/commandProto'
import { ref } from 'vue'

const PROTOCOL_TAB = ref({})
const COMMAND_REQ_PROTOCOL_TAB = ref({})
const COMMNND_RES_PROTOCOL_TAB = ref({})

const getCommandKey = (commandType, command) => {
  return commandType + '#' + command
}

for (const ele of CMD_PROTO) {
  const cmd = ele.cmd
  const proto = ele.proto
  if (!proto) {
    continue
  }
  protobuf.load(PATH_PREF + proto + '.proto', (err, root) => {
    if (err) {
      console.error('protobuf load err', err)
      throw err
    }
    const messageCodec = root.lookupType(proto)
    if (!messageCodec) {
      console.error('找不到.proto文件', proto)
      throw new Error('找不到对应的.proto文件 : ' + proto)
    }
    PROTOCOL_TAB[cmd] = messageCodec
  })
}

for (const ele of COMMAND_PROTO) {
  const type = ele.type
  const command = ele.command
  const paramProto = ele.param
  const resultProto = ele.result
  if (paramProto) {
    protobuf.load(COMMAND_PATH_PREF + paramProto + '.proto', (err, root) => {
      if (err) {
        console.error('protobuf load err', err)
        throw err
      }
      const messageCodec = root.lookupType(paramProto)
      if (!messageCodec) {
        console.error('找不到.proto文件', paramProto)
        throw new Error('找不到对应的.proto文件 : ' + paramProto)
      }
      const commandKey = getCommandKey(type, command)
      COMMAND_REQ_PROTOCOL_TAB[commandKey] = messageCodec
    })
  }
  if (resultProto) {
    protobuf.load(COMMAND_PATH_PREF + resultProto + '.proto', (err, root) => {
      if (err) {
        console.error('protobuf load err', err)
        throw err
      }
      const messageCodec = root.lookupType(resultProto)
      if (!messageCodec) {
        console.error('找不到.proto文件', resultProto)
        throw new Error('找不到对应的.proto文件 : ' + resultProto)
      }
      const commandKey = getCommandKey(type, command)
      COMMNND_RES_PROTOCOL_TAB[commandKey] = messageCodec
    })
  }
}

const handleCommandResponse = (result) => {
  if (result.status) {
    debugger
    const commandKey = getCommandKey(result.commandType, result.commandCode)
    const codec = COMMNND_RES_PROTOCOL_TAB[commandKey]
    if (!codec) {
      result.status = false
      result.message = `no match proto codec , command type : ${result.commandType}, command : ${result.command}, discard the data`
      result.data = null
    }
    if (result.data && result.data.byteArray) {
      const data = codec.decode(result.data.byteArray)
      result.data = data
    }
  }
}

const encodeCommandParam = (commandType, command, param) => {
  const commandKey = getCommandKey(commandType, command)
  const codec = COMMAND_REQ_PROTOCOL_TAB[commandKey]
  if (!codec) {
    throw new Error(`找不到 ${commandType} - ${command} 对应的 proto 文件`)
  }
  codec.create(param)
  return codec.encode(param).finish()
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
  if (result.cmd === COMMAND_RESPONSE_CMD) {
    handleCommandResponse(result)
  }
  return result
}

const encode = (cmd, message) => {
  const codec = PROTOCOL_TAB[cmd]
  if (!codec) {
    console.warn(`没有找到对应的解码器, cmd : ${cmd}`)
    return
  }
  debugger
  const msg = codec.create(message)
  if (cmd === COMMAND_REQUEST_CMD) {
    msg.param = {
      byteArray: encodeCommandParam(message.commandType, message.commandCode, message.param)
    }
  }
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
