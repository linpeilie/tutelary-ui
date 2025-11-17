/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

export interface Any {
  codecClass: string
  byteArray: Uint8Array
}

function createBaseAny(): Any {
  return { codecClass: '', byteArray: new Uint8Array(0) }
}

export const Any = {
  encode(message: Any, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.codecClass !== '')
      writer.uint32(10).string(message.codecClass)

    if (message.byteArray.length !== 0)
      writer.uint32(18).bytes(message.byteArray)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Any {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseAny()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.codecClass = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.byteArray = reader.bytes()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
