/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface LoggerInfoRequest {
  name: string
  includeNoAppender: boolean
  classLoaderHashCode: string
}

function createBaseLoggerInfoRequest(): LoggerInfoRequest {
  return { name: '', includeNoAppender: false, classLoaderHashCode: '' }
}

export const LoggerInfoRequest = {
  encode(message: LoggerInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '')
      writer.uint32(10).string(message.name)

    if (message.includeNoAppender === true)
      writer.uint32(16).bool(message.includeNoAppender)

    if (message.classLoaderHashCode !== '')
      writer.uint32(26).string(message.classLoaderHashCode)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoggerInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseLoggerInfoRequest()
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

          message.includeNoAppender = reader.bool()
          continue
        case 3:
          if (tag !== 26)
            break

          message.classLoaderHashCode = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
