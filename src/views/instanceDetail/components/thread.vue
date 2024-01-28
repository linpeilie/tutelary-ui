<script setup lang="ts">
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import { onMounted } from 'vue'
import AutoRefresh from './AutoRefresh.vue'
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest, ThreadListRequest } from '@/api/types/commandCreateTypes'
import type { ThreadList } from '@/proto/command/result/ThreadList'
import eventbus from '@/utils/eventbus'
import { commandEnum } from '@/enums/commandEnums'
import type { ThreadStatistic } from '@/proto/command/domain/ThreadStatistic'
import type { BaseThreadInfo } from '@/proto/command/domain/BaseThreadInfo'

const props = defineProps({
  instanceId: {
    type: String,
    required: true,
  },
})

const threadStatistic = ref<ThreadStatistic | undefined>(undefined)
const threadList = ref<BaseThreadInfo[]>([])
const refreshTimestamp = ref<number>()

const threadStatisticList = computed(() => {
  if (threadStatistic) {
    return [
      { label: 'ThreadCount', value: threadStatistic.value?.threadCount },
      { label: 'DaemonThreadCount', value: threadStatistic.value?.daemonThreadCount },
      { label: 'PeakThreadCount', value: threadStatistic.value?.peakThreadCount },
      { label: 'TotalStartedThreadCount', value: threadStatistic.value?.totalStartedThreadCount },
    ]
  }
  else {
    return []
  }
})

const threadListTableColumns: TableColumns = [
  {
    title: 'Id',
    key: 'id',
  },
  {
    title: 'Name',
    key: 'name',
  },
  {
    title: 'Group',
    key: 'group',
  },
  {
    title: 'CPU',
    key: 'cpu',
    defaultSortOrder: 'descend',
    sorter: 'default',
  },
  {
    title: 'State',
    key: 'state',
  },
  {
    title: 'Daemon',
    key: 'daemon',
  },
  {
    title: 'Priority',
    key: 'priority',
  },
]

function createThreadListCommand() {
  const params = {
    instanceId: props.instanceId,
    param: {},
  } as CommandCreateRequest<ThreadListRequest>
  commandCreateApi.createThreadListCommand(params)
}

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.THREAD_LIST.value) {
      const data = commandExecuteResponse.data as ThreadList
      threadStatistic.value = data.threadStatistic
      threadList.value = data.threads
      refreshTimestamp.value = commandExecuteResponse.timestamp
    }
  })
  createThreadListCommand()
})

onBeforeUnmount(() => {
  eventbus.off('command')
})
</script>

<template>
  <AutoRefresh :refresh-timestamp="refreshTimestamp" @refresh="createThreadListCommand" />

  <!-- thread statistic card -->
  <n-grid v-if="threadStatistic" x-gap="12" y-gap="12" cols="1 500:2 900:4" mt-20>
    <n-gi v-for="item of threadStatisticList" :key="item.label" class="thread-statistic-card">
      <n-card embedded :bordered="false">
        <n-statistic :label="item.label" :value="item.value" />
      </n-card>
    </n-gi>
  </n-grid>

  <!-- data table -->
  <n-data-table :columns="threadListTableColumns" :data="threadList" mt-20 :bordered="false" />
</template>

<style scoped>
.thread-statistic-card {
  min-width: 220px;
}
</style>
