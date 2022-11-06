<template>
  <component :is="chooseComponent"
             :addRoutesItem="addRoutesItem"
             :initLevel="initLevel">
    <template v-if="hasChildren">
      <SideBarItem v-for="item in addRoutesItem.children"
                   :key="item.id"
                   :add-routes-item="item"
                   :init-level="initLevel + 0.3"/>
    </template>
  </component>
</template>

<script setup>
import ItemSingle from './ItemSingle.vue'
import ItemMultiple from './ItemMultiple.vue'
import { computed, toRefs } from 'vue'

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

const hasChildren = computed(() => {
  return addRoutesItem.value?.children?.length > 1
})

const chooseComponent = computed(() => {
  if (hasChildren.value) {
    return ItemMultiple
  } else {
    return ItemSingle
  }
})
</script>

<style scoped>

</style>
