/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface ThreadStatistic {
  threadCount: number
  peakThreadCount: number
  daemonThreadCount: number
  totalStartedThreadCount: number
}

function createBaseThreadStatistic(): ThreadStatistic {
  return { threadCount: 0, peakThreadCount: 0, daemonThreadCount: 0, totalStartedThreadCount: 0 }
}

export const ThreadStatistic = {
  encode(message: ThreadStatistic, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.threadCount !== 0)
      writer.uint32(8).int32(message.threadCount)

    if (message.peakThreadCount !== 0)
      writer.uint32(16).int32(message.peakThreadCount)

    if (message.daemonThreadCount !== 0)
      writer.uint32(24).int32(message.daemonThreadCount)

    if (message.totalStartedThreadCount !== 0)
      writer.uint32(32).int64(message.totalStartedThreadCount)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ThreadStatistic {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseThreadStatistic()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.threadCount = reader.int32()
          continue
        case 2:
          if (tag !== 16)
            break

          message.peakThreadCount = reader.int32()
          continue
        case 3:
          if (tag !== 24)
            break

          message.daemonThreadCount = reader.int32()
          continue
        case 4:
          if (tag !== 32)
            break

          message.totalStartedThreadCount = longToNumber(reader.int64() as Long)
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
