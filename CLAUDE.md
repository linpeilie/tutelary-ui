# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository-specific workflow rules
- Do not ask the user questions directly; use `AskUserQuestion`.
- After finishing a task, use `AskUserQuestion` to let the user confirm the result before treating the task as done.

## Persona and response style
- Default to Simplified Chinese unless the user asks for another language.
- Be concise and execution-first: lead with the result or change, then give only the minimum explanation needed.
- When referencing code, prefer the `file_path:line_number` format.
- Do not add unrelated refactors, abstractions, comments, or extra features while completing a requested change.

## Memory protocol
- Before doing substantial work, check the project-local memory at the project `memory/` directory if it exists and is relevant.
- Treat `memory/MEMORY.md` as long-term memory: it contains stable core information and explicit long-term user preferences, and should stay small enough to auto-load every session.
- If `MEMORY.md` grows beyond 150 lines, proactively suggest trimming it.
- Treat same-day notes as short-term memory and store them under the project `memory/` directory (currently `memory/short-term.md`).
- After every completed task, save memory: write stable facts to long-term memory and worthwhile same-day notes to short-term memory without asking the user for confirmation.
- Do not save temporary noise, unverified conclusions, or secrets to long-term memory.
- When historical context is needed, search the project `memory/` directory instead of overloading `MEMORY.md`.
- If the user explicitly asks to remember or forget something, update the project memory files immediately.

## Development commands
- Use `pnpm` for package management. The documented setup command is `pnpm install`, and `package.json` requires Node `^20.19.0 || >=22.12.0`.
- Start the Vite dev server with `pnpm dev`.
- Run a production build with `pnpm build`. This runs `pnpm type-check` and `pnpm build-only` in parallel.
- If you only need the bundle output, run `pnpm build-only`.
- Run TypeScript/Vue type checking with `pnpm type-check`.
- Run linting with `pnpm lint`. This expands to `pnpm lint:oxlint` and `pnpm lint:eslint`; both are configured with `--fix`, so expect files to be rewritten.
- Format source files with `pnpm format`. This only targets `src/`.
- Preview the production build with `pnpm preview`.
- There is currently no test runner or `test` script in `package.json`, so there is no supported command for running the full test suite or a single test yet.


## Project Overview

Tutelary UI is a Vue 3 admin dashboard for the Tutelary Java application monitoring system. It is forked from [Qs Admin](https://github.com/zclzone/qs-admin) and customized for monitoring JVM instances, executing commands, and managing system resources.

## Commands

- `pnpm dev` — Start dev server (port from `.env.development`)
- `pnpm build` — Production build
- `pnpm build:github` — Build for GitHub Pages deployment
- `pnpm lint` — ESLint check
- `pnpm lint:fix` — ESLint check and auto-fix
- `pnpm preview` — Preview production build locally

Package manager: **pnpm** (required). No test runner is configured.

## Tech Stack

- **Vue 3** + **TypeScript** + **Vite 7**
- **Naive UI** — component library
- **Pinia** — state management
- **UnoCSS** — atomic CSS (with `presetUno` dark mode via class, `presetAttributify`)
- **unplugin-auto-import / unplugin-vue-components** — auto-imports for Vue APIs and Naive UI components (no manual imports needed)
- **unplugin-icons** + `@iconify/json` — icon system
- **Axios** — HTTP client
- **protobufjs / ts-proto** — protobuf encoding for WebSocket command responses
- **ECharts** — charting
- **vite-plugin-mock** + **mockjs** — API mocking (toggle via `VITE_USE_MOCK` env var)

## Architecture

### Path Aliases
- `@/` → `src/`
- `~/` → project root

### Routing & Auth
Routes are split into **basic routes** (login, error pages) and **async routes** (feature pages). On app init, if a JWT token exists, the user's permissions are fetched and `permissionStore.generateRoutes()` filters async routes by the user's menu permissions. Routes are added dynamically via `router.addRoute()`. Router guards handle permission checks, page loading, and title updates (`src/router/guard/`).

### State Management (Pinia stores in `src/store/modules/`)
- **user** — user info, menus/resources permissions, login/logout
- **permission** — generates accessible routes from user permissions
- **app** — app-level state (collapsed sidebar, etc.)
- **tab** — browser-like tab management
- **theme** — theme/dark mode settings

### API Layer
- `src/api/` — API modules per domain (auth, user, instance, role, commandCreate, app)
- `src/api/types/` — TypeScript types for API requests/responses
- HTTP client configured in `src/utils/http/` using Axios with interceptors
- Token management in `src/utils/auth/`

### WebSocket & Protobuf
- `src/composables/useWebSocket.ts` — WebSocket composable for real-time communication
- `src/proto/` — Protobuf definitions and generated TS for command execution responses, metadata, error messages
- `src/utils/protobuf/` — protobuf encoding/decoding utilities

### Layout
`src/layout/` contains the admin shell: sidebar navigation, header, tab bar, and `AppMain.vue` content area.

### Views
`src/views/` organized by feature: `login`, `workbench`, `instance`, `instance-detail`, `system` (admin), `app`, `error-page`, `demo`.

### Composables (`src/composables/`)
- `useEcharts` — reactive ECharts integration
- `useModal` — modal dialog helper
- `useWebSocket` — WebSocket connection management

## UnoCSS Shortcuts
Custom shortcuts defined in `uno.config.ts`: `wh-full`, `f-c-c` (flex center), `flex-col`, `absolute-lt/lb/rt/rb/center`, `text-ellipsis`. Theme colors reference CSS variables (`--primary-color`, etc.).

## ESLint
Uses `@antfu/eslint-config` with UnoCSS and formatter plugins. Ignores: `vite.config.ts`, `build/**`, `src/proto/**`, `src/components/**`.

## Environment Configuration
- `.env.development` — dev defaults (proxy enabled, mock disabled)
- `.env.production` — production (mock enabled for demo, gzip compression)
- `.env.github` — GitHub Pages deployment
- Proxy config in `build/config/proxy.ts`, toggled by `VITE_USE_PROXY` and `VITE_PROXY_TYPE`

## Build System
Vite plugins and config are abstracted into `build/`:
- `build/plugins/` — plugin setup (html, mock, unplugin auto-imports, SVG icons)
- `build/config/` — define constants, proxy config
- `build/utils.ts` — path helpers and env conversion
