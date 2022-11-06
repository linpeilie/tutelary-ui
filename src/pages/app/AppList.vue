<template>
  <q-page padding>
    <q-form ref="queryFormRef" class="row q-gutter-md items-center q-mb-md" @submit="handleSearch" @reset="resetSearch">
      <q-input style="width: 20%" v-model="queryParams.appName" label="应用名称"/>
      <q-btn label="查询" type="submit" color="primary"/>
      <q-btn label="重置" type="reset" flat/>
    </q-form>

    <q-table :rows="tableData" :columns="tableColumns" row-key="appName" :loading="loading" :pagination="pagination" :rows-per-page-options="pageOptions">
      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <q-btn color="primary" label="详情"/>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import useTableData from 'src/composables/useTableData'

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
  },
  {
    name: 'action',
    label: '操作',
    align: 'center'
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
</script>

<style scoped>

</style>
