/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { BaseThreadInfo } from "../domain/BaseThreadInfo";
import { TraceNode } from "../domain/TraceNode";

export const protobufPackage = "";

/**  */
export interface TraceResponse {
  finishTime: string;
  node: TraceNode;
  thread: BaseThreadInfo;
  tccl: string;
  jobId: number;
  state: number;
  message: string;
}

function createBaseTraceResponse(): TraceResponse {
  return { finishTime: "", node: undefined, thread: undefined, tccl: "", jobId: 0, state: 0, message: "" };
}

export const TraceResponse = {
  encode(message: TraceResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.finishTime !== "") {
      writer.uint32(10).string(message.finishTime);
    }
    if (message.node !== undefined) {
      TraceNode.encode(message.node, writer.uint32(18).fork()).ldelim();
    }
    if (message.thread !== undefined) {
      BaseThreadInfo.encode(message.thread, writer.uint32(26).fork()).ldelim();
    }
    if (message.tccl !== "") {
      writer.uint32(34).string(message.tccl);
    }
    if (message.jobId !== 0) {
      writer.uint32(40).int32(message.jobId);
    }
    if (message.state !== 0) {
      writer.uint32(48).int32(message.state);
    }
    if (message.message !== "") {
      writer.uint32(58).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TraceResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTraceResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.finishTime = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.node = TraceNode.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.thread = BaseThreadInfo.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.tccl = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.jobId = reader.int32();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.state = reader.int32();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.message = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};
