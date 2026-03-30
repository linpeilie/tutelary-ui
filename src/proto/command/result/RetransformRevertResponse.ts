/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

export interface RetransformRevertResponse {
  jobId: number
  state: number
  message: string
}

function createBaseRetransformRevertResponse(): RetransformRevertResponse {
  return { jobId: 0, state: 0, message: '' }
}

export const RetransformRevertResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): RetransformRevertResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseRetransformRevertResponse()
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
  }
}
