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
  { title: 'ID', key: 'id', width: 60 },
  { title: 'Name', key: 'name', ellipsis: { tooltip: true } },
  { title: 'Group', key: 'group', width: 120 },
  { title: 'CPU', key: 'cpu', width: 80 },
  { title: 'State', key: 'state', width: 100 },
  { title: 'Priority', key: 'priority', width: 80 },
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
  <div class="dashboard-container">
    <AutoRefresh :refresh-timestamp="refreshTimestamp" class="refresh-control" @refresh="createOverviewCommand" />

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon thread">
          <Icon icon="ph:list-bullets-duotone" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Thread Count</div>
          <div class="stat-value">{{ threadStatistic?.threadCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon daemon">
          <Icon icon="ph:gear-duotone" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Daemon Threads</div>
          <div class="stat-value">{{ threadStatistic?.daemonThreadCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon peak">
          <Icon icon="ph:trend-up-duotone" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Peak Threads</div>
          <div class="stat-value">{{ threadStatistic?.peakThreadCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon total">
          <Icon icon="ph:chart-line-up-duotone" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Started</div>
          <div class="stat-value">{{ threadStatistic?.totalStartedThreadCount || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 数据表格区域 -->
    <div class="data-section">
      <div class="section-card full-width">
        <h3 class="section-title">Top 10 Threads</h3>
        <n-data-table
          :columns="threadsColumns"
          :data="threads"
          :bordered="false"
          :single-line="false"
          size="small"
        />
      </div>

      <div class="section-card">
        <h3 class="section-title">Heap Memory</h3>
        <n-data-table
          :columns="memoriesColumns"
          :data="heapMemories"
          :bordered="false"
          :render-cell="memoryTrans"
          size="small"
        />
      </div>

      <div class="section-card">
        <h3 class="section-title">Garbage Collection</h3>
        <n-data-table
          :columns="garbageCollectorColumns"
          :data="garbageCollectors"
          :bordered="false"
          size="small"
        />
      </div>

      <div class="section-card">
        <h3 class="section-title">Non-Heap Memory</h3>
        <n-data-table
          :columns="memoriesColumns"
          :data="nonHeapMemories"
          :bordered="false"
          :render-cell="memoryTrans"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.refresh-control {
  align-self: flex-end;
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

  &.thread {
    background: rgba(94, 106, 210, 0.1);
    color: #5E6AD2;
  }

  &.daemon {
    background: rgba(38, 181, 206, 0.1);
    color: #26B5CE;
  }

  &.peak {
    background: rgba(255, 197, 61, 0.1);
    color: #F5A524;
  }

  &.total {
    background: rgba(245, 71, 92, 0.1);
    color: #F5475C;
  }
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

.data-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.section-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &.full-width {
    grid-column: 1 / -1;
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  letter-spacing: -0.01em;
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
</style>
