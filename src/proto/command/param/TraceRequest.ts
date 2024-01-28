import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface TraceRequest {
  qualifiedClassName: string
  methodNames: string[]
  times: number
  cost: number
}

function createBaseTraceRequest(): TraceRequest {
  return { qualifiedClassName: '', methodNames: [], times: 0, cost: 0 }
}

export const TraceRequest = {
  encode(message: TraceRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.qualifiedClassName !== '')
      writer.uint32(10).string(message.qualifiedClassName)

    for (const v of message.methodNames)
      writer.uint32(18).string(v!)

    if (message.times !== 0)
      writer.uint32(24).int32(message.times)

    if (message.cost !== 0)
      writer.uint32(32).int32(message.cost)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TraceRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseTraceRequest()
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
        case 4:
          if (tag !== 32)
            break

          message.cost = reader.int32()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
