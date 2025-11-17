/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { BaseThreadInfo } from "../domain/BaseThreadInfo";
import { StackTraceNode } from "../domain/StackTraceNode";

export const protobufPackage = "";

/**  */
export interface StackResponse {
  className: string;
  methodName: string;
  startTimestamp: number;
  endTimestamp: number;
  finishTime: string;
  daemon: boolean;
  thread: BaseThreadInfo;
  tccl: string;
  stackTraceNodeList: StackTraceNode[];
  jobId: number;
  state: number;
  message: string;
}

function createBaseStackResponse(): StackResponse {
  return {
    className: "",
    methodName: "",
    startTimestamp: 0,
    endTimestamp: 0,
    finishTime: "",
    daemon: false,
    thread: {} as BaseThreadInfo,
    tccl: "",
    stackTraceNodeList: [],
    jobId: 0,
    state: 0,
    message: "",
  };
}

export const StackResponse = {
  encode(message: StackResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.className !== "") {
      writer.uint32(10).string(message.className);
    }
    if (message.methodName !== "") {
      writer.uint32(18).string(message.methodName);
    }
    if (message.startTimestamp !== 0) {
      writer.uint32(24).int64(message.startTimestamp);
    }
    if (message.endTimestamp !== 0) {
      writer.uint32(32).int64(message.endTimestamp);
    }
    if (message.finishTime !== "") {
      writer.uint32(42).string(message.finishTime);
    }
    if (message.daemon === true) {
      writer.uint32(48).bool(message.daemon);
    }
    if (message.thread !== undefined) {
      BaseThreadInfo.encode(message.thread, writer.uint32(58).fork()).ldelim();
    }
    if (message.tccl !== "") {
      writer.uint32(66).string(message.tccl);
    }
    for (const v of message.stackTraceNodeList) {
      StackTraceNode.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    if (message.jobId !== 0) {
      writer.uint32(80).int32(message.jobId);
    }
    if (message.state !== 0) {
      writer.uint32(88).int32(message.state);
    }
    if (message.message !== "") {
      writer.uint32(98).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StackResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStackResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.className = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.methodName = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.startTimestamp = longToNumber(reader.int64() as Long);
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.endTimestamp = longToNumber(reader.int64() as Long);
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.finishTime = reader.string();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.daemon = reader.bool();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.thread = BaseThreadInfo.decode(reader, reader.uint32());
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.tccl = reader.string();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.stackTraceNodeList.push(StackTraceNode.decode(reader, reader.uint32()));
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.jobId = reader.int32();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.state = reader.int32();
          continue;
        case 12:
          if (tag !== 98) {
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

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
