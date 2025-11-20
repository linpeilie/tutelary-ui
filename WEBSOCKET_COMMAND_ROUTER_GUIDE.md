# WebSocket 命令路由使用指南

## 概述

WebSocket 命令路由实现了基于配置驱动的命令分发机制，将命令码和事件名称的映射关系抽取到独立的配置文件中，实现了更好的解耦和可维护性。

## 架构设计

### 核心组件

1. **命令路由配置** (`command-router.ts`)
   - 定义命令码到事件名称的映射关系
   - 提供快速查找的工具函数
   - 支持命令描述（便于调试和文档化）

2. **WebSocket Store** (`index.ts`)
   - 使用配置驱动的方式分发命令
   - 自动触发对应的事件
   - 统一的错误处理

3. **事件总线** (`eventbus/index.ts`)
   - 定义所有事件的类型
   - 提供类型安全的事件订阅和发布

## 工作流程

```
WebSocket 消息接收
    ↓
解析 protobuf
    ↓
获取命令码 (commandCode)
    ↓
查找命令路由配置 (command-router)
    ↓
触发对应的事件 (eventBus.emit)
    ↓
组件监听并处理事件
```

## 使用方法

### 1. 添加新命令

当需要支持新的命令时，只需要在配置文件中添加映射关系：

```typescript
// src/store/modules/websocket/command-router.ts

export const commandRouterConfig: CommandEventMapping[] = [
  // ... 其他配置

  // 添加新命令
  {
    code: commandEnum.NEW_COMMAND.value as number,
    eventName: 'command:new-command',
    description: '新命令描述'
  }
];
```

### 2. 注册事件类型

在 `GlobalEvents` 接口中添加事件类型定义：

```typescript
// src/utils/eventbus/index.ts

export interface GlobalEvents {
  // ... 其他事件

  // 添加新事件
  'command:new-command': CommandExecuteResponse<YourDataType>;
}
```

### 3. 监听命令响应

在组件或 composable 中监听对应的事件：

```typescript
import { onMounted, onUnmounted } from 'vue';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';

// 在组件中监听
onMounted(() => {
  // 监听特定命令
  eventBus.on('command:new-command', handleNewCommand);

  // 或者监听所有命令响应
  eventBus.on('command:response', handleAllCommands);

  // 或者监听未知命令（用于调试）
  eventBus.on('command:unknown', handleUnknownCommand);
});

onUnmounted(() => {
  // 记得清理监听器
  eventBus.off('command:new-command', handleNewCommand);
});

function handleNewCommand(response: CommandExecuteResponse<YourDataType>) {
  console.log('收到新命令响应:', response);
  // 处理业务逻辑
}
```

### 4. 发送命令

使用 WebSocket Store 发送命令：

```typescript
import { useWebSocketStore } from '@/store/modules/websocket';

const wsStore = useWebSocketStore();

// 发送命令
wsStore.sendMessage(yourCommandData, YourCommandEncoder);
```

## 最佳实践

### 1. 命令事件命名规范

- 使用 `command:` 前缀标识命令相关事件
- 使用小写字母和连字符分隔：`command:resource-action`
- 例如：
  - `command:thread-list` - 线程列表
  - `command:heap-dump` - 堆转储
  - `command:logger-info` - 日志信息

### 2. 事件监听管理

```typescript
import { useEventBus } from '@/composables/useEventBus';

// 推荐：使用 composable 自动管理生命周期
const { on } = useEventBus();

on('command:new-command', (response) => {
  // 处理逻辑
});
// 组件卸载时会自动清理监听器
```

### 3. 类型安全

利用 TypeScript 的类型推导，确保类型安全：

```typescript
// GlobalEvents 接口中定义具体的数据类型
export interface GlobalEvents {
  'command:thread-list': CommandExecuteResponse<ThreadListData>;
  'command:thread-detail': CommandExecuteResponse<ThreadDetailData>;
}

// 监听时会有完整的类型提示
eventBus.on('command:thread-list', (response) => {
  // response.data 的类型是 ThreadListData，有完整的类型提示
  const threads = response.data.threads;
});
```

### 4. 调试技巧

```typescript
// 监听所有命令响应，用于调试
eventBus.on('command:response', (response) => {
  console.log('[调试] 收到命令响应:', {
    code: response.code,
    taskId: response.taskId,
    status: response.status,
    data: response.data
  });
});

// 监听未知命令
eventBus.on('command:unknown', (response) => {
  console.warn('[警告] 收到未注册的命令码:', response.code);
});
```

## 优势

### 1. 高内聚低耦合
- 命令路由配置独立于业务逻辑
- 添加新命令无需修改分发逻辑
- 组件只需关注自己感兴趣的事件

### 2. 易于维护
- 所有命令映射关系在一个地方管理
- 命令和事件的对应关系一目了然
- 支持添加描述信息，便于理解

### 3. 类型安全
- TypeScript 类型检查
- 事件名称和数据类型都有类型提示
- 编译时就能发现错误

### 4. 灵活扩展
- 支持多个组件监听同一个命令
- 支持监听特定命令或所有命令
- 支持命令前置/后置处理

## 示例场景

### 场景 1：多个组件监听同一个命令

```typescript
// 组件 A: 更新数据
eventBus.on('command:thread-list', (response) => {
  threadList.value = response.data.threads;
});

// 组件 B: 显示通知
eventBus.on('command:thread-list', (response) => {
  window.$message?.success(`已加载 ${response.data.threads.length} 个线程`);
});

// 组件 C: 记录日志
eventBus.on('command:thread-list', (response) => {
  console.log('线程列表已更新:', response.data);
});
```

### 场景 2：统一错误处理

```typescript
// 全局错误处理
eventBus.on('command:response', (response) => {
  if (!response.status) {
    // 统一的错误处理逻辑
    handleCommandError(response);
  }
});

// 特定命令的成功处理
eventBus.on('command:thread-list', (response) => {
  if (response.status) {
    // 只处理成功的情况
    updateThreadList(response.data);
  }
});
```

### 场景 3：命令执行进度追踪

```typescript
// 记录命令开始时间
const commandStartTime = new Map<string, number>();

eventBus.on('command:response', (response) => {
  const startTime = commandStartTime.get(response.taskId);
  if (startTime) {
    const duration = Date.now() - startTime;
    console.log(`命令 ${response.taskId} 执行耗时: ${duration}ms`);
    commandStartTime.delete(response.taskId);
  }
});

// 发送命令前记录时间
function sendCommand(data: any) {
  const taskId = generateTaskId();
  commandStartTime.set(taskId, Date.now());
  wsStore.sendMessage(data, Encoder);
}
```

## 总结

通过配置驱动的命令路由设计，我们实现了：

- ✅ **解耦**：命令映射与业务逻辑分离
- ✅ **可维护**：集中管理所有命令配置
- ✅ **可扩展**：轻松添加新命令
- ✅ **类型安全**：完整的 TypeScript 支持
- ✅ **易调试**：清晰的命令流转日志

这种设计模式适用于任何需要根据消息类型进行分发的场景，不仅限于 WebSocket。

