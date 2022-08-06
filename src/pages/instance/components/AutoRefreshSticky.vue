<template>
  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-card class="q-pa-md bottom-right-card">
      <span class="q-mr-md" v-if="updateTime">更新时间 {{ updateTime }}</span>
      <q-toggle
        class="q-mr-md"
        v-model="autoRefresh"
        color="teal-10"
        checked-icon="check"
        unchecked-icon="clear"
        label="自动刷新"
        @update:model-value="changeAutoRefreshStatus"
      />
      <q-btn outline round color="black" icon="refresh" @click="refresh"/>
    </q-card>
  </q-page-sticky>
</template>

<script setup>
import { defineProps, ref, defineEmits } from 'vue'

const props = defineProps({
  updateTime: { type: String, default: '' }
})

const emits = defineEmits(['refresh'])

const autoRefresh = ref(false)

const refresh = () => {
  emits('refresh')
}

let timer = ''

const changeAutoRefreshStatus = (value) => {
  if (value) {
    timer = setInterval(refresh, 3000)
  } else {
    clearInterval(timer)
  }
}
</script>

<style scoped lang="scss">
.bottom-right-card {
  background: $blue-grey-2;
  color: black;
  opacity: 0.5;
}
</style>
