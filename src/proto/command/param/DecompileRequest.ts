/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface DecompileRequest {
  qualifiedClassName: string
  methodName: string
}

function createBaseDecompileRequest(): DecompileRequest {
  return { qualifiedClassName: '', methodName: '' }
}

export const DecompileRequest = {
  encode(message: DecompileRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.qualifiedClassName !== '')
      writer.uint32(10).string(message.qualifiedClassName)

    if (message.methodName !== '')
      writer.uint32(18).string(message.methodName)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DecompileRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseDecompileRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.qualifiedClassName = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.methodName = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
