/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface LockInfo {
  className: string
  identityHashCode: number
}

function createBaseLockInfo(): LockInfo {
  return { className: '', identityHashCode: 0 }
}

export const LockInfo = {
  encode(message: LockInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.className !== '')
      writer.uint32(10).string(message.className)

    if (message.identityHashCode !== 0)
      writer.uint32(16).int32(message.identityHashCode)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LockInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseLockInfo()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.className = reader.string()
          continue
        case 2:
          if (tag !== 16)
            break

          message.identityHashCode = reader.int32()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
