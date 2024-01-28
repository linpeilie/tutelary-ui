import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface FileListRequest {
  type: number
  pageIndex: number
  pageSize: number
}

function createBaseFileListRequest(): FileListRequest {
  return { type: 0, pageIndex: 0, pageSize: 0 }
}

export const FileListRequest = {
  encode(message: FileListRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0)
      writer.uint32(8).int32(message.type)

    if (message.pageIndex !== 0)
      writer.uint32(16).int32(message.pageIndex)

    if (message.pageSize !== 0)
      writer.uint32(24).int32(message.pageSize)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileListRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseFileListRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8)
            break

          message.type = reader.int32()
          continue
        case 2:
          if (tag !== 16)
            break

          message.pageIndex = reader.int32()
          continue
        case 3:
          if (tag !== 24)
            break

          message.pageSize = reader.int32()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
