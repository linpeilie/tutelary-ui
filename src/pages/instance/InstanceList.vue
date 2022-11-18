<template>
  <q-page padding>
  </q-page>
</template>

<script setup>
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

onBeforeMount(() => {
  console.log('route.query', route.query.appName)
  if (!route.query.appName) {
    router.push('/app/list')
  } else {
    queryParams.value.appName = route.query.appName
  }
})

</script>

<style scoped>

</style>
