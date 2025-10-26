<script setup lang="ts">
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import type { ComputedRef } from 'vue'
import { h, onMounted } from 'vue'
import { NButton, NTag } from 'naive-ui'
import { Icon } from '@iconify/vue'
import AutoRefresh from './AutoRefresh.vue'
import StackTrace from './StackTrace.vue'
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
import { threadStates } from '@/enums/threadStateEnums'

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

// filter
const keyword = ref<string>('')
const selectedState = ref<string | null>(null)

const threadStatisticList = computed(() => {
  if (threadStatistic.value) {
    return [
      { label: 'Total Threads', value: threadStatistic.value?.threadCount, icon: 'ph:list-bullets-duotone', color: '#5E6AD2' },
      { label: 'Daemon Threads', value: threadStatistic.value?.daemonThreadCount, icon: 'ph:gear-duotone', color: '#26B5CE' },
      { label: 'Peak Threads', value: threadStatistic.value?.peakThreadCount, icon: 'ph:trend-up-duotone', color: '#F5A524' },
      { label: 'Total Started', value: threadStatistic.value?.totalStartedThreadCount, icon: 'ph:chart-line-up-duotone', color: '#F5475C' },
    ]
  }
  else {
    return []
  }
})

const threadStateStatistic: ComputedRef<{
  [key: string]: number
}> = computed(() => {
  let _new = 0
  let _runnable = 0
  let _blocked = 0
  let _waiting = 0
  let _timedWaiting = 0
  let _terminated = 0
  if (threadList.value) {
    _new = threadList.value.filter(v => v.state === threadStates.NEW.value).length
    _runnable = threadList.value.filter(v => v.state === threadStates.RUNNABLE.value).length
    _blocked = threadList.value.filter(v => v.state === threadStates.BLOCKED.value).length
    _waiting = threadList.value.filter(v => v.state === threadStates.WAITING.value).length
    _timedWaiting = threadList.value.filter(v => v.state === threadStates.TIMED_WAITING.value).length
    _terminated = threadList.value.filter(v => v.state === threadStates.TERMINATED.value).length
  }
  return {
    NEW: _new,
    RUNNABLE: _runnable,
    BLOCKED: _blocked,
    WAITING: _waiting,
    TIMED_WAITING: _timedWaiting,
    TERMINATED: _terminated,
  } as { [key: string]: number }
})

const filteredThreadList: ComputedRef<BaseThreadInfo[]> = computed(() => {
  if (!threadList.value || threadList.value.length === 0)
    return []

  let result = threadList.value
  if (keyword.value && keyword.value.length > 0) {
    result = result.filter(thread => thread.name.toLocaleLowerCase().includes(keyword.value.toLocaleLowerCase())
      || thread.group.toLowerCase().includes(keyword.value.toLocaleLowerCase()))
  }
  if (selectedState.value) {
    result = result.filter(thread => thread.state === selectedState.value)
  }
  return result
})

