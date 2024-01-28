import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface UpdateLoggerLevelRequest {
  classLoaderHashCode: string
  name: string
  level: string
}

function createBaseUpdateLoggerLevelRequest(): UpdateLoggerLevelRequest {
  return { classLoaderHashCode: '', name: '', level: '' }
}

export const UpdateLoggerLevelRequest = {
  encode(message: UpdateLoggerLevelRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classLoaderHashCode !== '')
      writer.uint32(10).string(message.classLoaderHashCode)

    if (message.name !== '')
      writer.uint32(18).string(message.name)

    if (message.level !== '')
      writer.uint32(26).string(message.level)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UpdateLoggerLevelRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseUpdateLoggerLevelRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.classLoaderHashCode = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.name = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.level = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
