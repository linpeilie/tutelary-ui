/* eslint-disable */
import _m0 from 'protobufjs/minimal'
import { Metadata } from './Metadata'

export const protobufPackage = ''

/**  */
export interface ErrorMessage {
  status: boolean
  message: string
  metadata: Metadata | undefined
}

function createBaseErrorMessage(): ErrorMessage {
  return { status: false, message: '', metadata: undefined }
}

export const ErrorMessage = {
  encode(message: ErrorMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.status === true)
      writer.uint32(8).bool(message.status)

    if (message.message !== '')
      writer.uint32(18).string(message.message)

    if (message.metadata !== undefined)
      Metadata.encode(message.metadata, writer.uint32(26).fork()).ldelim()

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ErrorMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseErrorMessage()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.status = reader.bool()
          continue
        case 2:
          if (tag !== 18)
            break

          message.message = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.metadata = Metadata.decode(reader, reader.uint32())
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
