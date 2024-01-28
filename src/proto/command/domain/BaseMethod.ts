/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

/**  */
export interface BaseMethod {
  classLoader: string;
  className: string;
  methodName: string;
  methodDesc: string;
}

function createBaseBaseMethod(): BaseMethod {
  return { classLoader: "", className: "", methodName: "", methodDesc: "" };
}

export const BaseMethod = {
  encode(message: BaseMethod, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classLoader !== "") {
      writer.uint32(10).string(message.classLoader);
    }
    if (message.className !== "") {
      writer.uint32(18).string(message.className);
    }
    if (message.methodName !== "") {
      writer.uint32(26).string(message.methodName);
    }
    if (message.methodDesc !== "") {
      writer.uint32(34).string(message.methodDesc);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BaseMethod {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBaseMethod();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.classLoader = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.className = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.methodName = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.methodDesc = reader.string();
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
