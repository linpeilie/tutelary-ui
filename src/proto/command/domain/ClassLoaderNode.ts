/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface ClassLoaderNode {
  id: string;
  name: string;
  type: string;
  classCount: number;
  children: ClassLoaderNode[];
  classes: string[];
}

function createBaseClassLoaderNode(): ClassLoaderNode {
  return { id: "", name: "", type: "", classCount: 0, children: [], classes: [] };
}

export const ClassLoaderNode = {
  decode(input: _m0.Reader | Uint8Array, length?: number): ClassLoaderNode {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClassLoaderNode();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 10) break; message.id = reader.string(); continue;
        case 2: if (tag !== 18) break; message.name = reader.string(); continue;
        case 3: if (tag !== 26) break; message.type = reader.string(); continue;
        case 4: if (tag !== 32) break; message.classCount = reader.int32(); continue;
        case 5: if (tag !== 42) break; message.children.push(ClassLoaderNode.decode(reader, reader.uint32())); continue;
        case 6: if (tag !== 50) break; message.classes.push(reader.string()); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
