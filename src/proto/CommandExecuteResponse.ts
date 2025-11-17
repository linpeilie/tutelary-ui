/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { Any } from './Any'
import { Metadata } from './Metadata'

export const protobufPackage = ''

export interface CommandExecuteResponse<T> {
  taskId: string
  code: number
  timestamp: number
  data: Any | undefined | T
  status: boolean
  message: string
  metadata: Metadata | undefined
}

function createBaseCommandExecuteResponse(): CommandExecuteResponse<any> {
  return { taskId: '', code: 0, timestamp: 0, data: undefined, status: false, message: '', metadata: undefined }
}

export const CommandExecuteResponse = {
  encode(message: CommandExecuteResponse<any>, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.taskId !== '')
      writer.uint32(10).string(message.taskId)

    if (message.code !== 0)
      writer.uint32(16).int32(message.code)

    if (message.timestamp !== 0)
      writer.uint32(24).int64(message.timestamp)

    if (message.data !== undefined)
      Any.encode(message.data, writer.uint32(34).fork()).ldelim()

    if (message.status === true)
      writer.uint32(40).bool(message.status)

    if (message.message !== '')
      writer.uint32(50).string(message.message)

    if (message.metadata !== undefined)
      Metadata.encode(message.metadata, writer.uint32(58).fork()).ldelim()

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CommandExecuteResponse<any> {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseCommandExecuteResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.taskId = reader.string()
          continue
        case 2:
          if (tag !== 16)
            break

          message.code = reader.int32()
          continue
        case 3:
          if (tag !== 24)
            break

          message.timestamp = longToNumber(reader.int64() as Long)
          continue
        case 4:
          if (tag !== 34)
            break

          message.data = Any.decode(reader, reader.uint32())
          continue
        case 5:
          if (tag !== 40)
            break

          message.status = reader.bool()
          continue
        case 6:
          if (tag !== 50)
            break

          message.message = reader.string()
          continue
        case 7:
          if (tag !== 58)
            break

          message.metadata = Metadata.decode(reader, reader.uint32())
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER))
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER')

  return long.toNumber()
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any
  _m0.configure()
}
