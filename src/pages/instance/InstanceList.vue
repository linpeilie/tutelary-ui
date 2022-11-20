<template>
  <q-page padding>
    <q-btn flat round icon="arrow_back" size="md" @click="router.back()"/>

    <q-card class="q-my-md q-py-md">
      <q-card-section>
        <div class="text-h5">
          <q-icon name="widgets"/>
          {{ appName }}
        </div>
      </q-card-section>
    </q-card>

    <q-card class="q-pa-md">
      <q-table :rows="tableData"
               :columns="tableColumns"
               row-key="instanceId"
               :loading="loading"
               :pagination="pagination"
               :rows-per-page-options="pageOptions"
               @row-click="handleRowClick">
        <template v-slot:top-left>
          <q-btn flat round icon="refresh" size="md"/>
        </template>
        <template v-slot:top-right>
          <q-input filled label="关键字" placeholder="实例名称、IP等">
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
        </template>
        <template v-slot:body-cell-state="props">
          <q-td :props="props">
            <q-icon name="r_rectangle" size="sm" :color="props.value === 'VALID' ? 'positive' : 'negative'"/>
          </q-td>
        </template>
      </q-table>
    </q-card>

  </q-page>
</template>

<script setup>
import {onBeforeMount, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import useTableData from 'src/composables/useTableData'

const route = useRoute()
const router = useRouter()

const url = {
  list: '/api/instance/pageQuery'
}

const tableColumns = [
  {
    name: 'instanceId',
    label: '实例ID',
    align: 'center',
    field: 'instanceId'
  },
  {
    name: 'ip',
    label: 'IP',
    align: 'center',
    field: 'ip'
  },
  {
    name: 'registerDate',
    label: '注册时间',
    align: 'center',
    field: 'registerDate'
  },
  {
    name: 'startTime',
    label: '启动时间',
    align: 'center',
    field: 'startTime'
  },
  {
    name: 'state',
    label: '状态',
    align: 'center',
    field: 'state'
  }
]

const appName = ref('')

const {
  queryParams,
  tableData,
  handleSearch,
  resetSearch,
  loading,
  pagination,
  pageOptions
} = useTableData(url)

onBeforeMount(() => {
  if (!route.query.appName) {
    router.push('/')
  } else {
    appName.value = route.query.appName
    queryParams.value.appName = route.query.appName
  }
})

const handleRowClick = (evt, row, index) => {
  router.push({
    path: `/instance/${row.instanceId}`
  })
}

</script>

<style scoped>

</style>
