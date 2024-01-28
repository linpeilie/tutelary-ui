import _m0 from 'protobufjs/minimal'
import { VmOption } from '../domain/VmOption'

export const protobufPackage = ''

/**  */
export interface SetVmOptionResponse {
  previousVmOption: VmOption | undefined
  latestVmOption: VmOption | undefined
  jobId: number
  state: number
  message: string
}

function createBaseSetVmOptionResponse(): SetVmOptionResponse {
  return { previousVmOption: undefined, latestVmOption: undefined, jobId: 0, state: 0, message: '' }
}

export const SetVmOptionResponse = {
  encode(message: SetVmOptionResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.previousVmOption !== undefined)
      VmOption.encode(message.previousVmOption, writer.uint32(10).fork()).ldelim()

    if (message.latestVmOption !== undefined)
      VmOption.encode(message.latestVmOption, writer.uint32(18).fork()).ldelim()

    if (message.jobId !== 0)
      writer.uint32(24).int32(message.jobId)

    if (message.state !== 0)
      writer.uint32(32).int32(message.state)

    if (message.message !== '')
      writer.uint32(42).string(message.message)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SetVmOptionResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseSetVmOptionResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.previousVmOption = VmOption.decode(reader, reader.uint32())
          continue
        case 2:
          if (tag !== 18)
            break

          message.latestVmOption = VmOption.decode(reader, reader.uint32())
          continue
        case 3:
          if (tag !== 24)
            break

          message.jobId = reader.int32()
          continue
        case 4:
          if (tag !== 32)
            break

          message.state = reader.int32()
          continue
        case 5:
          if (tag !== 42)
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
