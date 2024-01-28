import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface EnhanceCommandComplete {
  code: number
  jobId: number
  state: number
  message: string
}

function createBaseEnhanceCommandComplete(): EnhanceCommandComplete {
  return { code: 0, jobId: 0, state: 0, message: '' }
}

export const EnhanceCommandComplete = {
  encode(message: EnhanceCommandComplete, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0)
      writer.uint32(8).int32(message.code)

    if (message.jobId !== 0)
      writer.uint32(16).int32(message.jobId)

    if (message.state !== 0)
      writer.uint32(24).int32(message.state)

    if (message.message !== '')
      writer.uint32(34).string(message.message)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EnhanceCommandComplete {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseEnhanceCommandComplete()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.code = reader.int32()
          continue
        case 2:
          if (tag !== 16)
            break

          message.jobId = reader.int32()
          continue
        case 3:
          if (tag !== 24)
            break

          message.state = reader.int32()
          continue
        case 4:
          if (tag !== 34)
            break

          message.message = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
