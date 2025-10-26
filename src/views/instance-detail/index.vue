<script setup lang="ts">
import type { Component } from 'vue'
import { markRaw, onMounted, ref } from 'vue'
import type { MenuOption } from 'naive-ui'
import { useRoute } from 'vue-router'
import dashboard from './components/dashboard.vue'
import thread from './components/thread.vue'
import decompile from './components/decompile.vue'
import vmOption from './components/vmOption.vue'
import logger from './components/logger.vue'
import trace from './components/trace.vue'
import stack from './components/stack.vue'
import jvmMemory from './components/jvmMemory.vue'
import systemInfo from './components/systemInfo.vue'
import InstanceSider from './instanceSider.vue'
import commandCodec from './codec/commandCodec'
import { useWebSocket } from '@/composables/useWebSocket'
import { getToken } from '@/utils'
import instanceApi from '@/api/instanceApi'
import type { InstanceDetailInfo } from '@/api/types/instanceTypes'
import { messageTypeEnum } from '@/enums/messageTypeEnums'
import { CommandExecuteResponse } from '@/proto/CommandExecuteResponse'
import { ErrorMessage } from '@/proto/ErrorMessage'
import eventbus from '@/utils/eventbus'

const route = useRoute()

const instanceId = ref<string>()
// 实例信息
const instance = ref<InstanceDetailInfo>({} as InstanceDetailInfo)

function getWsUrl() {
  const loc = window.location
  let wsUrl
  if (loc.protocol === 'https:')
    wsUrl = 'wss:'
  else
    wsUrl = 'ws:'

  return wsUrl += `//${loc.host}/api/ws?_tt=${getToken()}`
}

async function getInstanceDetail() {
  instance.value = await instanceApi.detail(instanceId.value)
}

const { start, dispose } = useWebSocket({
  url: getWsUrl(),
  needReconnect: true,
  onOpen: () => {
    return Promise.resolve()
  },
  onMessage: (ev) => {
    const blob = ev.data
    const fileReader = new FileReader()
    fileReader.onload = (progressEvent) => {
      const currentTarget = progressEvent.currentTarget as FileReader

      const arrayBuffer = currentTarget.result as ArrayBuffer

      const uint8Array = new Uint8Array(arrayBuffer)
      // cmd
      const cmd = uint8Array.at(0)

      if (cmd === messageTypeEnum.CLIENT_COMMAND_RESPONSE.value) {
        const commandExecuteResponse = CommandExecuteResponse.decode(uint8Array.slice(5))
        // status
        if (!commandExecuteResponse.status) {
          window.$message.error(`task ${commandExecuteResponse.taskId} failed to execute, error message : ${commandExecuteResponse.message}`)
          return
        }
        commandExecuteResponse.data = commandCodec.decode(commandExecuteResponse.code, commandExecuteResponse.data?.byteArray)
        if (!commandExecuteResponse.data) {
          window.$message.error(`unknown command code : ${commandExecuteResponse.code}`)
          return
        }
        eventbus.emit('command', commandExecuteResponse)
      }
      else if (cmd === messageTypeEnum.ERROR.value) {
        const errorMessage = ErrorMessage.decode(uint8Array.slice(5))
        window.$message.error(errorMessage.message)
      }
      else {
        window.$message.error(`unknown message type : ${cmd}`)
      }
    }
    fileReader.readAsArrayBuffer(blob)
  },
  onError: () => {
  },
})

onMounted(async () => {
  instanceId.value = route.params.instanceId as string
  // 获取实例信息
  await getInstanceDetail()
  start()
})

onUnmounted(() => {
  dispose()
})

const menu = ref<any>(null)

type MenuItem = Omit<MenuOption, 'children'> & {
  component: Component
  key: string
  label: string
  icon?: string
}

const menuOptions: MenuItem[] = [
  { key: 'instance-detail-dashboard', label: 'Dashboard', icon: 'ph:chart-line-duotone', component: markRaw(dashboard) },
  { key: 'system-info', label: 'System', icon: 'ph:cpu-duotone', component: markRaw(systemInfo) },
  { key: 'instance-thread', label: 'Threads', icon: 'ph:list-bullets-duotone', component: markRaw(thread) },
  { key: 'decompile', label: 'Decompile', icon: 'ph:code-duotone', component: markRaw(decompile) },
  { key: 'vm-option', label: 'VM Option', icon: 'ph:gear-duotone', component: markRaw(vmOption) },
  { key: 'logger', label: 'Logger', icon: 'ph:terminal-duotone', component: markRaw(logger) },
  { key: 'trace', label: 'Trace', icon: 'ph:path-duotone', component: markRaw(trace) },
  { key: 'stack', label: 'Stack', icon: 'ph:stack-duotone', component: markRaw(stack) },
  { key: 'jvmMemory', label: 'Memory', icon: 'ph:database-duotone', component: markRaw(jvmMemory) },
]

/**
 * 选中的菜单
 */
const activeMenuOption = ref<MenuItem>({} as MenuItem)

const defaultActiveMenu = ref<string>('')

function handleMenuSelect(key: string, item: MenuItem) {
  activeMenuOption.value = item
}

onMounted(() => {
  activeMenuOption.value = menuOptions[0]
  defaultActiveMenu.value = activeMenuOption.value.key as string
})
</script>

<template>
  <div class="instance-detail-container">
    <InstanceSider :instance-info="instance" />

    <div class="main-content">
      <!-- Linear风格的导航标签 -->
      <div class="nav-tabs">
        <div
          v-for="option in menuOptions"
          :key="option.key"
          class="nav-tab"
          :class="{ active: activeMenuOption.key === option.key }"
          @click="handleMenuSelect(option.key, option)"
        >
          <Icon v-if="option.icon" :icon="option.icon" class="tab-icon" />
          <span class="tab-label">{{ option.label }}</span>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area cus-scroll-y">
        <component :is="activeMenuOption.component" :key="activeMenuOption.key" :instance-id="instanceId" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.instance-detail-container {
  display: flex;
  width: 100%;
  height: 100vh;
  background: #FAFAFA;
  gap: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #FAFAFA;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #111827;
  }

  &.active {
    background: rgba(94, 106, 210, 0.1);
    color: #5E6AD2;

    .tab-icon {
      color: #5E6AD2;
    }
  }

  .tab-icon {
    font-size: 18px;
    color: #9CA3AF;
    transition: color 0.15s;
  }

  .tab-label {
    font-weight: 500;
    letter-spacing: -0.01em;
  }
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #FAFAFA;
}
</style>
