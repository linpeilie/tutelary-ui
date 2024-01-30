<script setup lang="ts">
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import { h, onMounted } from 'vue'
import { NButton } from 'naive-ui'
import AutoRefresh from './AutoRefresh.vue'
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import type { ThreadListRequest } from '@/proto/command/param/ThreadListRequest'
import type { ThreadList } from '@/proto/command/result/ThreadList'
import eventbus from '@/utils/eventbus'
import { commandEnum } from '@/enums/commandEnums'
import type { ThreadStatistic } from '@/proto/command/domain/ThreadStatistic'
import type { BaseThreadInfo } from '@/proto/command/domain/BaseThreadInfo'
import type { ThreadDetailRequest } from '@/proto/command/param/ThreadDetailRequest'
import type { ThreadDetail } from '@/proto/command/result/ThreadDetail'

const props = defineProps({
  instanceId: {
    type: String,
    required: true,
  },
})

const threadStatistic = ref<ThreadStatistic | undefined>(undefined)
const threadList = ref<BaseThreadInfo[]>([])
const refreshTimestamp = ref<number>()

const currentThreadId = ref<number | undefined>(undefined)
const threadDetail = ref<ThreadDetail | undefined>(undefined)
const showThreadDetail = ref<boolean>(false)
const threadDetailRefreshTimestamp = ref<number>()

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

const threadListTableColumns: TableColumns<BaseThreadInfo> = [
  { title: 'Id', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Group', key: 'group' },
  { title: 'CPU', key: 'cpu', defaultSortOrder: 'descend', sorter: 'default' },
  { title: 'State', key: 'state' },
  { title: 'Daemon', key: 'daemon' },
  { title: 'Priority', key: 'priority' },
  {
    title: 'Action',
    key: 'action',
    render: (row: BaseThreadInfo) => {
      return h(NButton, { onClick: () => createThreadDetailCommand(row.id), size: 'small' }, { default: () => 'Detail' })
    },
  },
]

function createThreadListCommand() {
  const params = {
    instanceId: props.instanceId,
    param: {},
  } as CommandCreateRequest<ThreadListRequest>
  commandCreateApi.createThreadListCommand(params)
}

function refreshThreadDetail(): void {
  if (currentThreadId.value)
    createThreadDetailCommand(currentThreadId.value)
}

function createThreadDetailCommand(id: number): void {
  if (!id)
    return

  if (threadDetail.value && threadDetail.value.id !== id) {
    threadDetail.value = undefined
    threadDetailRefreshTimestamp.value = 0
  }

  currentThreadId.value = id
  const params: CommandCreateRequest<ThreadDetailRequest> = {
    instanceId: props.instanceId,
    param: {
      id,
    },
  }
  commandCreateApi.createThreadDetail(params)
  showThreadDetail.value = true
}

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.THREAD_LIST.value) {
      const data = commandExecuteResponse.data as ThreadList
      threadStatistic.value = data.threadStatistic
      threadList.value = data.threads
      refreshTimestamp.value = commandExecuteResponse.timestamp
    }
    else if (commandExecuteResponse.code === commandEnum.THREAD_DETAIL.value) {
      const data = commandExecuteResponse.data as ThreadDetail
      if (currentThreadId.value === data.id) {
        threadDetail.value = data
        threadDetailRefreshTimestamp.value = commandExecuteResponse.timestamp
      }
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

  <!-- thread detail -->
  <n-modal v-model:show="showThreadDetail">
    <n-card title="Thread Detail" style="width: 800px" :bordered="false" size="huge" role="dialog" aria-modal="true">
      <template #footer>
        <AutoRefresh :refresh-timestamp="threadDetailRefreshTimestamp" :auto-refresh="false" @refresh="refreshThreadDetail" />
      </template>
      <n-descriptions label-placement="left" :columns="1" label-align="center" size="large">
        <n-descriptions-item>
          <template #label>
            Id
          </template><span font-bold>{{ threadDetail?.id }}</span>
        </n-descriptions-item>
        <n-descriptions-item>
          <template #label>
            Name
          </template><span font-bold>{{ threadDetail?.name }}</span>
        </n-descriptions-item>
        <n-descriptions-item>
          <template #label>
            State
          </template>
          <n-tag v-if="threadDetail?.threadState" :bordered="false" font-bold>
            {{ threadDetail?.threadState }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item>
          <template #label>
            Lock
          </template><span font-bold>{{ threadDetail?.lockName }}</span>
        </n-descriptions-item>
        <n-descriptions-item>
          <template #label>
            LockOwner
          </template>
          <n-tag
            v-if="threadDetail?.lockOwnerName" :bordered="false" font-bold
            @click="createThreadDetailCommand(threadDetail?.lockOwnerId as number)"
          >
            {{ `${threadDetail?.lockOwnerName}[${threadDetail?.lockOwnerId}]` }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item>
          <template #label>
            StackTrace
          </template>
          <n-list :bordered="false" clickable :show-divider="false">
            <n-list-item
              v-for="(node, index) of threadDetail?.stackTrace" :key="index"
              style="padding-left: 0; padding-right: 0; padding-bottom: 5;padding-top: 0"
            >
              <n-space inline font-semibold :wrap="false" align="start">
                <span>{{ node.declaringClass }}.{{ node.methodName }}#{{ node.lineNumber }}</span>
                <n-tag v-if="node.isNative" :bordered="false" size="small">
                  Native
                </n-tag>
              </n-space>
            </n-list-item>
          </n-list>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>
  </n-modal>
</template>

<style scoped>
.thread-statistic-card {
  min-width: 220px;
}
</style>
