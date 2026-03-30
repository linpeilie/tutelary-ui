/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

export interface RetransformDetailRequest {
  qualifiedClassName: string
}

function createBaseRetransformDetailRequest(): RetransformDetailRequest {
  return { qualifiedClassName: '' }
}

export const RetransformDetailRequest = {
  encode(message: RetransformDetailRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.qualifiedClassName !== '')
      writer.uint32(10).string(message.qualifiedClassName)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RetransformDetailRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseRetransformDetailRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.qualifiedClassName = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
