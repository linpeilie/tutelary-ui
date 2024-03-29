<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { useDateFormat } from '@vueuse/core'
import AutoRefresh from './AutoRefresh.vue'
import eventbus from '@/utils/eventbus'
import { commandEnum } from '@/enums/commandEnums'
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import type { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse'
import type { JvmMemory } from '@/proto/command/domain/JvmMemory'
import TCharts from '@/components/chart/TCharts.vue'

const props = defineProps({
  instanceId: { type: String, required: true },
})

// 数据刷新时间
const refreshTimestamp = ref<number>()
// 时间线
const timeline = ref<string[]>([])
// 堆内存
const heapMemories: JvmMemory[] = []
// 堆内存折线图配置
const heapMemoryOptions = ref<EChartsOption>()

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.JVM_MEMORY.value) {
      const jvmMemoryResponse = commandExecuteResponse.data as JvmMemoryResponse
      refreshTimestamp.value = commandExecuteResponse.timestamp

      // 时间线
      timeline.value.push(useDateFormat(commandExecuteResponse.timestamp, 'HH:mm').value)

      // 堆内存
      heapMemories.push(...jvmMemoryResponse.heapMemory)

      // 堆内存
      heapMemoryOptions.value = {
        title: { text: 'Heap Memory' },
        tooltip: { trigger: 'axis' },
        legend: {
          data: jvmMemoryResponse.heapMemory.map(m => m.name),
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          boundaryGap: false,
          data: timeline.value,
        },
        yAxis: {},
        series: jvmMemoryResponse.heapMemory.map((hm) => {
          return {
            data: heapMemories.filter(m => m.name === hm.name).map(m => m.used),
            type: 'line',
            name: hm.name,
          }
        }),
      }
    }
  })
  createJvmMemoryCommand()
})

onBeforeUnmount(() => eventbus.off('command'))

function createJvmMemoryCommand() {
  const params: CommandCreateRequest<any> = {
    instanceId: props.instanceId,
  }
  commandCreateApi.createJvmMemoryCommand(params)
}
</script>

<template>
  <AutoRefresh :refresh-timestamp="refreshTimestamp" :interval="60000" @refresh="createJvmMemoryCommand" />

  <TCharts :options="heapMemoryOptions" />
</template>

<style scoped></style>
