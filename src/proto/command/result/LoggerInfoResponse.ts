import _m0 from 'protobufjs/minimal'
import { LoggerInfo } from '../domain/LoggerInfo'

export const protobufPackage = ''

/**  */
export interface LoggerInfoResponse {
  loggers: LoggerInfo[]
  jobId: number
  state: number
  message: string
}

function createBaseLoggerInfoResponse(): LoggerInfoResponse {
  return { loggers: [], jobId: 0, state: 0, message: '' }
}

export const LoggerInfoResponse = {
  encode(message: LoggerInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.loggers)
      LoggerInfo.encode(v!, writer.uint32(10).fork()).ldelim()

    if (message.jobId !== 0)
      writer.uint32(16).int32(message.jobId)

    if (message.state !== 0)
      writer.uint32(24).int32(message.state)

    if (message.message !== '')
      writer.uint32(34).string(message.message)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoggerInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseLoggerInfoResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.loggers.push(LoggerInfo.decode(reader, reader.uint32()))
          continue
        case 2:
          if (tag !== 16)
            break

          message.jobId = reader.int32()
          continue
        case 3:
          if (tag !== 24)
            break

          message.state = reader.int32()
          continue
        case 4:
          if (tag !== 34)
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
