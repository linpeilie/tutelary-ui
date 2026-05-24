/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { BaseThreadInfo } from "../domain/BaseThreadInfo";
import { StackTraceNode } from "../domain/StackTraceNode";
import { TraceNode } from "../domain/TraceNode";

export const protobufPackage = "";

export interface InspectResponse {
  className: string;
  methodName: string;
  params: string;
  exception: string;
  finishTime: string;
  startTimestamp: number;
  endTimestamp: number;
  cost: number;
  thread: BaseThreadInfo | undefined;
  tccl: string;
  returnValue: string;
  traceNode: TraceNode | undefined;
  stackTraceNodeList: StackTraceNode[];
  jobId: number;
  state: number;
  message: string;
}

function createBaseInspectResponse(): InspectResponse {
  return {
    className: "",
    methodName: "",
    params: "",
    exception: "",
    finishTime: "",
    startTimestamp: 0,
    endTimestamp: 0,
    cost: 0,
    thread: undefined,
    tccl: "",
    returnValue: "",
    traceNode: undefined,
    stackTraceNodeList: [],
    jobId: 0,
    state: 0,
    message: ""
  };
}

export const InspectResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): InspectResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInspectResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 10) break; message.className = reader.string(); continue;
        case 2: if (tag !== 18) break; message.methodName = reader.string(); continue;
        case 3: if (tag !== 26) break; message.params = reader.string(); continue;
        case 4: if (tag !== 34) break; message.exception = reader.string(); continue;
        case 5: if (tag !== 42) break; message.finishTime = reader.string(); continue;
        case 6: if (tag !== 48) break; message.startTimestamp = reader.int64() as unknown as number; continue;
        case 7: if (tag !== 56) break; message.endTimestamp = reader.int64() as unknown as number; continue;
        case 8: if (tag !== 64) break; message.cost = reader.int64() as unknown as number; continue;
        case 9: if (tag !== 74) break; message.thread = BaseThreadInfo.decode(reader, reader.uint32()); continue;
        case 10: if (tag !== 82) break; message.tccl = reader.string(); continue;
        case 11: if (tag !== 90) break; message.returnValue = reader.string(); continue;
        case 12: if (tag !== 98) break; message.traceNode = TraceNode.decode(reader, reader.uint32()); continue;
        case 13: if (tag !== 106) break; message.stackTraceNodeList.push(StackTraceNode.decode(reader, reader.uint32())); continue;
        case 14: if (tag !== 112) break; message.jobId = reader.int32(); continue;
        case 15: if (tag !== 120) break; message.state = reader.int32(); continue;
        case 16: if (tag !== 130) break; message.message = reader.string(); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
