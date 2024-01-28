import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface StackRequest {
  qualifiedClassName: string
  methodNames: string[]
  times: number
}

function createBaseStackRequest(): StackRequest {
  return { qualifiedClassName: '', methodNames: [], times: 0 }
}

export const StackRequest = {
  encode(message: StackRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.qualifiedClassName !== '')
      writer.uint32(10).string(message.qualifiedClassName)

    for (const v of message.methodNames)
      writer.uint32(18).string(v!)

    if (message.times !== 0)
      writer.uint32(24).int32(message.times)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StackRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseStackRequest()
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

          message.methodNames.push(reader.string())
          continue
        case 3:
          if (tag !== 24)
            break

          message.times = reader.int32()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
