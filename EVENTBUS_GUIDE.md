# EventBus 使用指南

## 📋 问题分析

原 EventBus 实现存在以下问题：

### 1. ❌ 缺少一次性监听器
- **问题**: 无法订阅只执行一次的事件
- **影响**: 需要手动管理临时监听器的添加和删除

### 2. ❌ 没有集成到 WebSocket
- **问题**: EventBus 创建了但没有使用
- **影响**: 组件无法订阅 WebSocket 消息

### 3. ❌ 类型定义不完善
- **问题**: 只定义了 `command` 事件
- **影响**: 无法监听连接状态、错误等事件

### 4. ❌ 缺少内存泄漏保护
- **问题**: 无限制添加监听器
- **影响**: 可能导致内存泄漏

### 5. ❌ 没有错误处理
- **问题**: handler 抛出异常会中断其他 handler
- **影响**: 一个监听器出错会影响其他监听器

---

## ✅ 解决方案

### 1. EventBus 核心改进

#### 添加 `once` 方法
```typescript
// ✅ 支持一次性监听
eventBus.once('ws:connected', () => {
  console.log('首次连接成功');
});
```

#### 内存泄漏保护
```typescript
// ✅ 默认最大 100 个监听器，超出会警告
eventBus.setMaxListeners(200); // 可调整
```

#### 错误处理
```typescript
// ✅ 单个 handler 出错不影响其他 handler
eventBus.on('ws:message', (data) => {
  throw new Error('测试错误'); // 会被捕获并打印，不影响其他监听器
});
```

### 2. 完善的事件类型

```typescript
export interface GlobalEvents {
  // WebSocket 事件
  'ws:connected': void;
  'ws:disconnected': void;
  'ws:error': Error;
  'ws:reconnecting': number;
  'ws:status-change': WebSocketStatusEnum;
  'ws:message': CommandExecuteResponse<any>;

  // 命令事件（按 taskId 前缀分类）
  'command:jvm-memory': CommandExecuteResponse<any>;
  'command:thread-list': CommandExecuteResponse<any>;
  'command:thread-detail': CommandExecuteResponse<any>;
  'command:logger-info': CommandExecuteResponse<any>;
  'command:vm-option': CommandExecuteResponse<any>;
  // ... 更多命令类型
}
```

### 3. WebSocket Store 集成

WebSocket Store 会在以下时机触发事件：

```typescript
// 连接成功
eventBus.emit('ws:connected', undefined);

// 连接错误
eventBus.emit('ws:error', new Error('连接异常'));

// 收到消息
eventBus.emit('ws:message', response);

// 根据 taskId 触发具体命令事件
if (taskId.startsWith('jvm-memory')) {
  eventBus.emit('command:jvm-memory', response);
}
```

---

## 📖 使用示例

### 基础用法

```typescript
import eventBus from '@/utils/eventbus';

// 订阅事件
const handler = (response) => {
  console.log('收到 JVM 内存信息:', response);
};
eventBus.on('command:jvm-memory', handler);

// 触发事件（通常在 WebSocket Store 中自动触发）
eventBus.emit('command:jvm-memory', response);

// 取消订阅
eventBus.off('command:jvm-memory', handler);
```

### 一次性监听

```typescript
// 只监听一次，触发后自动取消订阅
eventBus.once('ws:connected', () => {
  console.log('WebSocket 首次连接成功');
  // 这个回调只会执行一次
});
```

### 在 Vue 组件中使用

#### 方式 1: 手动管理（推荐用于简单场景）

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';

// 定义处理函数
const handleJvmMemory = (response: CommandExecuteResponse<any>) => {
  console.log('JVM 内存更新:', response);
  // 处理数据...
};

onMounted(() => {
  // 订阅事件
  eventBus.on('command:jvm-memory', handleJvmMemory);
});

onUnmounted(() => {
  // 取消订阅（重要！防止内存泄漏）
  eventBus.off('command:jvm-memory', handleJvmMemory);
});
</script>
```

#### 方式 2: 使用 Composable（推荐用于复用）

```vue
<script setup lang="ts">
import { useJvmMemory, useWebSocketStatus } from '@/composables/useEventBus';

// 监听 WebSocket 连接状态
useWebSocketStatus();

// 监听 JVM 内存信息
useJvmMemory((response) => {
  console.log('JVM 内存:', response);
});
</script>
```

### 高级用法

#### 监听所有 WebSocket 消息

```typescript
import { useWebSocketMessages } from '@/composables/useEventBus';

useWebSocketMessages((response) => {
  console.log('收到任何 WebSocket 消息:', response);

  // 可以在这里做通用处理，如日志记录
  if (!response.status) {
    console.error('命令执行失败:', response.message);
  }
});
```

#### 通用事件监听 Hook

```typescript
import { useEventListener } from '@/composables/useEventBus';

// 普通监听
const { unsubscribe } = useEventListener('command:thread-list', (response) => {
  console.log('线程列表:', response);
});

// 手动取消订阅（如果需要）
// unsubscribe();

// 一次性监听
useEventListener('ws:connected', () => {
  console.log('连接成功');
}, { once: true });
```

---

## 🎯 实际应用场景

### 场景 1: JVM 监控页面

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useJvmMemory } from '@/composables/useEventBus';
import { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse';

const memoryData = ref<any>(null);

useJvmMemory((response) => {
  if (response.data && response.data.value) {
    // 解码 JVM 内存数据
    const jvmMemory = JvmMemoryResponse.decode(response.data.value);
    memoryData.value = jvmMemory;
  }
});

// 发送获取内存信息的请求
const refreshMemory = () => {
  const wsStore = useWebSocketStore();
  wsStore.sendMessage(/* ... */);
};
</script>
```

