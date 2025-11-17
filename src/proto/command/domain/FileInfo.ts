/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/**  */
export interface FileInfo {
  fileName: string
  filePath: string
  fileSize: string
  lastModifiedTime: number
}

function createBaseFileInfo(): FileInfo {
  return { fileName: '', filePath: '', fileSize: '', lastModifiedTime: 0 }
}

export const FileInfo = {
  encode(message: FileInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fileName !== '')
      writer.uint32(10).string(message.fileName)

    if (message.filePath !== '')
      writer.uint32(18).string(message.filePath)

    if (message.fileSize !== '')
      writer.uint32(26).string(message.fileSize)

    if (message.lastModifiedTime !== 0)
      writer.uint32(32).int64(message.lastModifiedTime)

    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    const end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseFileInfo()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10)
            break

          message.fileName = reader.string()
          continue
        case 2:
          if (tag !== 18)
            break

          message.filePath = reader.string()
          continue
        case 3:
          if (tag !== 26)
            break

          message.fileSize = reader.string()
          continue
        case 4:
          if (tag !== 32)
            break

          message.lastModifiedTime = longToNumber(reader.int64() as Long)
          continue
      }
      if ((tag & 7) === 4 || tag === 0)
        break

      reader.skipType(tag & 7)
    }
    return message
  },
}

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER))
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER')

  return long.toNumber()
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any
  _m0.configure()
}
