<template>
  <div>
    <q-table
      :rows="threadList"
      :columns="columns"
      separator="horizontal"
      hide-pagination
      flat
      row-key="id">
      <template v-slot:top>
        <div class="col-2 q-table__title">Thread</div>
        <q-space/>
        <div class="q-table__title">线程数 : {{ threadList.length }}</div>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { onCommand, offCommand } from 'boot/eventbus'
import { useStore } from 'vuex'

const store = useStore()

const columns = ref([
  {
    name: 'ID',
    label: 'ID',
    field: 'id',
    align: 'center'
  },
  {
    name: 'Name',
    label: 'Name',
    field: 'name',
    align: 'center'
  },
  {
    name: 'Group',
    label: 'Group',
    field: 'group',
    align: 'center'
  },
  {
    name: 'State',
    label: 'State',
    field: 'state',
    align: 'center'
  },
  {
    name: 'CPU',
    label: 'CPU(%)',
    field: 'cpu',
    align: 'center',
    sortable: true
  },
  {
    name: 'Time',
    label: 'Time',
    field: 'time',
    align: 'center',
    sortable: true
  },
  {
    name: 'Daemon',
    label: 'Daemon',
    field: 'daemon',
    align: 'center'
  }
])

const threadList = ref([])

const handleDashboardMessage = (message) => {
  console.log('meeeee', message)
  if (message.status) {
    threadList.value = message.data.threads
  }
}

onMounted(() => {
  console.log('InstanceDashboard onMounted')
  onCommand('arthas', 'dashboard', handleDashboardMessage)
  const param = {
    commandType: 'arthas',
    instanceId: 'ea417d983e8447ceae064e69fc34142e',
    command: 'dashboard'
  }
  store.dispatch('sendMessage', {
    cmd: 3,
    message: param
  })
})
onUnmounted(() => {
  console.log('InstanceDashboard onUnmounted')
  offCommand('arthas', 'dashboard', handleDashboardMessage)
})
</script>

<style scoped lang="scss">
</style>
