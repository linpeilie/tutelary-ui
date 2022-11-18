<template>
  <q-scroll-area style="height: 100%;">
    <q-list padding>
      <q-item v-for="(menu, index) of sideMenus"
              clickable
              v-ripple
              :tabindex="index"
              :active="menu.path === route.path"
              :to="menu.path"
              class="menu-item q-mx-md q-my-xs"
              :active-class="activeClasses">
        <q-item-section avatar>
          <q-icon :name="menu.icon"/>
        </q-item-section>
        <q-item-section>
          {{ menu.title }}
        </q-item-section>
      </q-item>
    </q-list>
  </q-scroll-area>
</template>

<script setup>
import { toRefs, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

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

const route = useRoute()

const store = useStore()

const sideMenus = computed(() => {
  return menus.value.filter(item => !item.hidden)
})

const miniSideBar = computed(() => {
  return store.getters.miniSideBar
})

const activeClasses = computed(() => {
  if (miniSideBar.value) {
    return ''
  } else {
    return 'menu-item__active'
  }
})

</script>
