/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { BaseThreadInfo } from "../domain/BaseThreadInfo";

export const protobufPackage = "";

export interface WatchResponse {
  className: string;
  methodName: string;
  params: string;
  target: string;
  returnValue: string;
  exception: string;
  cost: number;
  finishTime: string;
  startTimestamp: number;
  endTimestamp: number;
  thread: BaseThreadInfo | undefined;
  daemon: boolean;
  tccl: string;
  jobId: number;
  state: number;
  message: string;
}

function createBaseWatchResponse(): WatchResponse {
  return { className: "", methodName: "", params: "", target: "", returnValue: "", exception: "", cost: 0, finishTime: "", startTimestamp: 0, endTimestamp: 0, thread: undefined, daemon: false, tccl: "", jobId: 0, state: 0, message: "" };
}

export const WatchResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): WatchResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseWatchResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 10) break; message.className = reader.string(); continue;
        case 2: if (tag !== 18) break; message.methodName = reader.string(); continue;
        case 3: if (tag !== 26) break; message.params = reader.string(); continue;
        case 4: if (tag !== 34) break; message.target = reader.string(); continue;
        case 5: if (tag !== 42) break; message.returnValue = reader.string(); continue;
        case 6: if (tag !== 50) break; message.exception = reader.string(); continue;
        case 7: if (tag !== 56) break; message.cost = reader.int64() as unknown as number; continue;
        case 8: if (tag !== 66) break; message.finishTime = reader.string(); continue;
        case 9: if (tag !== 72) break; message.startTimestamp = reader.int64() as unknown as number; continue;
        case 10: if (tag !== 80) break; message.endTimestamp = reader.int64() as unknown as number; continue;
        case 11: if (tag !== 90) break; message.thread = BaseThreadInfo.decode(reader, reader.uint32()); continue;
        case 12: if (tag !== 96) break; message.daemon = reader.bool(); continue;
        case 13: if (tag !== 106) break; message.tccl = reader.string(); continue;
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
