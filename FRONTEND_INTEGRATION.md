# 前端对接文档

本文档面向前端联调，汇总当前仓库中已经暴露的 HTTP 接口、命令创建接口、鉴权方式，以及命令回调的 WebSocket 协议。

## 1. 基础约定

- HTTP 接口统一由服务端自动加前缀 `/api`。
- 业务接口全部使用 `POST`。
- 默认示例配置端口为 `9988`，因此本地调试时 HTTP 基础地址通常为 `http://{host}:9988/api`。
- 登录之外的接口默认都受 Sa-Token 登录拦截保护。
- 当前 token 名称配置为 `_tt`。
- 浏览器侧命令回调走 Spring WebSocket：`ws://{host}:{port}/api/ws?_tt={token}`。
- 浏览器 WebSocket 收到的是**二进制 protobuf 消息**，不是 JSON。

## 2. 通用响应格式

### 2.1 HTTP 响应包装 `R<T>`

所有普通 HTTP 接口都返回统一结构：

```json
{
  "code": 1,
  "errorCode": null,
  "message": null,
  "data": {}
}
```

字段说明：

- `code`: `1` 表示成功，`0` 表示失败
- `errorCode`: 失败时的业务错误码
- `message`: 失败时的错误信息
- `data`: 业务数据

### 2.2 分页结构 `PageResult<T>`

分页接口的 `data` 结构为：

```json
{
  "total": 0,
  "records": []
}
```

公共分页入参：

- `pageIndex`: 默认 `1`
- `pageSize`: 默认 `10`

### 2.3 命令回调 WebSocket 消息 `CommandExecuteResponse`

浏览器通过 `/api/ws` 收到的命令回调顶层结构为：

- `status`: 是否成功
- `message`: 错误信息
- `taskId`: 命令任务 ID
- `code`: 命令码
- `timestamp`: 回调时间戳
- `data`: protobuf 编码后的命令结果对象

`data` 的具体类型由 `code` 决定，见下文“命令接口”一节。

命令结果对象自身还带通用字段：

- `state`: `1` 成功，`0` 失败
- `message`: 命令执行失败时的错误信息

## 3. 鉴权联调方式

### 3.1 登录

**POST** `/api/auth/login`

请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

响应体 `data`：

```json
{
  "token": "登录态 token"
}
```

### 3.2 登出

**POST** `/api/auth/logout`

无请求体。

### 3.3 鉴权传递

- HTTP 接口鉴权由 Sa-Token 处理，当前 token 名称是 `_tt`。
- WebSocket 握手时，服务端明确从 query 参数读取 token，因此前端应使用：

```text
ws://{host}:{port}/api/ws?_tt={token}
```

## 4. HTTP 接口总览

## 4.1 认证相关

| 接口 | 说明 | 请求参数 | 返回数据 |
| --- | --- | --- | --- |
| `POST /api/auth/login` | 登录 | `username`, `password` | `LoginResponse` |
| `POST /api/auth/logout` | 登出 | 无 | `null` |

`LoginResponse` 字段：

- `token`

## 4.2 用户相关

| 接口 | 说明 | 请求参数 | 返回数据 |
| --- | --- | --- | --- |
| `POST /api/user/info` | 当前登录用户信息 | 无 | `UserInfoResponse` |
| `POST /api/user/permissions` | 当前登录用户权限列表 | 无 | `PermissionResponse[]` |
| `POST /api/user/add` | 新增用户 | `username`, `nickName`, `phoneNumber`, `password`, `remark` | `null` |
| `POST /api/user/edit` | 编辑用户 | `userId`, `nickName`, `phoneNumber`, `remark` | `null` |
| `POST /api/user/pageQuery` | 用户分页查询 | `username`, `pageIndex`, `pageSize` | `PageResult<UserInfoResponse>` |

`UserInfoResponse` 主要字段：

- `userId`
- `username`
- `nickName`
- `phoneNumber`
- `state`
- `loginIp`
- `loginDate`
- `remark`
- `createTime`
- `updateTime`

`PermissionResponse` 字段：

- `permissionId`
- `permissionName`
- `parentId`
- `permissionType`：`M` 菜单，`R` 资源
- `enableStatus`：`1` 启用，`0` 未启用
- `identification`
- `remark`

