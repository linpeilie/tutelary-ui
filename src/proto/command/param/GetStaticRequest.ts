/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface GetStaticRequest {
  qualifiedClassName: string
  field: string
  classLoader: string
}

function createBaseGetStaticRequest(): GetStaticRequest {
  return { qualifiedClassName: '', field: '', classLoader: '' }
}

export const GetStaticRequest = {
  encode(message: GetStaticRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.qualifiedClassName !== '')
      writer.uint32(10).string(message.qualifiedClassName)

    if (message.field !== '')
      writer.uint32(18).string(message.field)

    if (message.classLoader !== '')
      writer.uint32(26).string(message.classLoader)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStaticRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseGetStaticRequest()
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

          message.field = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.classLoader = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
