import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface SetVmOptionRequest {
  name: string
  value: string
}

function createBaseSetVmOptionRequest(): SetVmOptionRequest {
  return { name: '', value: '' }
}

export const SetVmOptionRequest = {
  encode(message: SetVmOptionRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '')
      writer.uint32(10).string(message.name)

    if (message.value !== '')
      writer.uint32(18).string(message.value)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SetVmOptionRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseSetVmOptionRequest()
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
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