## 4.3 角色相关

| 接口 | 说明 | 请求参数 | 返回数据 |
| --- | --- | --- | --- |
| `POST /api/role/add` | 新增角色 | `roleName`, `enableStatus`, `remark` | `null` |
| `POST /api/role/edit` | 编辑角色 | `roleId`, `roleName`, `enableStatus`, `remark` | `null` |
| `POST /api/role/pageQuery` | 角色分页查询 | `roleName`, `enableStatus`, `pageIndex`, `pageSize` | `PageResult<RoleResponse>` |

`RoleResponse` 主要字段：

- `id`
- `roleId`
- `roleName`
- `enableStatus`
- `remark`
- `createUserId`
- `updateUserId`
- `createTime`
- `updateTime`

## 4.4 权限相关

| 接口 | 说明 | 请求参数 | 返回数据 |
| --- | --- | --- | --- |
| `POST /api/permission/add` | 新增权限 | `permissionName`, `parentId`, `permissionType`, `enableStatus`, `identification`, `remark` | `null` |

枚举说明：

- `permissionType`: `M` 菜单，`R` 资源
- `enableStatus`: `1` 启用，`0` 未启用

## 4.5 应用相关

| 接口 | 说明 | 请求参数 | 返回数据 |
| --- | --- | --- | --- |
| `POST /api/app/pageQuery` | 应用分页查询 | `appName`, `pageIndex`, `pageSize` | `PageResult<AppInfoResponse>` |
| `POST /api/app/list` | 应用列表 | `keyword`, `appName` | `AppInfoResponse[]` |
| `POST /api/app/detail?appName={appName}` | 应用详情 | query 参数 `appName` | `AppDetailResponse` |

`AppInfoResponse` 字段：

- `appName`
- `registerDate`
- `instanceNum`

`AppDetailResponse` 在 `AppInfoResponse` 基础上额外包含：

- `instances: InstanceInfoResponse[]`

## 4.6 实例相关

| 接口 | 说明 | 请求参数 | 返回数据 |
| --- | --- | --- | --- |
| `POST /api/instance/pageQuery` | 实例分页查询 | `appName`, `keyword`, `states`, `pageIndex`, `pageSize` | `PageResult<InstanceInfoResponse>` |
| `POST /api/instance/list` | 实例列表 | `keyword`, `appName` | `InstanceInfoResponse[]` |
| `POST /api/instance/listByAppName?appName={appName}` | 按应用名查实例 | query 参数 `appName` | `InstanceInfoResponse[]` |
| `POST /api/instance/detail?instanceId={instanceId}` | 实例详情 | query 参数 `instanceId` | `InstanceInfoResponse` |
| `POST /api/instance/statistic/overview` | 实例总览统计 | `instanceId`, `reportStartTime`, `reportEndTime` | `OverviewResponse` |
| `POST /api/instance/statistic/jvm` | JVM 统计 | `instanceId`, `reportStartTime`, `reportEndTime` | `JvmStatisticResponse` |

`InstanceInfoResponse` 主要字段：

- `instanceId`
- `appName`
- `ip`
- `registerDate`
- `state`：`1` 有效，`0` 无效
- `startTime`
- `hostName`
- `osName`
- `arch`
- `availableProcessors`
- `memorySize`
- `vmVendor`
- `vmName`
- `vmVersion`
- `jdkVersion`

`StatisticQueryRequest` 字段：

- `instanceId`
- `reportStartTime`
- `reportEndTime`

`OverviewResponse` 字段：

- `threadStatistic: InstanceThreadStatisticResponse`
- `heapMemory: InstanceJvmMemoryResponse[]`
- `nonHeapMemory: InstanceJvmMemoryResponse[]`
- `garbageCollectors: InstanceGarbageCollectorsResponse[]`

`JvmStatisticResponse` 字段：

- `heapMemory: InstanceJvmMemoryResponse[]`
- `nonHeapMemory: InstanceJvmMemoryResponse[]`
- `garbageCollectors: InstanceGarbageCollectorsResponse[]`

