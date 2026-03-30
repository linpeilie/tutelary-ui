/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { ClassLoaderNode } from "../domain/ClassLoaderNode";

export const protobufPackage = "";

export interface ClassLoaderTreeResponse {
  classLoaders: ClassLoaderNode[];
  jobId: number;
  state: number;
  message: string;
}

function createBaseClassLoaderTreeResponse(): ClassLoaderTreeResponse {
  return { classLoaders: [], jobId: 0, state: 0, message: "" };
}

export const ClassLoaderTreeResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): ClassLoaderTreeResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClassLoaderTreeResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 10) break; message.classLoaders.push(ClassLoaderNode.decode(reader, reader.uint32())); continue;
        case 2: if (tag !== 16) break; message.jobId = reader.int32(); continue;
        case 3: if (tag !== 24) break; message.state = reader.int32(); continue;
        case 4: if (tag !== 34) break; message.message = reader.string(); continue;
      }
      if ((tag & 7) === 4 || tag === 0) break;
      reader.skipType(tag & 7);
    }
    return message;
  },
};
