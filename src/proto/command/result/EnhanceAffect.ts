import _m0 from 'protobufjs/minimal'
import { BaseMethod } from '../domain/BaseMethod'

export const protobufPackage = ''

/**  */
export interface EnhanceAffect {
  methods: BaseMethod[]
  cCnt: number
  mCnt: number
  jobId: number
  state: number
  message: string
}

function createBaseEnhanceAffect(): EnhanceAffect {
  return { methods: [], cCnt: 0, mCnt: 0, jobId: 0, state: 0, message: '' }
}

export const EnhanceAffect = {
  encode(message: EnhanceAffect, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.methods)
      BaseMethod.encode(v!, writer.uint32(10).fork()).ldelim()

    if (message.cCnt !== 0)
      writer.uint32(16).int32(message.cCnt)

    if (message.mCnt !== 0)
      writer.uint32(24).int32(message.mCnt)

    if (message.jobId !== 0)
      writer.uint32(32).int32(message.jobId)

    if (message.state !== 0)
      writer.uint32(40).int32(message.state)

    if (message.message !== '')
      writer.uint32(50).string(message.message)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EnhanceAffect {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseEnhanceAffect()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.methods.push(BaseMethod.decode(reader, reader.uint32()))
          continue
        case 2:
          if (tag !== 16)
            break

          message.cCnt = reader.int32()
          continue
        case 3:
          if (tag !== 24)
            break

          message.mCnt = reader.int32()
          continue
        case 4:
          if (tag !== 32)
            break

          message.jobId = reader.int32()
          continue
        case 5:
          if (tag !== 40)
            break

          message.state = reader.int32()
          continue
        case 6:
          if (tag !== 50)
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
