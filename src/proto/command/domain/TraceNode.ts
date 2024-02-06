/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

/**  */
export interface TraceNode {
  className: string;
  methodName: string;
  line: number;
  isThrow: boolean;
  mark: string;
  beginTimestamp: number;
  endTimestamp: number;
  count: number;
  children: TraceNode[];
}

function createBaseTraceNode(): TraceNode {
  return {
    className: "",
    methodName: "",
    line: 0,
    isThrow: false,
    mark: "",
    beginTimestamp: 0,
    endTimestamp: 0,
    count: 0,
    children: [],
  };
}

export const TraceNode = {
  encode(message: TraceNode, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.className !== "") {
      writer.uint32(10).string(message.className);
    }
    if (message.methodName !== "") {
      writer.uint32(18).string(message.methodName);
    }
    if (message.line !== 0) {
      writer.uint32(24).int32(message.line);
    }
    if (message.isThrow === true) {
      writer.uint32(32).bool(message.isThrow);
    }
    if (message.mark !== "") {
      writer.uint32(42).string(message.mark);
    }
    if (message.beginTimestamp !== 0) {
      writer.uint32(48).int64(message.beginTimestamp);
    }
    if (message.endTimestamp !== 0) {
      writer.uint32(56).int64(message.endTimestamp);
    }
    if (message.count !== 0) {
      writer.uint32(64).int32(message.count);
    }
    for (const v of message.children) {
      TraceNode.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TraceNode {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTraceNode();
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

          message.line = reader.int32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.isThrow = reader.bool();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.mark = reader.string();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.beginTimestamp = longToNumber(reader.int64() as Long);
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.endTimestamp = longToNumber(reader.int64() as Long);
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.count = reader.int32();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.children.push(TraceNode.decode(reader, reader.uint32()));
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
