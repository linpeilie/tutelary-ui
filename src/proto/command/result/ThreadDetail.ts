import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { LockInfo } from '../domain/LockInfo'
import { StackTraceNode } from '../domain/StackTraceNode'

export const protobufPackage = ''

/**  */
export interface ThreadDetail {
  id: number
  name: string
  threadState: string
  lock: LockInfo | undefined
  lockName: string
  lockOwnerId: number
  lockOwnerName: string
  stackTrace: StackTraceNode[]
  jobId: number
  state: number
  message: string
}

function createBaseThreadDetail(): ThreadDetail {
  return {
    id: 0,
    name: '',
    threadState: '',
    lock: undefined,
    lockName: '',
    lockOwnerId: 0,
    lockOwnerName: '',
    stackTrace: [],
    jobId: 0,
    state: 0,
    message: '',
  }
}

export const ThreadDetail = {
  encode(message: ThreadDetail, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0)
      writer.uint32(8).int64(message.id)

    if (message.name !== '')
      writer.uint32(18).string(message.name)

    if (message.threadState !== '')
      writer.uint32(26).string(message.threadState)

    if (message.lock !== undefined)
      LockInfo.encode(message.lock, writer.uint32(34).fork()).ldelim()

    if (message.lockName !== '')
      writer.uint32(42).string(message.lockName)

    if (message.lockOwnerId !== 0)
      writer.uint32(48).int64(message.lockOwnerId)

    if (message.lockOwnerName !== '')
      writer.uint32(58).string(message.lockOwnerName)

    for (const v of message.stackTrace)
      StackTraceNode.encode(v!, writer.uint32(66).fork()).ldelim()

    if (message.jobId !== 0)
      writer.uint32(72).int32(message.jobId)

    if (message.state !== 0)
      writer.uint32(80).int32(message.state)

    if (message.message !== '')
      writer.uint32(90).string(message.message)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ThreadDetail {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseThreadDetail()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.id = longToNumber(reader.int64() as Long)
          continue
        case 2:
          if (tag !== 18)
            break

          message.name = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.threadState = reader.string()
          continue
        case 4:
          if (tag !== 34)
            break

          message.lock = LockInfo.decode(reader, reader.uint32())
          continue
        case 5:
          if (tag !== 42)
            break

          message.lockName = reader.string()
          continue
        case 6:
          if (tag !== 48)
            break

          message.lockOwnerId = longToNumber(reader.int64() as Long)
          continue
        case 7:
          if (tag !== 58)
            break

          message.lockOwnerName = reader.string()
          continue
        case 8:
          if (tag !== 66)
            break

          message.stackTrace.push(StackTraceNode.decode(reader, reader.uint32()))
          continue
        case 9:
          if (tag !== 72)
            break

          message.jobId = reader.int32()
          continue
        case 10:
          if (tag !== 80)
            break

          message.state = reader.int32()
          continue
        case 11:
          if (tag !== 90)
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
