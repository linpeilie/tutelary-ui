/* eslint-disable */
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface StackTraceNode {
  declaringClass: string
  methodName: string
  lineNumber: number
  isNative: boolean
}

function createBaseStackTraceNode(): StackTraceNode {
  return { declaringClass: '', methodName: '', lineNumber: 0, isNative: false }
}

export const StackTraceNode = {
  encode(message: StackTraceNode, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.declaringClass !== '')
      writer.uint32(10).string(message.declaringClass)

    if (message.methodName !== '')
      writer.uint32(18).string(message.methodName)

    if (message.lineNumber !== 0)
      writer.uint32(24).int32(message.lineNumber)

    if (message.isNative === true)
      writer.uint32(32).bool(message.isNative)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StackTraceNode {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseStackTraceNode()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.declaringClass = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.methodName = reader.string()
          continue
        case 3:
          if (tag !== 24)
            break

          message.lineNumber = reader.int32()
          continue
        case 4:
          if (tag !== 32)
            break

          message.isNative = reader.bool()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
