import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface RetransformResponse {
  jobId: number
  state: number
  message: string
}

function createBaseRetransformResponse(): RetransformResponse {
  return { jobId: 0, state: 0, message: '' }
}

export const RetransformResponse = {
  encode(message: RetransformResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.jobId !== 0)
      writer.uint32(8).int32(message.jobId)

    if (message.state !== 0)
      writer.uint32(16).int32(message.state)

    if (message.message !== '')
      writer.uint32(26).string(message.message)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RetransformResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseRetransformResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.jobId = reader.int32()
          continue
        case 2:
          if (tag !== 16)
            break

          message.state = reader.int32()
          continue
        case 3:
          if (tag !== 26)
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
