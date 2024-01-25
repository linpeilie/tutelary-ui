<script setup lang="ts">
import type { Component } from 'vue'
import { markRaw, onMounted, ref } from 'vue'
import type { MenuOption } from 'naive-ui'
import { useRoute } from 'vue-router'
import dashboard from './components/dashboard.vue'
import thread from './components/thread.vue'
import InstanceSider from './instanceSider.vue'
import { useThemeStore } from '@/store'
import { useWebSocket } from '@/composables/useWebSocket'
import { getToken } from '@/utils'
import instanceApi from '@/api/instanceApi'
import type { InstanceDetailInfo } from '@/api/types/instanceTypes'

// components

const route = useRoute()

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
  const instanceId = route.params.instanceId as string
  instance.value = await instanceApi.detail(instanceId)
}

const { start, dispose } = useWebSocket({
  url: getWsUrl(),
  needReconnect: true,
  onOpen: () => {
    return Promise.resolve()
  },
  onMessage: () => {
  },
  onError: () => {
  },
})

onMounted(async () => {
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
  <app-page>
    <n-flex :wrap="false" wh-full>
      <InstanceSider :instance-info="instance" />

      <n-flex :vertical="true" flex-1>
        <n-menu
          ref="menu" mode="horizontal" class="side-menu" accordion :indent="18" :collapsed-icon-size="22"
          :collapsed-width="64" :options="menuOptions" :value="activeMenuOption.key" :default-value="defaultActiveMenu"
          @update:value="handleMenuSelect"
        />
        <n-card flex-1 rounded-10>
          <component :is="activeMenuOption.component" :key="activeMenuOption.key" :instance-id="instance.instanceId" />
        </n-card>
      </n-flex>
    </n-flex>
  </app-page>
</template>

<style scoped>
</style>
