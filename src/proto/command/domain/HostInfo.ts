/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface HostInfo {
  hostName: string
  hostAddress: string
  osName: string
  arch: string
  availableProcessors: number
  committedVirtualMemory: number
  totalPhysicalMemorySize: number
  freePhysicalMemorySize: number
  totalSwapSpaceSize: number
  freeSwapSpaceSize: number
  diskFreeSpace: number
  diskUsableSpace: number
  diskTotalSpace: number
}

function createBaseHostInfo(): HostInfo {
  return {
    hostName: '',
    hostAddress: '',
    osName: '',
    arch: '',
    availableProcessors: 0,
    committedVirtualMemory: 0,
    totalPhysicalMemorySize: 0,
    freePhysicalMemorySize: 0,
    totalSwapSpaceSize: 0,
    freeSwapSpaceSize: 0,
    diskFreeSpace: 0,
    diskUsableSpace: 0,
    diskTotalSpace: 0,
  }
}

export const HostInfo = {
  encode(message: HostInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hostName !== '')
      writer.uint32(10).string(message.hostName)

    if (message.hostAddress !== '')
      writer.uint32(18).string(message.hostAddress)

    if (message.osName !== '')
      writer.uint32(26).string(message.osName)

    if (message.arch !== '')
      writer.uint32(34).string(message.arch)

    if (message.availableProcessors !== 0)
      writer.uint32(40).int32(message.availableProcessors)

    if (message.committedVirtualMemory !== 0)
      writer.uint32(48).int64(message.committedVirtualMemory)

    if (message.totalPhysicalMemorySize !== 0)
      writer.uint32(56).int64(message.totalPhysicalMemorySize)

    if (message.freePhysicalMemorySize !== 0)
      writer.uint32(64).int64(message.freePhysicalMemorySize)

    if (message.totalSwapSpaceSize !== 0)
      writer.uint32(72).int64(message.totalSwapSpaceSize)

    if (message.freeSwapSpaceSize !== 0)
      writer.uint32(80).int64(message.freeSwapSpaceSize)

    if (message.diskFreeSpace !== 0)
      writer.uint32(88).int64(message.diskFreeSpace)

    if (message.diskUsableSpace !== 0)
      writer.uint32(96).int64(message.diskUsableSpace)

    if (message.diskTotalSpace !== 0)
      writer.uint32(104).int64(message.diskTotalSpace)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HostInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseHostInfo()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.hostName = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.hostAddress = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.osName = reader.string()
          continue
        case 4:
          if (tag !== 34)
            break

          message.arch = reader.string()
          continue
        case 5:
          if (tag !== 40)
            break

          message.availableProcessors = reader.int32()
          continue
        case 6:
          if (tag !== 48)
            break

          message.committedVirtualMemory = longToNumber(reader.int64() as Long)
          continue
        case 7:
          if (tag !== 56)
            break

          message.totalPhysicalMemorySize = longToNumber(reader.int64() as Long)
          continue
        case 8:
          if (tag !== 64)
            break

          message.freePhysicalMemorySize = longToNumber(reader.int64() as Long)
          continue
        case 9:
          if (tag !== 72)
            break

          message.totalSwapSpaceSize = longToNumber(reader.int64() as Long)
          continue
        case 10:
          if (tag !== 80)
            break

          message.freeSwapSpaceSize = longToNumber(reader.int64() as Long)
          continue
        case 11:
          if (tag !== 88)
            break

          message.diskFreeSpace = longToNumber(reader.int64() as Long)
          continue
        case 12:
          if (tag !== 96)
            break

          message.diskUsableSpace = longToNumber(reader.int64() as Long)
          continue
        case 13:
          if (tag !== 104)
            break

          message.diskTotalSpace = longToNumber(reader.int64() as Long)
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