### 场景 2: 全局错误提示

```typescript
// 在 App.vue 或全局插件中
import { useEventListener } from '@/composables/useEventBus';

useEventListener('ws:error', (error) => {
  // 全局错误处理
  window.$notification?.error({
    title: 'WebSocket 错误',
    content: error.message,
    duration: 5000
  });
});

useEventListener('ws:message', (response) => {
  // 统一处理失败响应
  if (!response.status && response.message) {
    window.$message?.error(response.message);
  }
});
```

### 场景 3: 命令执行状态跟踪

```typescript
import { ref } from 'vue';
import { useCommandOnce } from '@/composables/useEventBus';

const isLoading = ref(false);

const executeCommand = () => {
  isLoading.value = true;

  // 一次性监听命令响应
  useCommandOnce('command:heap-dump', (response) => {
    isLoading.value = false;
    console.log('Heap Dump 完成:', response);
  });

  // 发送命令
  wsStore.sendMessage(/* ... */);
};
```

---

## 🛠️ API 参考

### EventBus 方法

#### `on<EventName>(name, handler)`
订阅事件，可重复触发

```typescript
eventBus.on('ws:connected', () => {
  console.log('连接成功');
});
```

#### `once<EventName>(name, handler)`
订阅一次性事件，触发后自动取消

```typescript
eventBus.once('ws:connected', () => {
  console.log('首次连接');
});
```

#### `emit<EventName>(name, value)`
触发事件

```typescript
eventBus.emit('ws:message', response);
```

#### `off()`
清除所有事件

```typescript
eventBus.off();
```

#### `off<EventName>(name)`
清除指定名称的所有监听器

```typescript
eventBus.off('ws:connected');
```

#### `off<EventName>(name, handler)`
清除指定的监听器

```typescript
eventBus.off('ws:connected', myHandler);
```

#### `setMaxListeners(n)`
设置单个事件的最大监听器数量

```typescript
eventBus.setMaxListeners(200);
```

#### `listenerCount(name)`
获取指定事件的监听器数量

```typescript
const count = eventBus.listenerCount('ws:message');
console.log(`ws:message 有 ${count} 个监听器`);
```

#### `eventNames()`
获取所有已注册的事件名

```typescript
const names = eventBus.eventNames();
console.log('已注册事件:', names);
```

---

## ⚠️ 注意事项

### 1. 防止内存泄漏

**❌ 错误示例**
```typescript
// 没有在 onUnmounted 中取消订阅
onMounted(() => {
  eventBus.on('ws:message', handler);
  // ❌ 忘记取消订阅
});
```

**✅ 正确示例**
```typescript
onMounted(() => {
  eventBus.on('ws:message', handler);
});

onUnmounted(() => {
  eventBus.off('ws:message', handler); // ✅ 正确取消订阅
});
```

### 2. Handler 函数引用

**❌ 错误示例**
```typescript
onMounted(() => {
  // 每次都是新函数，无法正确取消订阅
  eventBus.on('ws:message', (data) => console.log(data));
});

onUnmounted(() => {
  // ❌ 无法取消订阅（函数引用不同）
  eventBus.off('ws:message', (data) => console.log(data));
});
```

**✅ 正确示例**
```typescript
// 使用固定的函数引用
const handler = (data) => console.log(data);

onMounted(() => {
  eventBus.on('ws:message', handler);
});

onUnmounted(() => {
  eventBus.off('ws:message', handler); // ✅ 正确取消
});
```

### 3. 使用 `once` 不需要手动取消

```typescript
// ✅ once 会自动取消订阅
onMounted(() => {
  eventBus.once('ws:connected', () => {
    console.log('连接成功');
  });
});

// ❌ 不需要在 onUnmounted 中取消
```

### 4. 错误处理

监听器中的错误会被自动捕获，不会影响其他监听器：

```typescript
eventBus.on('ws:message', () => {
  throw new Error('测试错误');
  // 错误会被捕获并打印，不影响其他监听器
});

eventBus.on('ws:message', () => {
  console.log('这个监听器仍然会执行');
});
```

---

## 🔍 调试技巧

### 查看当前订阅情况

```typescript
// 查看所有事件名
console.log('已注册事件:', eventBus.eventNames());

// 查看特定事件的监听器数量
console.log('ws:message 监听器数量:', eventBus.listenerCount('ws:message'));
```

### 监控内存泄漏

```typescript
// 在开发环境中定期检查
if (import.meta.env.DEV) {
  setInterval(() => {
    const names = eventBus.eventNames();
    names.forEach(name => {
      const count = eventBus.listenerCount(name);
      if (count > 10) {
        console.warn(`[EventBus] 事件 "${String(name)}" 有 ${count} 个监听器`);
      }
    });
  }, 10000);
}
```

---

## 📚 参考资源

- [Node.js EventEmitter](https://nodejs.org/api/events.html)
- [Vue 3 组件通信](https://cn.vuejs.org/guide/components/events.html)
- [防止内存泄漏最佳实践](https://cn.vuejs.org/guide/best-practices/performance.html)
