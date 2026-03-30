/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

export interface RetransformDetailResponse {
  qualifiedClassName: string
  originalSource: string
  latestSource: string
  updateTime: number
  jobId: number
  state: number
  message: string
}

function createBaseRetransformDetailResponse(): RetransformDetailResponse {
  return { qualifiedClassName: '', originalSource: '', latestSource: '', updateTime: 0, jobId: 0, state: 0, message: '' }
}

export const RetransformDetailResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): RetransformDetailResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseRetransformDetailResponse()
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

          message.originalSource = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.latestSource = reader.string()
          continue
        case 4:
          if (tag !== 32)
            break

          message.updateTime = longToNumber(reader.int64() as Long)
          continue
        case 5:
          if (tag !== 40)
            break

          message.jobId = reader.int32()
          continue
        case 6:
          if (tag !== 48)
            break

          message.state = reader.int32()
          continue
        case 7:
          if (tag !== 58)
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

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER))
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER')

  return long.toNumber()
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any
  _m0.configure()
}
