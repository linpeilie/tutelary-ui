/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface HostBaseInfo {
  osName: string
  osVersion: string
  availableProcessors: number
}

function createBaseHostBaseInfo(): HostBaseInfo {
  return { osName: '', osVersion: '', availableProcessors: 0 }
}

export const HostBaseInfo = {
  encode(message: HostBaseInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.osName !== '')
      writer.uint32(10).string(message.osName)

    if (message.osVersion !== '')
      writer.uint32(18).string(message.osVersion)

    if (message.availableProcessors !== 0)
      writer.uint32(24).int32(message.availableProcessors)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HostBaseInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseHostBaseInfo()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.osName = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.osVersion = reader.string()
          continue
        case 3:
          if (tag !== 24)
            break

          message.availableProcessors = reader.int32()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
