<script setup lang="ts">
import type { Component } from 'vue'
import { markRaw, onMounted, ref } from 'vue'
import type { MenuOption } from 'naive-ui'

// components
import dashboard from './components/dashboard.vue'
import thread from './components/thread.vue'
import { useThemeStore } from '@/store'

const themeStore = useThemeStore()

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
  <n-layout has-sider wh-full>
    <n-layout-sider
      bordered collapse-mode="width" :collapse-width="themeStore.sider.collapsedWidth"
      :native-scrollbar="false" :width="themeStore.sider.width"
    >
      <n-menu
        ref="menu" class="side-menu" accordion :indent="18" :collapsed-icon-size="22" :collapsed-width="64"
        :options="menuOptions" :value="activeMenuOption.key" :default-value="defaultActiveMenu"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <article flex-col flex-1 overflow-hidden>
      <section flex-1 overflow-hidden bg="#f5f6fb" dark:bg-hex-101014>
        <component :is="activeMenuOption.component" :key="activeMenuOption.key" />
      </section>
    </article>
  </n-layout>
</template>

<style scoped>
</style>
