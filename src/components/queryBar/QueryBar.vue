<script setup>
import { NButton, NSpace } from 'naive-ui'

const emit = defineEmits(['search', 'reset'])
</script>

<template>
  <div bg="#fafafc" min-h-60 flex items-start justify-between b-1 rounded-8 p-15 bc-ccc dark:bg-black>
    <NSpace wrap :size="[35, 15]">
      <slot />
    </NSpace>

    <div flex-shrink-0>
      <NButton secondary type="primary" @click="emit('reset')">
        重置
      </NButton>
      <NButton ml-20 type="primary" @click="emit('search')">
        搜索
      </NButton>
    </div>
  </div>
</template>
