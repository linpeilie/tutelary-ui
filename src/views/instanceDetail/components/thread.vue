<script setup lang="ts">
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest, ThreadListRequest } from '@/api/types/commandCreateTypes'

const props = defineProps({
  instanceId: {
    type: String,
    required: true,
  },
})

function createThreadListCommand() {
  const params = {
    instanceId: props.instanceId,
    param: {},
  } as CommandCreateRequest<ThreadListRequest>
  commandCreateApi.createThreadListCommand(params)
}
</script>

<template>
  <div>
    线程
    <n-button @click="createThreadListCommand">
      获取线程列表
    </n-button>
  </div>
</template>

<style scoped>
</style>
