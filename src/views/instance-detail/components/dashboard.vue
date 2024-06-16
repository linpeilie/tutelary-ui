<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NText } from 'naive-ui'
import AutoRefresh from './AutoRefresh.vue'
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import { commandEnum } from '@/enums/commandEnums'
import type { BaseThreadInfo } from '@/proto/command/domain/BaseThreadInfo'
import type { Overview } from '@/proto/command/result/Overview'
import eventbus from '@/utils/eventbus'
import type { ThreadStatistic } from '@/proto/command/domain/ThreadStatistic'
import type { JvmMemory } from '@/proto/command/domain/JvmMemory'
import type { GarbageCollector } from '@/proto/command/domain/GarbageCollector'
import { div } from '@/utils'

const props = defineProps({
  instanceId: {
    type: String,
    required: true,
  },
})

const refreshTimestamp = ref<number>()

const threads = ref<BaseThreadInfo[]>([])

const threadStatistic = ref<ThreadStatistic>()

const heapMemories = ref<JvmMemory[]>([])

const nonHeapMemories = ref<JvmMemory[]>([])

const garbageCollectors = ref<GarbageCollector[]>([])

const threadsColumns: DataTableColumns<BaseThreadInfo> = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Group', key: 'group' },
  { title: 'CPU', key: 'cpu' },
  { title: 'State', key: 'state' },
  { title: 'Priority', key: 'priority' },
]

const memoriesColumns: DataTableColumns<JvmMemory> = [
  {
    title: 'Name',
    key: 'name',
    render: (_) => {
      return _.name
    },
  },
  { title: 'Max', key: 'max' },
  { title: 'Committed', key: 'committed' },
  { title: 'Used', key: 'used' },
]

const garbageCollectorColumns: DataTableColumns<GarbageCollector> = [
  { title: 'Name', key: 'name' },
  { title: 'Collection Count', key: 'collectionCount' },
  { title: 'Collection Times', key: 'collectionTime' },
]

function createOverviewCommand() {
  const params = {
    instanceId: props.instanceId,
    param: {},
  } as CommandCreateRequest<any>
  commandCreateApi.createOverviewCommand(params)
}

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.OVERVIEW.value) {
      refreshTimestamp.value = commandExecuteResponse.timestamp

      const overview = commandExecuteResponse.data as Overview

      threads.value = overview.threads
      threadStatistic.value = overview.threadStatistic
      heapMemories.value = overview.heapMemory
      nonHeapMemories.value = overview.nonHeapMemory
      garbageCollectors.value = overview.garbageCollectors
    }
  })
  createOverviewCommand()
})

onBeforeUnmount(() => {
  eventbus.off('command')
})

function memoryTrans(value: number) {
  if (value)
    return h(NText, {}, { default: () => `${div(value, 1024)}MB` })

  return '-'
}
</script>

<template>
  <AutoRefresh :refresh-timestamp="refreshTimestamp" mb-15 @refresh="createOverviewCommand" />

  <n-grid cols="6" item-responsive :x-gap="12" :y-gap="20">
    <n-grid-item span="1">
      <n-card :bordered="false" title="线程统计" embedded w-full wh-full>
        <n-statistic label="线程总数">
          {{ threadStatistic?.threadCount }}
        </n-statistic>
        <n-statistic label="创建和启动的线程总数">
          {{ threadStatistic?.totalStartedThreadCount }}
        </n-statistic>
        <n-statistic label="峰值线程数量">
          {{ threadStatistic?.peakThreadCount }}
        </n-statistic>
        <n-statistic label="非守护线程数量">
          {{ threadStatistic?.daemonThreadCount }}
        </n-statistic>
      </n-card>
    </n-grid-item>
    <n-grid-item span="5">
      <n-card title="线程 TOP-10" embedded w-full :bordered="false">
        <n-data-table :columns="threadsColumns" :data="threads" :bordered="false" />
      </n-card>
    </n-grid-item>
    <n-grid-item span="3">
      <n-card :bordered="false" title="堆内存" embedded w-full wh-full>
        <n-data-table :columns="memoriesColumns" :data="heapMemories" :bordered="false" :render-cell="memoryTrans" />
      </n-card>
    </n-grid-item>
    <n-grid-item span="3">
      <n-card :bordered="false" title="垃圾回收" embedded w-full wh-full>
        <n-data-table :columns="garbageCollectorColumns" :data="garbageCollectors" :bordered="false" />
      </n-card>
    </n-grid-item>
    <n-grid-item span="3">
      <n-card :bordered="false" title="非堆内存" embedded w-full wh-full>
        <n-data-table :columns="memoriesColumns" :data="nonHeapMemories" :bordered="false" :render-cell="memoryTrans" />
      </n-card>
    </n-grid-item>
  </n-grid>
</template>

<style scoped></style>
