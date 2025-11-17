/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

/**  */
export interface BaseThreadInfo {
  id: number;
  name: string;
  group: string;
  priority: number;
  state: string;
  cpu: number;
  daemon: boolean;
}

function createBaseBaseThreadInfo(): BaseThreadInfo {
  return { id: 0, name: "", group: "", priority: 0, state: "", cpu: 0, daemon: false };
}

export const BaseThreadInfo = {
  encode(message: BaseThreadInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0) {
      writer.uint32(8).int64(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.group !== "") {
      writer.uint32(26).string(message.group);
    }
    if (message.priority !== 0) {
      writer.uint32(32).int32(message.priority);
    }
    if (message.state !== "") {
      writer.uint32(42).string(message.state);
    }
    if (message.cpu !== 0) {
      writer.uint32(49).double(message.cpu);
    }
    if (message.daemon === true) {
      writer.uint32(56).bool(message.daemon);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BaseThreadInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBaseThreadInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.id = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.group = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.priority = reader.int32();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.state = reader.string();
          continue;
        case 6:
          if (tag !== 49) {
            break;
          }

          message.cpu = reader.double();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.daemon = reader.bool();
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
