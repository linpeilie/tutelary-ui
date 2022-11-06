<template>
  <q-scroll-area style="height: 100%; margin-left: 20px">
    <q-toolbar class="q-pa-md text-center">
      <q-toolbar-title>
        <q-img src="logo.png" width="30px" height="30px"/>
        Tutelary
      </q-toolbar-title>
    </q-toolbar>
    <q-separator/>
    <q-list>
      <template v-for="(item, index) in menus" :key="'submenu-' + index">
        <side-bar-item :add-routes-item="item" :init-level="0" v-if="!item.hidden"/>
      </template>
    </q-list>
  </q-scroll-area>
</template>

<script setup>
import { toRefs } from 'vue'
import SideBarItem from './SideBarItem.vue'

const props = defineProps({
  menus: {
    type: Array,
    required: false,
    default: () => {
      return []
    }
  }
})
const { menus } = toRefs(props)
</script>

<style scoped lang="scss">
.brand {
  height: $toolbar-min-height;
}
</style>