统计返回中，多个数值列表与 `reportTimestamps` 按索引一一对应。

## 5. 命令接口联调

## 5.1 通用流程

除文件下载外，命令接口都是两段式：

1. 调用 HTTP 创建命令，服务端立即返回 `CommandTaskResponse`，其中最关键的是 `taskId`。
2. 前端通过 `/api/ws` 监听命令执行回调，并按 `taskId` 归并结果。

通用创建请求：

```json
{
  "instanceId": "目标实例 ID",
  "param": {}
}
```

通用创建响应 `CommandTaskResponse` 字段：

- `commandCode`
- `instanceId`
- `taskId`
- `param`
- `completeTime`

## 5.2 命令创建接口列表

| HTTP 接口 | commandCode | `param` 类型 | `param` 字段 | WebSocket 回调 `code -> data` |
| --- | --- | --- | --- | --- |
| `POST /api/command/creation/overview` | `200010` | `NoneParamRequest` | 无 | `200010 -> Overview` |
| `POST /api/command/creation/threadList` | `200011` | `ThreadListRequest` | `samplerInterval` | `200011 -> ThreadList` |
| `POST /api/command/creation/threadDetail` | `200012` | `ThreadDetailRequest` | `id` | `200012 -> ThreadDetail` |
| `POST /api/command/creation/heapDump` | `200013` | `HeapDumpRequest` | `live` | `200013 -> HeapDumpResponse` |
| `POST /api/command/creation/fileList` | `200014` | `FileListRequest` | `type`, `pageIndex`, `pageSize` | `200014 -> FileListResponse` |
| `POST /api/command/creation/fileDownload` | `200015` | `FileDownloadRequest` | `filePath` | 当前接口直接返回文件流，不需要前端自己消费 WebSocket 文件分片 |
| `POST /api/command/creation/decompile` | `200016` | `DecompileRequest` | `qualifiedClassName`, `methodName` | `200016 -> DecompileResponse` |
| `POST /api/command/creation/loggerInfo` | `200017` | `LoggerInfoRequest` | `name`, `includeNoAppender`, `classLoaderHashCode` | `200017 -> LoggerInfoResponse` |
| `POST /api/command/creation/updateLoggerLevel` | `200018` | `UpdateLoggerLevelRequest` | `classLoaderHashCode`, `name`, `level` | `200018 -> UpdateLoggerLevelResponse` |
| `POST /api/command/creation/getStatic` | `200019` | `GetStaticRequest` | `qualifiedClassName`, `field`, `classLoader` | `200019 -> GetStaticResponse` |
| `POST /api/command/creation/getVmOption` | `200020` | `VmOptionRequest` | 无 | `200020 -> VmOptionResponse` |
| `POST /api/command/creation/setVmOption` | `200021` | `SetVmOptionRequest` | `name`, `value` | `200021 -> SetVmOptionResponse` |
| `POST /api/command/creation/jvmMemory` | `200022` | `NoneParamRequest` | 无 | `200022 -> JvmMemoryResponse` |
| `POST /api/command/creation/systemInfo` | `200023` | `NoneParamRequest` | 无 | `200023 -> SystemInfoResponse` |
| `POST /api/command/creation/systemMetricsMonitoring` | `200024` | `NoneParamRequest` | 无 | `200024 -> SystemMetricsResponse` |
| `POST /api/command/creation/traceMethod` | `210011` | `TraceRequest` | `qualifiedClassName`, `methodNames`, `times`, `cost` | `210001 -> EnhanceAffect`，`210011 -> TraceResponse`，`210002 -> EnhanceCommandComplete` |
| `POST /api/command/creation/stackMethod` | `210012` | `StackRequest` | `qualifiedClassName`, `methodNames`, `times` | `210001 -> EnhanceAffect`，`210012 -> StackResponse`，`210002 -> EnhanceCommandComplete` |
| `POST /api/command/creation/retransform` | `210013` | `RetransformRequest` | `qualifiedClassName`, `javaSource` | `210013 -> RetransformResponse` |
| `POST /api/command/creation/retransformHistory` | `200034` | `NoneParamRequest` | 无 | `200034 -> RetransformHistoryResponse` |
| `POST /api/command/creation/retransformDetail` | `200035` | `RetransformDetailRequest` | `qualifiedClassName` | `200035 -> RetransformDetailResponse` |
| `POST /api/command/creation/retransformRevert` | `200036` | `RetransformRevertRequest` | `qualifiedClassName` | `200036 -> RetransformRevertResponse` |

