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
}

const menuOptions: MenuItem[] = [
  { key: 'instance-detail-dashboard', label: '面板', component: markRaw(dashboard) },
  { key: 'instance-thread', label: '线程', component: markRaw(thread) },
  { key: 'decompile', label: '反编译', component: markRaw(decompile) },
  { key: 'vm-option', label: 'VmOption', component: markRaw(vmOption) },
  { key: 'logger', label: 'Logger', component: markRaw(logger) },
  { key: 'trace', label: 'Trace', component: markRaw(trace) },
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
  activeMenuOption.value = menuOptions[menuOptions.length - 1]
  defaultActiveMenu.value = activeMenuOption.value.key as string
})
</script>

<template>
  <app-page>
    <n-flex :wrap="false" wh-full>
      <InstanceSider :instance-info="instance" />

      <article flex-col flex-1 overflow-hidden>
        <n-menu
          ref="menu" mode="horizontal" class="side-menu" accordion :indent="18" :collapsed-icon-size="22"
          :collapsed-width="64" :options="menuOptions" :value="activeMenuOption.key" :default-value="defaultActiveMenu"
          @update:value="handleMenuSelect"
        />
        <n-card flex-1 overflow-hidden content-class="cus-scroll-y">
          <component :is="activeMenuOption.component" :key="activeMenuOption.key" :instance-id="instanceId" />
        </n-card>
      </article>
    </n-flex>
  </app-page>
</template>

<style scoped>
</style>
./codec/messageCodec
