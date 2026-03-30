---
name: same-day notes
description: Same-day project notes for active frontend integration and validation context.
type: project
---

2026-03-23: The instance detail thread tab was switched from mock data to backend thread commands in the frontend.
**Why:** The tab had been rendering simulated thread data instead of live instance results.
**How to apply:** When validating or extending thread-related UI work, expect the tab to create `threadList` and `threadDetail` commands and consume WebSocket callbacks rather than local mock state.

2026-03-23: The instance detail `jvm-memory` / `vm-option` / `logger` / `stack` tabs now use backend command flows instead of local mock data.
**Why:** These tabs needed to match the current frontend integration document while keeping existing page layouts for unsupported backend fields.
**How to apply:** When validating or extending these tabs, expect them to create `jvmMemory`, `getVmOption` / `setVmOption`, `loggerInfo` / `updateLoggerLevel`, and `stackMethod` commands and consume WebSocket callbacks; placeholder areas now indicate backend gaps instead of showing fabricated values.

2026-03-23: `pnpm typecheck` is still blocked by unrelated baseline TypeScript errors outside the JVM tab changes.
**Why:** Remaining repo-level errors are currently in `src/composables/useProtobufWebSocket.ts`, `src/proto/command/result/TraceResponse.ts`, `src/utils/enum.ts`, `src/views/app/instance_detail/modules/trace-tab.vue`, and `src/views/demo/enum-demo.vue`; the touched JVM tab files now pass IDE diagnostics.
**How to apply:** For follow-up work in the instance detail area, treat full-project typecheck failures as baseline noise unless those shared files are also being changed.

2026-03-24: `/api/ws` 的周期性断开重连由前端文本心跳配置触发，已在前端禁用该 protobuf 通道的自定义心跳。
**Why:** `FRONTEND_INTEGRATION.md` 约定 `/api/ws` 收发二进制 protobuf，但 `src/store/modules/websocket/index.ts` 曾配置 `ping/pong` 心跳，`src/utils/ws/WebSocketBean.ts` 又会默认启用心跳，导致前端按固定节奏自判失败并重连。
**How to apply:** 后续如果继续扩展 `/api/ws`，默认不要为该连接发送文本心跳；若需要保活，应先由后端定义正式协议后再接入。