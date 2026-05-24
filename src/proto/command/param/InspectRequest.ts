/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface InspectRequest {
  qualifiedClassName: string;
  methodNames: string[];
  times: number;
  cost: number;
  includeTrace: boolean;
  includeStack: boolean;
  includeReturn: boolean;
}

function createBaseInspectRequest(): InspectRequest {
  return {
    qualifiedClassName: "",
    methodNames: [],
    times: 0,
    cost: 0,
    includeTrace: false,
    includeStack: false,
    includeReturn: false
  };
}

export const InspectRequest = {
  encode(message: InspectRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.qualifiedClassName !== "") writer.uint32(10).string(message.qualifiedClassName);
    for (const v of message.methodNames) writer.uint32(18).string(v!);
    if (message.times !== 0) writer.uint32(24).int32(message.times);
    if (message.cost !== 0) writer.uint32(32).int64(message.cost);
    if (message.includeTrace === true) writer.uint32(40).bool(message.includeTrace);
    if (message.includeStack === true) writer.uint32(48).bool(message.includeStack);
    if (message.includeReturn === true) writer.uint32(56).bool(message.includeReturn);
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InspectRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInspectRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 10) break; message.qualifiedClassName = reader.string(); continue;
        case 2: if (tag !== 18) break; message.methodNames.push(reader.string()); continue;
        case 3: if (tag !== 24) break; message.times = reader.int32(); continue;
        case 4: if (tag !== 32) break; message.cost = reader.int64() as unknown as number; continue;
        case 5: if (tag !== 40) break; message.includeTrace = reader.bool(); continue;
        case 6: if (tag !== 48) break; message.includeStack = reader.bool(); continue;
        case 7: if (tag !== 56) break; message.includeReturn = reader.bool(); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
