/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface ProfilerStopResponse {
  sessionId: string;
  status: string;
  resultData: string;
  jobId: number;
  state: number;
  message: string;
}

function createBaseProfilerStopResponse(): ProfilerStopResponse {
  return { sessionId: "", status: "", resultData: "", jobId: 0, state: 0, message: "" };
}

export const ProfilerStopResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): ProfilerStopResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProfilerStopResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 10) break; message.sessionId = reader.string(); continue;
        case 2: if (tag !== 18) break; message.status = reader.string(); continue;
        case 3: if (tag !== 26) break; message.resultData = reader.string(); continue;
        case 4: if (tag !== 32) break; message.jobId = reader.int32(); continue;
        case 5: if (tag !== 40) break; message.state = reader.int32(); continue;
        case 6: if (tag !== 50) break; message.message = reader.string(); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
