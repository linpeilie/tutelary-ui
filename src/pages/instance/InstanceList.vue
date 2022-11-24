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
        <template v-slot:top-right>
          <q-input v-model="keyword"
                   filled
                   label="关键字"
                   @keyup.enter="query"
                   placeholder="实例ID、IP等">
            <template v-slot:append>
              <q-icon name="search" @click="query"/>
            </template>
          </q-input>
        </template>
        <template v-slot:header-cell-state>
          <q-th>
            <q-btn-dropdown auto-close stretch flat label="状态">
              <q-list>
                <q-item v-for="option in stateOptions"
                        clickable
                        @click="handleStateClick(option.value)"
                        :active="selectedStates.indexOf(option.value) !== -1">
                  <q-item-section>{{ option.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </q-th>
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
import { Notify } from 'quasar'

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

const selectedStates = ref([1])

const stateOptions = [
  { label: '有效的', value: 1 },
  { label: '无效的', value: 0 }
]

const appName = ref('')

const keyword = ref('')

const {
  queryParams,
  tableData,
  handleSearch,
  resetSearch,
  loading,
  pagination,
  pageOptions
} = useTableData(url)

const query = () => {
  queryParams.value.states = selectedStates.value
  queryParams.value.keyword = keyword.value
  handleSearch()
}

onBeforeMount(() => {
  if (!route.query.appName) {
    router.push('/')
  } else {
    appName.value = route.query.appName
    queryParams.value.appName = route.query.appName
    query()
  }
})

const handleRowClick = (evt, row, index) => {
  router.push({
    path: `/instance/${row.instanceId}`
  })
}

const handleStateClick = (val) => {
  console.log('val', val)
  let index = selectedStates.value.indexOf(val)
  const isContains = index !== -1
  if (!isContains) {
    selectedStates.value.push(val)
    query()
    return
  }
  if (selectedStates.value.length === 1) {
    Notify.create({
      type: 'warning',
      message: '至少选择一项',
      position: 'top-right'
    })
    return
  }
  selectedStates.value.splice(index, 1)
  query()
}

</script>

<style scoped>

</style>
