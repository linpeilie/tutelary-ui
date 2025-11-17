/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface HeapDumpRequest {
  live: boolean
}

function createBaseHeapDumpRequest(): HeapDumpRequest {
  return { live: false }
}

export const HeapDumpRequest = {
  encode(message: HeapDumpRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.live === true)
      writer.uint32(8).bool(message.live)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HeapDumpRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseHeapDumpRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.live = reader.bool()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
