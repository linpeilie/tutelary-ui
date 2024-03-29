<script setup lang="ts">
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import { NDataTable, NDescriptions, NDescriptionsItem } from 'naive-ui'
import type { SelectBaseOption } from 'naive-ui/es/select/src/interface'
import AutoRefresh from './AutoRefresh.vue'
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import { commandEnum } from '@/enums/commandEnums'
import type { LoggerInfoRequest } from '@/proto/command/param/LoggerInfoRequest'
import type { LoggerInfoResponse } from '@/proto/command/result/LoggerInfoResponse'
import eventbus from '@/utils/eventbus'
import type { LoggerInfo } from '@/proto/command/domain/LoggerInfo'
import type { LoggerAppender } from '@/proto/command/domain/LoggerAppender'

const props = defineProps({
  instanceId: { type: String, required: true },
})

const getLoggerParam = ref({
  name: '',
  includeNoAppender: 0,
  classLoaderHashCode: '',
})

const includeNoAppenderOptions: SelectBaseOption[] = [
  { label: 'True', value: 1 },
  { label: 'False', value: 0 },
]

const appendersColumns: TableColumns<LoggerAppender> = [
  { title: 'Name', key: 'name' },
  { title: 'Target', key: 'target' },
  { title: 'File', key: 'file' },
]

const columns: TableColumns<LoggerInfo> = [
  {
    type: 'expand',
    renderExpand: (row) => {
      return h(
        NDescriptions,
        { size: 'small', column: 1, labelPlacement: 'left', style: { padding: '10px' } },
        {
          default: () => [
            h(NDescriptionsItem, null, { label: () => 'Name', default: () => row.name }),
            h(NDescriptionsItem, null, { label: () => 'Level', default: () => row.level && row.level !== '' ? row.level : row.effectiveLevel }),
            h(NDescriptionsItem, null, { label: () => 'Config', default: () => row.config }),
            h(NDescriptionsItem, null, { label: () => 'CodeSource', default: () => row.codeSource }),
            h(NDescriptionsItem, null, { label: () => 'Class', default: () => row.clazz }),
            h(NDescriptionsItem, null, { label: () => 'ClassLoader', default: () => row.classLoader }),
            h(NDescriptionsItem, null, { label: () => 'ClassLoaderHash', default: () => row.classLoaderHash }),
            h(NDescriptionsItem, null, { label: () => 'Additivity', default: () => row.additivity }),
            h(NDescriptionsItem, null, {
              label: () => 'Appenders',
              default: () => h(NDataTable, { columns: appendersColumns, data: row.appenders, bordered: false }),
            }),
          ],
        },
      )
    },
  },
  { title: 'Name', key: 'name', minWidth: 200 },
  {
    title: 'Level',
    key: 'level',
    minWidth: 100,
    render: (row) => {
      return row.level && row.level !== '' ? row.level : row.effectiveLevel
    },
  },
  { title: 'ClassLoader', key: 'classLoader', minWidth: 120 },
  { title: 'ClassLoaderHash', key: 'classLoaderHash', minWidth: 130 },
  { title: 'Class', key: 'clazz', minWidth: 200 },
]

const loggers = ref<LoggerInfo[]>([])

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.LOGGER_INFO.value) {
      const data = commandExecuteResponse.data as LoggerInfoResponse
      loggers.value = data.loggers
    }
  })
  getLoggerInfo()
})

onBeforeUnmount(() => {
  eventbus.off('command')
})

function getLoggerInfo() {
  if (!props.instanceId)
    return

  const params: CommandCreateRequest<LoggerInfoRequest> = {
    instanceId: props.instanceId,
    param: {
      name: getLoggerParam.value.name,
      includeNoAppender: getLoggerParam.value.includeNoAppender === 1,
      classLoaderHashCode: getLoggerParam.value.classLoaderHashCode,
    },
  }
  commandCreateApi.createLoggerInfo(params)
}
</script>

<template>
  <AutoRefresh :auto-refresh="false" @refresh="getLoggerInfo" />
  <n-space
    bg="#fafafc" :size="[15, 35]" align="center"
    dard:bg-black mt-10 min-h-60 flex items-start justify-between b-1 rounded-8 p-15 bc-fff
  >
    <div flex items-center>
      <label w-60 flex-shrink-0>Name</label>
      <div flex-shrink-0>
        <n-input v-model:value="getLoggerParam.name" @keyup.enter="getLoggerInfo" />
      </div>
    </div>
    <div flex items-center>
      <label w-150 flex-shrink-0>IncludeNoAppender</label>
      <n-popover trigger="hover">
        <template #trigger>
          <div flex-shrink-0 style="width: 100px">
            <n-select
              v-model:value="getLoggerParam.includeNoAppender" :options="includeNoAppenderOptions"
              @update:value="getLoggerInfo"
            />
          </div>
        </template>
        <span>请谨慎选择True，可能会返回大量数据</span>
      </n-popover>
    </div>
    <div flex items-center>
      <label w-100 flex-shrink-0>ClassLoader</label>
      <div flex-shrink-0>
        <n-input v-model:value="getLoggerParam.classLoaderHashCode" @keyup.enter="getLoggerInfo" />
      </div>
    </div>
  </n-space>
  <NDataTable size="small" :columns="columns" :data="loggers" :row-key="row => row.name" mt-15 :bordered="false" />
</template>

<style scoped>
</style>
