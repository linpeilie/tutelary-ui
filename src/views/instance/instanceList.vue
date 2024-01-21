<script setup lang="ts">
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import { useRoute } from 'vue-router'
import { NButton } from 'naive-ui'
import instanceApi from '@/api/instanceApi'
import type { InstanceInfo } from '@/api/types/instanceTypes'

const route = useRoute()

const $table = ref<any>(null)

const appName = ref<string>('')

const columns: TableColumns<any> = [
  { title: '实例ID', key: 'instanceId' },
  { title: '应用名称', key: 'appName' },
  { title: 'IP', key: 'ip' },
  { title: '注册时间', key: 'registerDate' },
  { title: '启动时间', key: 'startTime' },
  {
    title: '操作',
    key: 'action',
    render(row: InstanceInfo) {
      return h(
        NButton,
        { size: 'small', type: 'primary', onClick: () => toInstanceDetail() },
        { default: () => '实例详情' },
      )
    },
  },
]

function loadInstances() {
  return instanceApi.listByAppName(appName.value)
}

function toInstanceDetail() {
}

onMounted(() => {
  const params = route.params
  appName.value = params.appName as string
  $table?.value.handleSearch()
})
</script>

<template>
  <common-page title="应用实例">
    <template #action>
      <NButton type="primary" @click="$table?.handleSearch()">
        刷新
      </NButton>
    </template>
    <crud-table ref="$table" :columns="columns" :get-data="loadInstances" row-key="instanceId" :auto-search="false" />
  </common-page>
</template>

<style scoped lang="scss">
</style>