const threadListTableColumns: TableColumns<BaseThreadInfo> = [
  { title: 'Id', key: 'id', width: 60 },
  { title: 'Name', key: 'name', ellipsis: { tooltip: true } },
  { title: 'Group', key: 'group', width: 120, ellipsis: { tooltip: true } },
  { title: 'CPU', key: 'cpu', width: 80, defaultSortOrder: 'descend', sorter: 'default' },
  {
    title: 'State',
    key: 'state',
    width: 120,
    render: (row: BaseThreadInfo) => {
      const stateConfig = Object.values(threadStates).find(s => s.value === row.state)
      return h(NTag, {
        type: stateConfig?.tag?.type || 'default',
        size: 'small',
        bordered: false,
      }, { default: () => stateConfig?.label || row.state })
    },
  },
  { title: 'Daemon', key: 'daemon', width: 80 },
  { title: 'Priority', key: 'priority', width: 80 },
  {
    title: 'Action',
    key: 'action',
    width: 100,
    render: (row: BaseThreadInfo) => {
      return h(NButton, {
        onClick: () => createThreadDetailCommand(row.id),
        size: 'small',
        secondary: true,
      }, { default: () => 'Detail' })
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
  <div class="thread-container">
    <div class="header-section">
      <AutoRefresh :refresh-timestamp="refreshTimestamp" @refresh="createThreadListCommand" />
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div v-for="stat in threadStatisticList" :key="stat.label" class="stat-card">
        <div class="stat-icon" :style="{ background: `${stat.color}15`, color: stat.color }">
          <Icon :icon="stat.icon" />
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </div>
      </div>
    </div>

    <!-- 过滤和状态 -->
    <div class="filter-section">
      <div class="state-badges">
        <button
          v-for="state of threadStates"
          :key="state.value"
          class="state-badge"
          :class="{ active: selectedState === state.value }"
          @click="selectedState = selectedState === state.value ? null : state.value"
        >
          <span class="state-label">{{ state.label }}</span>
          <span class="state-count">{{ threadStateStatistic[state.value as string] }}</span>
        </button>
      </div>
      
      <div class="search-box">
        <Icon icon="ph:magnifying-glass" class="search-icon" />
        <input
          v-model="keyword"
          type="text"
          placeholder="Search threads..."
          class="search-input"
        >
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <n-data-table
        :columns="threadListTableColumns"
        :data="filteredThreadList"
        :bordered="false"
        size="small"
      />
    </div>

    <!-- Thread Detail Modal -->
    <n-modal v-model:show="showThreadDetail" class="thread-detail-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">Thread Detail</h2>
          <button class="modal-close" @click="showThreadDetail = false">
            <Icon icon="ph:x" />
          </button>
        </div>

        <div class="modal-body cus-scroll-y">
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">
                <Icon icon="ph:hash-duotone" class="detail-icon" />
                ID
              </div>
              <div class="detail-value">{{ threadDetail?.id }}</div>
            </div>

            <div class="detail-item">
              <div class="detail-label">
                <Icon icon="ph:tag-duotone" class="detail-icon" />
                Name
              </div>
              <div class="detail-value">{{ threadDetail?.name }}</div>
            </div>

            <div class="detail-item">
              <div class="detail-label">
                <Icon icon="ph:activity-duotone" class="detail-icon" />
                State
              </div>
              <n-tag v-if="threadDetail?.threadState" :bordered="false" size="small">
                {{ threadDetail?.threadState }}
              </n-tag>
            </div>

            <div class="detail-item">
              <div class="detail-label">
                <Icon icon="ph:lock-duotone" class="detail-icon" />
                Lock
              </div>
              <div class="detail-value">{{ threadDetail?.lockName || '-' }}</div>
            </div>

            <div v-if="threadDetail?.lockOwnerName" class="detail-item full-width">
              <div class="detail-label">
                <Icon icon="ph:user-duotone" class="detail-icon" />
                Lock Owner
              </div>
              <n-tag
                :bordered="false"
                size="small"
                class="clickable-tag"
                @click="createThreadDetailCommand(threadDetail?.lockOwnerId as number)"
              >
                {{ `${threadDetail?.lockOwnerName}[${threadDetail?.lockOwnerId}]` }}
              </n-tag>
            </div>

            <div class="detail-item full-width">
              <div class="detail-label">
                <Icon icon="ph:stack-duotone" class="detail-icon" />
                Stack Trace
              </div>
              <StackTrace :stack-trace="threadDetail?.stackTrace" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <AutoRefresh
            :refresh-timestamp="threadDetailRefreshTimestamp"
            :auto-refresh="false"
            @refresh="refreshThreadDetail"
          />
        </div>
      </div>
    </n-modal>
  </div>
</template>

<style scoped lang="scss">
.thread-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: flex-end;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transform: translateY(-1px);
  }
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  font-size: 24px;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  line-height: 1;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.state-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.state-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
  }

  &.active {
    background: rgba(94, 106, 210, 0.1);
    border-color: #5E6AD2;
    color: #5E6AD2;

    .state-count {
      background: rgba(94, 106, 210, 0.2);
      color: #5E6AD2;
    }
  }
}

.state-label {
  color: #374151;
}

.state-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 18px;
  color: #9CA3AF;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  background: #fff;
  outline: none;
  transition: all 0.15s;

  &::placeholder {
    color: #9CA3AF;
  }

  &:hover {
    border-color: rgba(0, 0, 0, 0.15);
  }

  &:focus {
    border-color: #5E6AD2;
    box-shadow: 0 0 0 3px rgba(94, 106, 210, 0.1);
  }
}

.table-container {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 20px;
  overflow: hidden;
}

:deep(.n-data-table) {
  .n-data-table-th {
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: transparent;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .n-data-table-td {
    font-size: 13px;
    color: #374151;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  .n-data-table-tr:last-child .n-data-table-td {
    border-bottom: none;
  }

  .n-data-table-tr:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.thread-detail-modal {
  :deep(.n-modal) {
    max-width: 800px;
    width: 90%;
  }
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 20px;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #374151;
  }
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-icon {
  font-size: 14px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.clickable-tag {
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: flex-end;
}
</style>
