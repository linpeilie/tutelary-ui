import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface FileDownloadRequest {
  filePath: string
  identifier: string
}

function createBaseFileDownloadRequest(): FileDownloadRequest {
  return { filePath: '', identifier: '' }
}

export const FileDownloadRequest = {
  encode(message: FileDownloadRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.filePath !== '')
      writer.uint32(10).string(message.filePath)

    if (message.identifier !== '')
      writer.uint32(18).string(message.identifier)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileDownloadRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseFileDownloadRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.filePath = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.identifier = reader.string()
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}
