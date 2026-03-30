/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface MonitorResponse {
  timestamp: number;
  totalCount: number;
  successCount: number;
  failCount: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  successRate: number;
  qps: number;
  jobId: number;
  state: number;
  message: string;
}

function createBaseMonitorResponse(): MonitorResponse {
  return { timestamp: 0, totalCount: 0, successCount: 0, failCount: 0, avgTime: 0, maxTime: 0, minTime: 0, successRate: 0, qps: 0, jobId: 0, state: 0, message: "" };
}

export const MonitorResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): MonitorResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonitorResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 8) break; message.timestamp = reader.int64() as unknown as number; continue;
        case 2: if (tag !== 16) break; message.totalCount = reader.int32(); continue;
        case 3: if (tag !== 24) break; message.successCount = reader.int32(); continue;
        case 4: if (tag !== 32) break; message.failCount = reader.int32(); continue;
        case 5: if (tag !== 40) break; message.avgTime = reader.int64() as unknown as number; continue;
        case 6: if (tag !== 48) break; message.maxTime = reader.int64() as unknown as number; continue;
        case 7: if (tag !== 56) break; message.minTime = reader.int64() as unknown as number; continue;
        case 8: if (tag !== 65) break; message.successRate = reader.double(); continue;
        case 9: if (tag !== 73) break; message.qps = reader.double(); continue;
        case 10: if (tag !== 80) break; message.jobId = reader.int32(); continue;
        case 11: if (tag !== 88) break; message.state = reader.int32(); continue;
        case 12: if (tag !== 98) break; message.message = reader.string(); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
