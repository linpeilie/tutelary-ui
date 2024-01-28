import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface LoggerAppender {
  name: string
  file: string
  blocking: string
  appenderRef: string[]
  target: string
}

function createBaseLoggerAppender(): LoggerAppender {
  return { name: '', file: '', blocking: '', appenderRef: [], target: '' }
}

export const LoggerAppender = {
  encode(message: LoggerAppender, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '')
      writer.uint32(10).string(message.name)

    if (message.file !== '')
      writer.uint32(18).string(message.file)

    if (message.blocking !== '')
      writer.uint32(26).string(message.blocking)

    for (const v of message.appenderRef)
      writer.uint32(34).string(v!)

    if (message.target !== '')
      writer.uint32(42).string(message.target)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoggerAppender {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseLoggerAppender()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.name = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.file = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.blocking = reader.string()
          continue
        case 4:
          if (tag !== 34)
            break

          message.appenderRef.push(reader.string())
          continue
        case 5:
          if (tag !== 42)
            break

          message.target = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
