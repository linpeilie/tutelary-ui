<script setup lang="ts">
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import AutoRefresh from './AutoRefresh.vue'
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import type { VmOptionRequest } from '@/proto/command/param/VmOptionRequest'
import type { VmOptionResponse } from '@/proto/command/result/VmOptionResponse'
import type { VmOption } from '@/proto/command/domain/VmOption'
import eventbus from '@/utils/eventbus'
import { commandEnum } from '@/enums/commandEnums'

const props = defineProps({
  instanceId: { type: String, required: true },
})

const vmOptions = ref<VmOption[]>([])

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.GET_VM_OPTION.value) {
      const data = commandExecuteResponse.data as VmOptionResponse
      vmOptions.value = data.options
    }
  })
  getVmOptions()
})

function getVmOptions() {
  if (!props.instanceId)
    return

  const params: CommandCreateRequest<VmOptionRequest> = {
    instanceId: props.instanceId,
    param: {},
  }
  commandCreateApi.createGetVmOption(params)
}

onBeforeUnmount(() => {
  eventbus.off('command')
})

const vmOptionTableColumns: TableColumns<VmOption> = [
  { title: 'Name', key: 'name' },
  { title: 'Value', key: 'value' },
  { title: 'Origin', key: 'origin' },
]
</script>

<template>
  <AutoRefresh :auto-refresh="false" @refresh="getVmOptions" />

  <n-data-table :columns="vmOptionTableColumns" :data="vmOptions" mt-20 />
</template>

<style scoped>
</style>
