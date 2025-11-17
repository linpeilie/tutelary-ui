/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { HostInfo } from "../domain/HostInfo";
import { JvmInfo } from "../domain/JvmInfo";

export const protobufPackage = "";

/**  */
export interface SystemInfoResponse {
  jvm: JvmInfo | undefined;
  host: HostInfo | undefined;
  jobId: number;
  state: number;
  message: string;
}

function createBaseSystemInfoResponse(): SystemInfoResponse {
  return { jvm: undefined, host: undefined, jobId: 0, state: 0, message: "" };
}

export const SystemInfoResponse = {
  encode(message: SystemInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.jvm !== undefined) {
      JvmInfo.encode(message.jvm, writer.uint32(10).fork()).ldelim();
    }
    if (message.host !== undefined) {
      HostInfo.encode(message.host, writer.uint32(18).fork()).ldelim();
    }
    if (message.jobId !== 0) {
      writer.uint32(24).int32(message.jobId);
    }
    if (message.state !== 0) {
      writer.uint32(32).int32(message.state);
    }
    if (message.message !== "") {
      writer.uint32(42).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SystemInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSystemInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.jvm = JvmInfo.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.host = HostInfo.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.jobId = reader.int32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.state = reader.int32();
          continue;
        case 5:
          if (tag !== 42) {
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
