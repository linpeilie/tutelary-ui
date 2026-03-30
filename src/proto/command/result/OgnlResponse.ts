/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface OgnlResponse {
  success: boolean;
  resultType: string;
  resultValue: string;
  error: string;
  stackTrace: string[];
  jobId: number;
  state: number;
  message: string;
}

function createBaseOgnlResponse(): OgnlResponse {
  return { success: false, resultType: "", resultValue: "", error: "", stackTrace: [], jobId: 0, state: 0, message: "" };
}

export const OgnlResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): OgnlResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOgnlResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 8) break; message.success = reader.bool(); continue;
        case 2: if (tag !== 18) break; message.resultType = reader.string(); continue;
        case 3: if (tag !== 26) break; message.resultValue = reader.string(); continue;
        case 4: if (tag !== 34) break; message.error = reader.string(); continue;
        case 5: if (tag !== 42) break; message.stackTrace.push(reader.string()); continue;
        case 6: if (tag !== 48) break; message.jobId = reader.int32(); continue;
        case 7: if (tag !== 56) break; message.state = reader.int32(); continue;
        case 8: if (tag !== 66) break; message.message = reader.string(); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
