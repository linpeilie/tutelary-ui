<template>
  <q-page padding>
    <q-form ref="queryFormRef" class="row q-gutter-md items-center q-mb-md" @submit="handleSearch" @reset="resetSearch">
      <q-input style="width: 20%" v-model="queryParams.appName" label="应用名称"/>
      <q-btn label="查询" type="submit" color="primary"/>
      <q-btn label="重置" type="reset" flat/>
    </q-form>

    <q-table :rows="tableData"
             :columns="tableColumns"
             row-key="appName"
             :loading="loading"
             :pagination="pagination"
             :rows-per-page-options="pageOptions"
             @row-click="handleRowClick">
    </q-table>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import useTableData from 'src/composables/useTableData'

const router = useRouter()

const url = {
  list: '/api/app/pageQuery'
}

const tableColumns = [
  {
    name: 'appName',
    label: '应用名称',
    align: 'center',
    field: 'appName'
  },
  {
    name: 'instanceNum',
    label: '实例数',
    align: 'center',
    field: 'instanceNum'
  },
  {
    name: 'registerDate',
    label: '注册时间',
    align: 'center',
    field: 'registerDate'
  }
]

const {
  queryParams,
  tableData,
  handleSearch,
  resetSearch,
  loading,
  pagination,
  pageOptions
} = useTableData(url)

const handleRowClick = (evt, row, index) => {
  router.push({
    path: '/instance/list',
    query: {
      appName: row.appName
    }
  })
}


</script>

<style scoped>

</style>
