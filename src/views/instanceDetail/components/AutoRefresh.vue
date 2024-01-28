<script setup lang="ts">
import { defineEmits } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'

const props = defineProps({
  refreshTimestamp: {
    type: Number,
  },
})

const emit = defineEmits(['refresh'])

const automiaticRefresh = ref<boolean>(true)

const { pause, resume } = useIntervalFn(() => emit('refresh'), 5000)

function handleSwitchChange(value: boolean) {
  if (value)
    resume()
  else
    pause()
}
</script>

<template>
  <n-space justify="space-between" bg="#fafafc" dard:bg-black min-h-60 flex items-start justify-between b-1 rounded-8 p-15 bc-fff>
    <n-space align="center">
      <n-time :time="props.refreshTimestamp" format="yyyy-MM-dd HH:mm:ss.SSS" font-semibold />
      <n-button type="primary" @click="$emit('refresh')">
        <template #icon>
          <n-icon><Icon icon="mdi:refresh" /></n-icon>
        </template>
        Refresh
      </n-button>
      <n-space ml-20 inline :wrap="false">
        <span>Automiatic Refresh</span>
        <n-switch v-model:value="automiaticRefresh" @update:value="handleSwitchChange" />
      </n-space>
    </n-space>
    <n-button secondary>
      History
    </n-button>
  </n-space>
</template>

<style scoped>
.auto-refresh-item {
  background: #fafafc;
  min-height: 60px;
}
</style>
