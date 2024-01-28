/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface JvmMemory {
  name: string
  used: number
  committed: number
  max: number
}

function createBaseJvmMemory(): JvmMemory {
  return { name: '', used: 0, committed: 0, max: 0 }
}

export const JvmMemory = {
  encode(message: JvmMemory, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '')
      writer.uint32(10).string(message.name)

    if (message.used !== 0)
      writer.uint32(16).int64(message.used)

    if (message.committed !== 0)
      writer.uint32(24).int64(message.committed)

    if (message.max !== 0)
      writer.uint32(32).int64(message.max)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): JvmMemory {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseJvmMemory()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.name = reader.string()
          continue
        case 2:
          if (tag !== 16)
            break

          message.used = longToNumber(reader.int64() as Long)
          continue
        case 3:
          if (tag !== 24)
            break

          message.committed = longToNumber(reader.int64() as Long)
          continue
        case 4:
          if (tag !== 32)
            break

          message.max = longToNumber(reader.int64() as Long)
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
