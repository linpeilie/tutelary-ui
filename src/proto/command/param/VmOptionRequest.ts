import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface VmOptionRequest {
}

function createBaseVmOptionRequest(): VmOptionRequest {
  return {}
}

export const VmOptionRequest = {
  encode(_: VmOptionRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VmOptionRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseVmOptionRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
