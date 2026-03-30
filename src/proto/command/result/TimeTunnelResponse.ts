/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface TimeTunnelResponse {
  index: number;
  finishTime: string;
  className: string;
  methodName: string;
  cost: number;
  hasException: boolean;
  params: string;
  targetClassName: string;
  targetHashCode: string;
  returnType: string;
  returnValue: string;
  exceptionType: string;
  exceptionMessage: string;
  exceptionStackTrace: string[];
  jobId: number;
  state: number;
  message: string;
}

function createBaseTimeTunnelResponse(): TimeTunnelResponse {
  return { index: 0, finishTime: "", className: "", methodName: "", cost: 0, hasException: false, params: "", targetClassName: "", targetHashCode: "", returnType: "", returnValue: "", exceptionType: "", exceptionMessage: "", exceptionStackTrace: [], jobId: 0, state: 0, message: "" };
}

export const TimeTunnelResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): TimeTunnelResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTimeTunnelResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 8) break; message.index = reader.int32(); continue;
        case 2: if (tag !== 18) break; message.finishTime = reader.string(); continue;
        case 3: if (tag !== 26) break; message.className = reader.string(); continue;
        case 4: if (tag !== 34) break; message.methodName = reader.string(); continue;
        case 5: if (tag !== 40) break; message.cost = reader.int64() as unknown as number; continue;
        case 6: if (tag !== 48) break; message.hasException = reader.bool(); continue;
        case 7: if (tag !== 58) break; message.params = reader.string(); continue;
        case 8: if (tag !== 66) break; message.targetClassName = reader.string(); continue;
        case 9: if (tag !== 74) break; message.targetHashCode = reader.string(); continue;
        case 10: if (tag !== 82) break; message.returnType = reader.string(); continue;
        case 11: if (tag !== 90) break; message.returnValue = reader.string(); continue;
        case 12: if (tag !== 98) break; message.exceptionType = reader.string(); continue;
        case 13: if (tag !== 106) break; message.exceptionMessage = reader.string(); continue;
        case 14: if (tag !== 114) break; message.exceptionStackTrace.push(reader.string()); continue;
        case 15: if (tag !== 120) break; message.jobId = reader.int32(); continue;
        case 16: if (tag !== 128) break; message.state = reader.int32(); continue;
        case 17: if (tag !== 138) break; message.message = reader.string(); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
