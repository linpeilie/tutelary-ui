import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { StackTraceNode } from '../domain/StackTraceNode'

export const protobufPackage = ''

/**  */
export interface StackResponse {
  startTimestamp: number
  endTimestamp: number
  threadName: string
  threadId: number
  daemon: boolean
  classloader: string
  stackTraceNodeList: StackTraceNode[]
  jobId: number
  state: number
  message: string
}

function createBaseStackResponse(): StackResponse {
  return {
    startTimestamp: 0,
    endTimestamp: 0,
    threadName: '',
    threadId: 0,
    daemon: false,
    classloader: '',
    stackTraceNodeList: [],
    jobId: 0,
    state: 0,
    message: '',
  }
}

export const StackResponse = {
  encode(message: StackResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.startTimestamp !== 0)
      writer.uint32(8).int64(message.startTimestamp)

    if (message.endTimestamp !== 0)
      writer.uint32(16).int64(message.endTimestamp)

    if (message.threadName !== '')
      writer.uint32(26).string(message.threadName)

    if (message.threadId !== 0)
      writer.uint32(32).int64(message.threadId)

    if (message.daemon === true)
      writer.uint32(40).bool(message.daemon)

    if (message.classloader !== '')
      writer.uint32(50).string(message.classloader)

    for (const v of message.stackTraceNodeList)
      StackTraceNode.encode(v!, writer.uint32(58).fork()).ldelim()

    if (message.jobId !== 0)
      writer.uint32(64).int32(message.jobId)

    if (message.state !== 0)
      writer.uint32(72).int32(message.state)

    if (message.message !== '')
      writer.uint32(82).string(message.message)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StackResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseStackResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.startTimestamp = longToNumber(reader.int64() as Long)
          continue
        case 2:
          if (tag !== 16)
            break

          message.endTimestamp = longToNumber(reader.int64() as Long)
          continue
        case 3:
          if (tag !== 26)
            break

          message.threadName = reader.string()
          continue
        case 4:
          if (tag !== 32)
            break

          message.threadId = longToNumber(reader.int64() as Long)
          continue
        case 5:
          if (tag !== 40)
            break

          message.daemon = reader.bool()
          continue
        case 6:
          if (tag !== 50)
            break

          message.classloader = reader.string()
          continue
        case 7:
          if (tag !== 58)
            break

          message.stackTraceNodeList.push(StackTraceNode.decode(reader, reader.uint32()))
          continue
        case 8:
          if (tag !== 64)
            break

          message.jobId = reader.int32()
          continue
        case 9:
          if (tag !== 72)
            break

          message.state = reader.int32()
          continue
        case 10:
          if (tag !== 82)
            break

          message.message = reader.string()
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
