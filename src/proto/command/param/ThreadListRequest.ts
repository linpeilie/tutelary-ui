import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface ThreadListRequest {
  samplerInterval: number
}

function createBaseThreadListRequest(): ThreadListRequest {
  return { samplerInterval: 0 }
}

export const ThreadListRequest = {
  encode(message: ThreadListRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.samplerInterval !== 0)
      writer.uint32(8).int32(message.samplerInterval)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ThreadListRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseThreadListRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.samplerInterval = reader.int32()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
