# Protobuf WebSocket 适配指南

## 📋 问题分析

原实现存在以下问题:

### 1. ❌ 数据格式不匹配
- **问题**: WebSocket 使用 JSON 文本格式
- **应该**: Protobuf 使用二进制格式 (Uint8Array/ArrayBuffer)

### 2. ❌ WebSocket binaryType 未设置
- **问题**: 默认接收 Blob 类型
- **应该**: 设置为 `arraybuffer` 接收二进制数据

### 3. ❌ 发送数据未编码
- **问题**: 直接发送 JSON 对象
- **应该**: 使用 protobuf 编码器编码为 Uint8Array

### 4. ❌ 缺少类型反序列化
- **问题**: `CommandExecuteResponse.data` 是 `Any` 类型,未二次解码
- **应该**: 根据具体类型使用对应的解码器

---

## ✅ 解决方案

### 1. WebSocket 二进制模式设置

已在 `src/utils/ws/WebSocketBean.ts` 中添加:

```typescript
// 创建连接
this.websocket = new WebSocket(currentParam.url);

// ✅ 设置二进制数据类型为 ArrayBuffer (用于 protobuf)
this.websocket.binaryType = 'arraybuffer';
```

### 2. 消息接收处理

已在 `src/store/modules/websocket/index.ts` 中修改:

```typescript
onMessage: (ev: MessageEvent) => {
  // 处理二进制消息 (protobuf)
  handleMessage(ev.data);
}

function handleMessage(data: ArrayBuffer | string) {
  // 兼容文本消息 (心跳等)
  if (typeof data === 'string') {
    console.log('[WebSocket] 收到文本消息:', data);
    return;
  }

  // ✅ 解析 protobuf 二进制数据
  const uint8Array = new Uint8Array(data as ArrayBuffer);
  const response = CommandExecuteResponse.decode(uint8Array);

  // 处理响应
  if (!response.status) {
    window.$message?.error(response.message || '操作失败');
    return;
  }

  // 根据业务需要解码 data 字段
  if (response.data) {
    handleResponseData(response);
  }
}
```

### 3. 消息发送处理

提供两种发送方法:

```typescript
// ✅ 方法1: 发送 protobuf 消息 (推荐)
function sendMessage<T>(
  data: T,
  encoder: { encode: (message: T) => { finish: () => Uint8Array } },
  resend = false
) {
  try {
    // 编码为 protobuf 二进制
    const uint8Array = encoder.encode(data).finish();
    return wsInstance.value.send(uint8Array, resend);
  } catch (error) {
    console.error('[WebSocket] 编码消息失败:', error);
    return false;
  }
}

// ✅ 方法2: 发送原始数据 (心跳等场景)
function sendRaw(data: string | ArrayBufferLike | Blob | ArrayBufferView, resend = false) {
  return wsInstance.value.send(data, resend);
}
```

### 4. Any 类型解码

处理 `CommandExecuteResponse.data` 的 `Any` 类型:

```typescript
/**
 * 解码 Any 类型数据
 */
function decodeResponseData<T>(
  response: CommandExecuteResponse<any>,
  decoder: { decode: (input: Uint8Array) => T }
): T | null {
  if (!response.data || !response.data.value) {
    return null;
  }

  try {
    return decoder.decode(response.data.value);
  } catch (error) {
    console.error('[Protobuf] 解码失败:', error);
    return null;
  }
}

// 使用示例
const jvmMemory = decodeResponseData(response, JvmMemoryResponse);
```

---

## 📖 使用示例

### 发送请求

```typescript
import { useWebSocketStore } from '@/store/modules/websocket';
import { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import { ThreadListRequest } from '@/proto/command/param/ThreadListRequest';
import { Metadata } from '@/proto/Metadata';
import { getToken } from '@/store/modules/auth/shared';

function sendThreadListRequest() {
  const wsStore = useWebSocketStore();

  // 1. 构造请求参数
  const threadListReq: ThreadListRequest = {};

  // 2. 构造元数据
  const metadata: Metadata = {
    token: getToken() || ''
  };

  // 3. 序列化请求参数为 Any
  const requestData = ThreadListRequest.encode(threadListReq).finish();

  // 4. 构造完整请求
  const request: CommandExecuteResponse<any> = {
    taskId: `thread-list-${Date.now()}`,
    code: 0,
    timestamp: Date.now(),
    data: {
      typeUrl: 'ThreadListRequest',
      value: requestData
    },
    status: true,
    message: 'Get Thread List',
    metadata
  };

  // 5. 发送 protobuf 消息
  wsStore.sendMessage(request, CommandExecuteResponse);
}
```

### 接收响应

在 `src/store/modules/websocket/index.ts` 的 `handleResponseData` 中:

```typescript
import { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse';
import { ThreadList } from '@/proto/command/result/ThreadList';

function handleResponseData(response: CommandExecuteResponse<any>) {
  try {
    // 根据 taskId 或其他字段判断具体类型
    if (response.taskId.startsWith('jvm-memory')) {
      const jvmMemory = JvmMemoryResponse.decode(response.data.value);
      console.log('JVM 内存:', jvmMemory);
      // 触发业务逻辑

    } else if (response.taskId.startsWith('thread-list')) {
      const threadList = ThreadList.decode(response.data.value);
      console.log('线程列表:', threadList);
      // 更新 store 等
    }
  } catch (error) {
    console.error('[Protobuf] 解码数据失败:', error);
  }
}
```

---

## 🎯 实现细节

### 消息流程

```
发送流程:
1. 构造 protobuf 消息对象
2. CommandExecuteResponse.encode(message).finish() → Uint8Array
3. WebSocket.send(uint8Array)

接收流程:
1. WebSocket.onmessage → ArrayBuffer
2. new Uint8Array(arrayBuffer)
3. CommandExecuteResponse.decode(uint8Array)
4. 根据 data.typeUrl 选择解码器
5. Decoder.decode(response.data.value)
```

### 类型映射

```typescript
// protobuf Any 类型结构
interface Any {
  typeUrl: string;    // 类型标识,如 "ThreadListRequest"
  value: Uint8Array;  // 实际数据的二进制
}

// 使用示例
const any: Any = {
  typeUrl: 'JvmMemoryResponse',
  value: JvmMemoryResponse.encode(data).finish()
};
```

---

## 🔧 配置调整

### ESLint 配置

已在 `eslint.config.js` 中忽略 protobuf 自动生成的代码:

```javascript
{
  ignores: ['src/proto/**/*.ts']
}
```

### TypeScript 配置

确保 `tsconfig.json` 包含:

```json
{
  "compilerOptions": {
    "skipLibCheck": true  // 跳过 protobufjs 的类型检查
  }
}
```

---

## 📝 注意事项

1. **心跳消息**: 如果心跳使用文本格式 (如 'ping'/'pong'),已兼容处理
2. **错误处理**: 所有 encode/decode 都包含 try-catch
3. **类型安全**: 使用 TypeScript 泛型确保类型正确
4. **性能优化**: 二进制传输比 JSON 更高效
5. **向后兼容**: 保留了 `sendRaw` 方法用于发送原始数据

---

## 🚀 测试建议

1. 测试心跳连接 (文本格式)
2. 测试 protobuf 消息发送
3. 测试 protobuf 消息接收
4. 测试错误消息处理 (status: false)
5. 测试断线重连后消息重发

---

## 📚 参考文档

- [protobufjs 文档](https://github.com/protobufjs/protobuf.js)
- [WebSocket binaryType](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType)
- [ArrayBuffer 和 Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