补充说明：

- `FileListRequest.type` 目前代码里只看到 `1 = HEAP_DUMP`。
- `traceMethod` / `stackMethod` 属于增强类命令，通常会先收到增强影响范围，再收到实际结果，最后收到完成通知。
- `fileDownload` 控制器会在服务端等待命令执行并直接把文件写回 HTTP 响应，因此前端按普通下载接口对接即可。

## 5.3 常见命令结果结构

### 线程列表 `ThreadList`

- `threadStatistic`: 线程统计信息
- `threads: BaseThreadInfo[]`

`BaseThreadInfo` 主要字段：

- `id`
- `name`
- `group`
- `priority`
- `state`
- `cpu`
- `daemon`

### 线程详情 `ThreadDetail`

- `id`
- `name`
- `threadState`
- `lock`
- `lockName`
- `lockOwnerId`
- `lockOwnerName`
- `stackTrace`

### 反编译结果 `DecompileResponse`

- `qualifiedClassName`
- `methodName`
- `source`

### 日志查询 `LoggerInfoResponse`

- `loggers: LoggerInfo[]`

`LoggerInfo` 主要字段：

- `name`
- `clazz`
- `classLoader`
- `classLoaderHash`
- `level`
- `effectiveLevel`
- `additivity`
- `codeSource`
- `config`
- `appenders`

### 静态字段读取 `GetStaticResponse`

- `value`

### VM 参数相关

`VmOptionResponse`：

- `options: VmOption[]`

`SetVmOptionResponse`：

- `previousVmOption`
- `latestVmOption`

`VmOption` 字段：

- `name`
- `value`
- `writeable`
- `origin`

### JVM 内存 `JvmMemoryResponse`

- `heapMemory`
- `nonHeapMemory`
- `bufferPoolMemory`
- `garbageCollectors`

### 文件列表 `FileListResponse`

- `total`
- `fileList: FileInfo[]`

`FileInfo` 字段：

- `fileName`
- `filePath`
- `fileSize`
- `lastModifiedTime`

### Heap Dump `HeapDumpResponse`

- `dumpFile`

### 系统信息 `SystemInfoResponse`

- `jvm`
- `host`

### 系统指标 `SystemMetricsResponse`

- `cpuMetrics`
- `memoryMetrics`
- `osFileStores`
- `networkMetrics`

### 方法追踪 `TraceResponse`

- `finishTime`
- `node: TraceNode`
- `thread`
- `tccl`
- `currentTimes` — 当前执行次数（第几次捕获）

### 方法堆栈 `StackResponse`

- `className`
- `methodName`
- `startTimestamp`
- `endTimestamp`
- `finishTime`
- `daemon`
- `thread`
- `tccl`
- `stackTraceNodeList`

## 6. 前端联调示例

### 6.1 查询应用分页

**POST** `/api/app/pageQuery`

```json
{
  "appName": "demo-app",
  "pageIndex": 1,
  "pageSize": 10
}
```

### 6.2 查询实例总览统计

**POST** `/api/instance/statistic/overview`

```json
{
  "instanceId": "2ec2bf39480946f29a291a48686c2f04",
  "reportStartTime": "2026-03-23T00:00:00",
  "reportEndTime": "2026-03-23T23:59:59"
}
```

### 6.3 创建线程列表命令

**POST** `/api/command/creation/threadList`

```json
{
  "instanceId": "2ec2bf39480946f29a291a48686c2f04",
  "param": {
    "samplerInterval": 200
  }
}
```

### 6.4 创建方法追踪命令

**POST** `/api/command/creation/traceMethod`

```json
{
  "instanceId": "2ec2bf39480946f29a291a48686c2f04",
  "param": {
    "qualifiedClassName": "com.example.demo.ServiceImpl",
    "methodNames": ["execute"],
    "times": 1,
    "cost": 0
  }
}
```
