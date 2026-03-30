/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface MethodInfo {
  name: string;
  modifiers: string;
  returnType: string;
  parameters: string;
  exceptions: string[];
}

function createBaseMethodInfo(): MethodInfo {
  return { name: "", modifiers: "", returnType: "", parameters: "", exceptions: [] };
}

export const MethodInfo = {
  decode(input: _m0.Reader | Uint8Array, length?: number): MethodInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMethodInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 10) break; message.name = reader.string(); continue;
        case 2: if (tag !== 18) break; message.modifiers = reader.string(); continue;
        case 3: if (tag !== 26) break; message.returnType = reader.string(); continue;
        case 4: if (tag !== 34) break; message.parameters = reader.string(); continue;
        case 5: if (tag !== 42) break; message.exceptions.push(reader.string()); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
