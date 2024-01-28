/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface GarbageCollector {
  name: string
  collectionCount: number
  collectionTime: number
  memoryPoolNames: string[]
}

function createBaseGarbageCollector(): GarbageCollector {
  return { name: '', collectionCount: 0, collectionTime: 0, memoryPoolNames: [] }
}

export const GarbageCollector = {
  encode(message: GarbageCollector, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '')
      writer.uint32(10).string(message.name)

    if (message.collectionCount !== 0)
      writer.uint32(16).int64(message.collectionCount)

    if (message.collectionTime !== 0)
      writer.uint32(24).int64(message.collectionTime)

    for (const v of message.memoryPoolNames)
      writer.uint32(34).string(v!)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GarbageCollector {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseGarbageCollector()
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

          message.collectionCount = longToNumber(reader.int64() as Long)
          continue
        case 3:
          if (tag !== 24)
            break

          message.collectionTime = longToNumber(reader.int64() as Long)
          continue
        case 4:
          if (tag !== 34)
            break

          message.memoryPoolNames.push(reader.string())
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
