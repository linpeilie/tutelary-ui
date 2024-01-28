import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface ThreadDetailRequest {
  id: number
}

function createBaseThreadDetailRequest(): ThreadDetailRequest {
  return { id: 0 }
}

export const ThreadDetailRequest = {
  encode(message: ThreadDetailRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0)
      writer.uint32(8).int64(message.id)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ThreadDetailRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseThreadDetailRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.id = longToNumber(reader.int64() as Long)
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
