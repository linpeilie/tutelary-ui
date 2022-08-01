<template>
  <div class="q-pa-md row justify-evenly">
    <q-card class="col-8">
      <q-table
        :rows="threadList"
        :columns="threadColumns"
        separator="horizontal"
        hide-pagination
        title="Thread"
        flat
        row-key="id">
        <template v-slot:top-right>
          <div class="q-table__title">线程数 : {{ threadList.length }}</div>
        </template>
      </q-table>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, inject, watch, computed } from 'vue'
import { onCommand, offCommand } from 'boot/eventbus'
import { useStore } from 'vuex'

const store = useStore()

const instance = inject('instance')

const instanceId = computed(() => {
  return instance.value.instanceId
})

watch(instanceId, (current, prev) => {
    sendDashboradCommand(current)
  }
)

const threadColumns = [
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
]

const threadList = ref([])

const runtime = ref({})

const memoryInfo = ref({})

const garbageCollectors = ref([])

const handleDashboardMessage = (message) => {
  console.log('dashboard message ', message)
  if (message.status) {
    threadList.value = message.data.threads
    runtime.value = message.data.runtime
    memoryInfo.value = message.data.memoryInfo
    garbageCollectors.value = message.data.garbageCollectors
  }
}

const sendDashboradCommand = (instanceId) => {
  const param = {
    commandType: 'arthas',
    instanceId: instanceId,
    command: 'dashboard'
  }
  store.dispatch('sendMessage', {
    cmd: 3,
    message: param
  })
}

onMounted(() => {
  onCommand('arthas', 'dashboard', handleDashboardMessage)
})
onUnmounted(() => {
  offCommand('arthas', 'dashboard', handleDashboardMessage)
})
</script>

<style scoped lang="scss">
</style>
