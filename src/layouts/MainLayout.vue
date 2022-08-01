<template>
  <q-layout view="lHh lpR fFf">

    <q-header class="text-black" style="background: #fafafa">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer"/>

        <q-toolbar-title>
          Tutelary
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <!-- drawer content -->
      <side-bar :menus="menus"/>
    </q-drawer>

    <q-page-container class="page-container">
      <router-view/>
    </q-page-container>

  </q-layout>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import SideBar from './SideBar/SideBar.vue'

export default {
  components: { SideBar },
  setup () {
    const store = useStore()

    const leftDrawerOpen = ref(false)

    const menus = store.getters.menus

    onMounted(() => {
      console.log('----->', store.getters.menus)
    })

    return {
      menus,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  }
}
</script>

<style scoped>
.page-container {
  background: #fafafa;
}
</style>
