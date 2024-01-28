/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface JvmInfo {
  inputArguments: string[]
  systemProperties: { [key: string]: string }
  classPath: string
  libraryPath: string
  vmVendor: string
  vmName: string
  vmVersion: string
  jdkVersion: string
  startTime: number
}

export interface JvmInfo_SystemPropertiesEntry {
  key: string
  value: string
}

function createBaseJvmInfo(): JvmInfo {
  return {
    inputArguments: [],
    systemProperties: {},
    classPath: '',
    libraryPath: '',
    vmVendor: '',
    vmName: '',
    vmVersion: '',
    jdkVersion: '',
    startTime: 0,
  }
}

export const JvmInfo = {
  encode(message: JvmInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.inputArguments)
      writer.uint32(10).string(v!)

    Object.entries(message.systemProperties).forEach(([key, value]) => {
      JvmInfo_SystemPropertiesEntry.encode({ key: key as any, value }, writer.uint32(18).fork()).ldelim()
    })
    if (message.classPath !== '')
      writer.uint32(26).string(message.classPath)

    if (message.libraryPath !== '')
      writer.uint32(34).string(message.libraryPath)

    if (message.vmVendor !== '')
      writer.uint32(42).string(message.vmVendor)

    if (message.vmName !== '')
      writer.uint32(50).string(message.vmName)

    if (message.vmVersion !== '')
      writer.uint32(58).string(message.vmVersion)

    if (message.jdkVersion !== '')
      writer.uint32(66).string(message.jdkVersion)

    if (message.startTime !== 0)
      writer.uint32(72).int64(message.startTime)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): JvmInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseJvmInfo()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.inputArguments.push(reader.string())
          continue
        case 2:
          if (tag !== 18)
            break

          const entry2 = JvmInfo_SystemPropertiesEntry.decode(reader, reader.uint32())
          if (entry2.value !== undefined)
            message.systemProperties[entry2.key] = entry2.value

          continue
        case 3:
          if (tag !== 26)
            break

          message.classPath = reader.string()
          continue
        case 4:
          if (tag !== 34)
            break

          message.libraryPath = reader.string()
          continue
        case 5:
          if (tag !== 42)
            break

          message.vmVendor = reader.string()
          continue
        case 6:
          if (tag !== 50)
            break

          message.vmName = reader.string()
          continue
        case 7:
          if (tag !== 58)
            break

          message.vmVersion = reader.string()
          continue
        case 8:
          if (tag !== 66)
            break

          message.jdkVersion = reader.string()
          continue
        case 9:
          if (tag !== 72)
            break

          message.startTime = longToNumber(reader.int64() as Long)
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}

function createBaseJvmInfo_SystemPropertiesEntry(): JvmInfo_SystemPropertiesEntry {
  return { key: '', value: '' }
}

export const JvmInfo_SystemPropertiesEntry = {
  encode(message: JvmInfo_SystemPropertiesEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== '')
      writer.uint32(10).string(message.key)

    if (message.value !== '')
      writer.uint32(18).string(message.value)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): JvmInfo_SystemPropertiesEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseJvmInfo_SystemPropertiesEntry()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.key = reader.string()
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

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER))
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER')

  return long.toNumber()
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any
  _m0.configure()
}
