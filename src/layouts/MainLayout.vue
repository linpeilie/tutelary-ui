<template>
  <q-layout view="hHh LpR fFf" class="t-common-page">

    <q-header class="text-black row no-wrap t-page-header">
      <q-toolbar :style="{width: titleWidth}">
        <q-toolbar-title class="text-center">
          <q-img src="logo.png" width="30px" height="30px"/>
          <span v-if="!miniDrawer"> Tutelary </span>
        </q-toolbar-title>
      </q-toolbar>
      <q-toolbar :style="{width: `calc(100% - ${titleWidth})`}">
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer"/>
        <q-space/>
        <div class="q-px-xs q-py-xs" style="border: 2px solid #EBEBEB; border-radius: 20px">
          <q-icon name="menu" class="q-mx-sm"/>
          <q-avatar size="26px">
            <img src="avatar.png">
          </q-avatar>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above
              :width="sideBarWidth"
              @click.capture="drawerClick"
              side="left"
              :mini="miniDrawer"
              class="t-side-bar">
      <!-- drawer content -->
      <side-bar :menus="menus"/>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="fade-transform">
          <component :is="Component"/>
        </transition>
      </router-view>
    </q-page-container>

  </q-layout>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import SideBar from './SideBar/SideBar.vue'

export default {
  components: { SideBar },
  setup () {
    const store = useStore()

    const sideBarWidth = store.getters.sideBarWidth

    const miniSideBarWidth = store.getters.miniSideBarWidth

    const miniDrawer = computed(() => {
      return store.getters.miniSideBar
    })

    const menus = store.getters.menus

    const drawerClick = (e) => {
      if (miniDrawer.value) {
        store.dispatch('changeMiniSideBar')
        e.stopPropagation()
      }
    }

    const titleWidth = computed(() => {
      return miniDrawer.value ? miniSideBarWidth + 'px' : sideBarWidth + 'px'
    })

    return {
      sideBarWidth,
      miniSideBarWidth,
      titleWidth,
      menus,
      miniDrawer,
      drawerClick,
      toggleLeftDrawer () {
        store.dispatch('changeMiniSideBar')
      }
    }
  }
}
</script>

<style scoped>
</style>
