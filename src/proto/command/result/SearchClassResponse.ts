/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { ClassInfo } from "../domain/ClassInfo";

export const protobufPackage = "";

export interface SearchClassResponse {
  classes: ClassInfo[];
  jobId: number;
  state: number;
  message: string;
}

function createBaseSearchClassResponse(): SearchClassResponse {
  return { classes: [], jobId: 0, state: 0, message: "" };
}

export const SearchClassResponse = {
  decode(input: _m0.Reader | Uint8Array, length?: number): SearchClassResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSearchClassResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: if (tag !== 10) break; message.classes.push(ClassInfo.decode(reader, reader.uint32())); continue;
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
