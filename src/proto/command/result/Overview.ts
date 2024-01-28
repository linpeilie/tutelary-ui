import _m0 from 'protobufjs/minimal'
import { GarbageCollector } from '../domain/GarbageCollector'
import { HostInfo } from '../domain/HostInfo'
import { JvmMemory } from '../domain/JvmMemory'
import { ThreadStatistic } from '../domain/ThreadStatistic'

export const protobufPackage = ''

/**  */
export interface Overview {
  hostInfo: HostInfo | undefined
  threadStatistic: ThreadStatistic | undefined
  heapMemory: JvmMemory[]
  nonHeapMemory: JvmMemory[]
  garbageCollectors: GarbageCollector[]
  jobId: number
  state: number
  message: string
}

function createBaseOverview(): Overview {
  return {
    hostInfo: undefined,
    threadStatistic: undefined,
    heapMemory: [],
    nonHeapMemory: [],
    garbageCollectors: [],
    jobId: 0,
    state: 0,
    message: '',
  }
}

export const Overview = {
  encode(message: Overview, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hostInfo !== undefined)
      HostInfo.encode(message.hostInfo, writer.uint32(10).fork()).ldelim()

    if (message.threadStatistic !== undefined)
      ThreadStatistic.encode(message.threadStatistic, writer.uint32(18).fork()).ldelim()

    for (const v of message.heapMemory)
      JvmMemory.encode(v!, writer.uint32(26).fork()).ldelim()

    for (const v of message.nonHeapMemory)
      JvmMemory.encode(v!, writer.uint32(34).fork()).ldelim()

    for (const v of message.garbageCollectors)
      GarbageCollector.encode(v!, writer.uint32(42).fork()).ldelim()

    if (message.jobId !== 0)
      writer.uint32(48).int32(message.jobId)

    if (message.state !== 0)
      writer.uint32(56).int32(message.state)

    if (message.message !== '')
      writer.uint32(66).string(message.message)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Overview {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseOverview()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.hostInfo = HostInfo.decode(reader, reader.uint32())
          continue
        case 2:
          if (tag !== 18)
            break

          message.threadStatistic = ThreadStatistic.decode(reader, reader.uint32())
          continue
        case 3:
          if (tag !== 26)
            break

          message.heapMemory.push(JvmMemory.decode(reader, reader.uint32()))
          continue
        case 4:
          if (tag !== 34)
            break

          message.nonHeapMemory.push(JvmMemory.decode(reader, reader.uint32()))
          continue
        case 5:
          if (tag !== 42)
            break

          message.garbageCollectors.push(GarbageCollector.decode(reader, reader.uint32()))
          continue
        case 6:
          if (tag !== 48)
            break

          message.jobId = reader.int32()
          continue
        case 7:
          if (tag !== 56)
            break

          message.state = reader.int32()
          continue
        case 8:
          if (tag !== 66)
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
