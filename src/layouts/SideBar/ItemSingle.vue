<template>
  <q-item clickable v-ripple exact @click="toPath(menu)" :inset-level="initLevel" :active="menuActive">
    <q-item-section avatar>
      <q-icon :name="menu.icon"/>
    </q-item-section>
    <q-item-section>{{ menu.title }}</q-item-section>
  </q-item>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const props = defineProps({
  addRoutesItem: {
    default: function () {
      return null
    },
    type: Object
  },
  initLevel: {
    type: Number,
    default: 0
  }
})

const {
  addRoutesItem,
  initLevel
} = toRefs(props)

const menu = computed(() => {
  return addRoutesItem.value?.children?.length === 1 ? addRoutesItem.value.children[0] : addRoutesItem.value
})

const toPath = (menu) => {
  if (menu.is_link) {
    window.open(menu.path)
  } else {
    router.push(menu.path)
  }
}

const menuActive = computed(() => {
  return route.path === menu.value.path
})

</script>

<style scoped lang="scss">
.item-active-class {
  color: $primary;
  background: $primary;
}
</style>
