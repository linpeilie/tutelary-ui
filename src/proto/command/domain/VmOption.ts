/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface VmOption {
  name: string
  value: string
  writeable: boolean
  origin: string
}

function createBaseVmOption(): VmOption {
  return { name: '', value: '', writeable: false, origin: '' }
}

export const VmOption = {
  encode(message: VmOption, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '')
      writer.uint32(10).string(message.name)

    if (message.value !== '')
      writer.uint32(18).string(message.value)

    if (message.writeable === true)
      writer.uint32(24).bool(message.writeable)

    if (message.origin !== '')
      writer.uint32(34).string(message.origin)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VmOption {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseVmOption()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.name = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.value = reader.string()
          continue
        case 3:
          if (tag !== 24)
            break

          message.writeable = reader.bool()
          continue
        case 4:
          if (tag !== 34)
            break

          message.origin = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
