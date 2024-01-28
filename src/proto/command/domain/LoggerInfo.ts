/* eslint-disable */
import _m0 from 'protobufjs/minimal'
import { LoggerAppender } from './LoggerAppender'

export const protobufPackage = ''

/**  */
export interface LoggerInfo {
  name: string
  clazz: string
  classLoader: string
  classLoaderHash: string
  level: string
  effectiveLevel: string
  additivity: boolean
  codeSource: string
  config: string
  appenders: LoggerAppender[]
}

function createBaseLoggerInfo(): LoggerInfo {
  return {
    name: '',
    clazz: '',
    classLoader: '',
    classLoaderHash: '',
    level: '',
    effectiveLevel: '',
    additivity: false,
    codeSource: '',
    config: '',
    appenders: [],
  }
}

export const LoggerInfo = {
  encode(message: LoggerInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '')
      writer.uint32(10).string(message.name)

    if (message.clazz !== '')
      writer.uint32(18).string(message.clazz)

    if (message.classLoader !== '')
      writer.uint32(26).string(message.classLoader)

    if (message.classLoaderHash !== '')
      writer.uint32(34).string(message.classLoaderHash)

    if (message.level !== '')
      writer.uint32(42).string(message.level)

    if (message.effectiveLevel !== '')
      writer.uint32(50).string(message.effectiveLevel)

    if (message.additivity === true)
      writer.uint32(56).bool(message.additivity)

    if (message.codeSource !== '')
      writer.uint32(66).string(message.codeSource)

    if (message.config !== '')
      writer.uint32(74).string(message.config)

    for (const v of message.appenders)
      LoggerAppender.encode(v!, writer.uint32(82).fork()).ldelim()

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoggerInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseLoggerInfo()
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

          message.clazz = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.classLoader = reader.string()
          continue
        case 4:
          if (tag !== 34)
            break

          message.classLoaderHash = reader.string()
          continue
        case 5:
          if (tag !== 42)
            break

          message.level = reader.string()
          continue
        case 6:
          if (tag !== 50)
            break

          message.effectiveLevel = reader.string()
          continue
        case 7:
          if (tag !== 56)
            break

          message.additivity = reader.bool()
          continue
        case 8:
          if (tag !== 66)
            break

          message.codeSource = reader.string()
          continue
        case 9:
          if (tag !== 74)
            break

          message.config = reader.string()
          continue
        case 10:
          if (tag !== 82)
            break

          message.appenders.push(LoggerAppender.decode(reader, reader.uint32()))
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
