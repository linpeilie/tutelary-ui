/* eslint-disable */
import _m0 from 'protobufjs/minimal'
import { TraceTaskRecord } from '../domain/TraceTaskRecord'

export const protobufPackage = ''

export interface TraceTaskListResponse {
  runningTasks: TraceTaskRecord[]
  recentTasks: TraceTaskRecord[]
  jobId: number
  state: number
  message: string
}

function createBaseTraceTaskListResponse(): TraceTaskListResponse {
  return { runningTasks: [], recentTasks: [], jobId: 0, state: 0, message: '' }
}

export const TraceTaskListResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): TraceTaskListResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseTraceTaskListResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break
          message.runningTasks.push(TraceTaskRecord.decode(reader, reader.uint32()))
          continue
        case 2:
          if (tag !== 18)
            break
          message.recentTasks.push(TraceTaskRecord.decode(reader, reader.uint32()))
          continue
        case 3:
          if (tag !== 24)
            break
          message.jobId = reader.int32()
          continue
        case 4:
          if (tag !== 32)
            break
          message.state = reader.int32()
          continue
        case 5:
          if (tag !== 42)
            break
          message.message = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break
      reader.skipType(tag & 7)
    }
    return message
  }
}
