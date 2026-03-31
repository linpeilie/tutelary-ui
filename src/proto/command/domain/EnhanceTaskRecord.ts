/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

export interface EnhanceTaskRecord {
  taskId: string
  commandCode: number
  qualifiedClassName: string
  methodNames: string[]
  times: number
  currentTimes: number
  status: number
  createTime: number
}

function createBaseEnhanceTaskRecord(): EnhanceTaskRecord {
  return { taskId: '', commandCode: 0, qualifiedClassName: '', methodNames: [], times: 0, currentTimes: 0, status: 0, createTime: 0 }
}

export const EnhanceTaskRecord = {
  decode(input: _m0.Reader | Uint8Array, length?: number): EnhanceTaskRecord {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseEnhanceTaskRecord()
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
          message.commandCode = reader.int32()
          continue
        case 3:
          if (tag !== 26)
            break
          message.qualifiedClassName = reader.string()
          continue
        case 4:
          if (tag !== 34)
            break
          message.methodNames.push(reader.string())
          continue
        case 5:
          if (tag !== 40)
            break
          message.times = reader.int32()
          continue
        case 6:
          if (tag !== 48)
            break
          message.currentTimes = reader.int32()
          continue
        case 7:
          if (tag !== 56)
            break
          message.status = reader.int32()
          continue
        case 8:
          if (tag !== 64)
            break
          message.createTime = longToNumber(reader.int64() as Long)
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break
      reader.skipType(tag & 7)
    }
    return message
  }
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
