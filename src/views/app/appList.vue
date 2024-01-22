<script setup lang="ts">
import type { Ref } from 'vue'
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import type { AppInfo, AppQueryRequest } from '@/api/types/appTypes'
import appApi from '@/api/appApi'

const router = useRouter()

const $table = ref<any>(null)

const queryParams: Ref<AppQueryRequest> = ref<AppQueryRequest>({} as AppQueryRequest)

const columns: TableColumns<any> = [
  { title: '应用名称', key: 'appName' },
  { title: '注册时间', key: 'registerDate' },
  { title: '实例数量', key: 'instanceNum' },
  {
    title: '操作',
    key: 'action',
    render(row: AppInfo) {
      return h(NButton, {
        size: 'small',
        type: 'primary',
        onClick: () => toInstanceList(row),
      }, {
        default: () => '实例列表',
      })
    },
  },
]

function toInstanceList(app: AppInfo) {
  router.push({ name: 'InstanceList', params: { appName: app.appName } })
}
</script>

<template>
  <common-page title="应用">
    <crud-table
      ref="$table" v-model:query-items="queryParams" :columns="columns" :get-data="appApi.appPageQuery"
      row-key="appId"
    >
      <template #queryBar>
        <query-bar-item label="应用名称" :label-width="80">
          <n-input v-model:value="queryParams.appName" placeholder="请输入应用名称" @keydown.enter="$table?.handleSearch()" />
        </query-bar-item>
      </template>
    </crud-table>
  </common-page>
</template>

<style scoped lang="scss">
</style>
