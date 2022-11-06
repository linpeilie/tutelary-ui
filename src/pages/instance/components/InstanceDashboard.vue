<template>
  <div class="q-pa-md row justify-evenly">
    <q-card style="width: 66%">
      <q-table
        :rows="threadList"
        :columns="threadColumns"
        separator="horizontal"
        title="Thread"
        flat
        row-key="name">
        <template v-slot:top-right>
          <div class="q-table__title">线程数 : {{ threadList.length }}</div>
        </template>
      </q-table>
    </q-card>
    <q-card style="width: 30%">
      <descriptions :column="2" title="Runtime">
        <description-item label="OS Name" :content="runtime.osName"/>
        <description-item label="OS Version" :content="runtime.osVersion"/>
        <description-item label="JavaHome" :content="runtime.javaHome" :span="2"/>
        <description-item label="javaVersion" :content="runtime.javaVersion" :span="2"/>
        <description-item label="processors" :content="runtime.processors" :span="2"/>
        <description-item label="uptime" :content="formatDate(runtime.uptime)" :span="2"/>
      </descriptions>
    </q-card>
  </div>
  <div class="q-pa-md row justify-evenly">
    <q-card style="width: 66%">
      <q-table
        :rows="memoryInfo"
        :columns="memoryColumns"
        separator="horizontal"
        title="Memory"
        flat
        hide-pagination
        row-key="name">
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th auto-width/>
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td auto-width>
              <q-icon size="sm" :name="props.expand ? 'expand_more' : 'chevron_right'"
                      @click="props.expand = !props.expand"/>
            </q-td>
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.value || '-' }}
            </q-td>
          </q-tr>
          <q-tr v-show="props.expand" :props="props" v-for="child in props.row.children">
            <q-td></q-td>
            <q-td v-for="col in props.cols" :key="col.name + '-' + child.name" class="text-center text-weight-light">
              {{ child[col.field] }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <q-card style="width: 30%">
      <q-table
        :rows="garbageCollectors"
        :columns="garbageCollectorsColumns"
        separator="horizontal"
        title="GarbageCollector"
        flat
        hide-pagination
        row-key="name"></q-table>
    </q-card>
  </div>
  <auto-refresh-sticky :update-time="updateTime"
                       @refresh="refresh"/>
</template>

<script setup>
import { onMounted, onUnmounted, ref, inject, watch, computed } from 'vue'
import { onCommand, offCommand } from 'boot/eventbus'
import { useStore } from 'vuex'
import { formatDate } from 'src/utils/date'
import { divide } from 'src/utils/math'
import dayjs from 'dayjs'
import AutoRefreshSticky from 'pages/instance/components/AutoRefreshSticky.vue'
import useGetGlobalProperties from 'src/composables/useGetGlobalProperties'
import { dashboardCommandCode } from 'src/proto/commandProto'

const store = useStore()
const globalProperties = useGetGlobalProperties()

const instance = inject('instance')

const instanceId = computed(() => {
  return instance.value.instanceId
})

watch(instanceId, (val) => {
  sendDashboradCommand(val)
})

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
    sortable: true,
    format: val => `${val} ms`
  },
  {
    name: 'Daemon',
    label: 'Daemon',
    field: 'daemon',
    align: 'center'
  }
]

const memoryColumns = [
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'center'
  },
  {
    name: 'used',
    label: 'Used',
    field: 'used',
    align: 'center',
    format: (val, row) => `${val < 0 ? '-' : divide(val, 1048576, 2) + ' M'}`
  },
  {
    name: 'total',
    label: 'Total',
    field: 'total',
    align: 'center',
    format: (val, row) => `${val < 0 ? '-' : divide(val, 1048576, 2) + ' M'}`
  },
  {
    name: 'max',
    label: 'Max',
    field: 'max',
    align: 'center',
    format: (val, row) => `${val < 0 ? '-' : divide(val, 1048576, 2) + ' M'}`
  },
  {
    name: 'useRatio',
    label: 'Use Ratio',
    field: 'useRatio',
    align: 'center'
  }
]

const garbageCollectorsColumns = [
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'center'
  },
  {
    name: 'collectionCount',
    label: 'CollectionCount',
    field: 'collectionCount',
    align: 'center'
  },
  {
    name: 'collectionTime',
    label: 'CollectionTime',
    field: 'collectionTime',
    align: 'center',
    format: val => `${val} ms`
  },
]

const threadList = ref([])

const runtime = ref({})

const memoryInfo = ref([])

const garbageCollectors = ref([])

const updateTime = ref('')

const handleDashboardMessage = (message) => {
  updateTime.value = dayjs().format('MM-DD HH:mm:ss')
  if (message.status) {
    threadList.value = message.data.threads || []
    runtime.value = message.data.runtime || {}
    garbageCollectors.value = message.data.garbageCollectors || []
    let memoryInfoList = []
    let memoryData = message.data.memoryInfo || {}
    if (!memoryData.heap) {
      return
    }
    const heapChildren = memoryData.heap.slice(1)
    heapChildren.forEach(v => {
      v.useRatio = divide(v.used, v.max, 2) + '%'
      v.used = divide(v.used, 1048576, 2) + ' M'
      v.total = divide(v.total, 1048576, 2) + ' M'
      v.max = divide(v.max, 1048576, 2) + ' M'
    })
    const heap = {
      ...memoryData.heap[0],
      children: heapChildren,
      useRatio: divide(memoryData.heap[0].used, memoryData.heap[0].max, 2) + '%'
    }
    const nonHeapChildren = memoryData.nonHeap.slice(1)
    nonHeapChildren.forEach(v => v.max = '-')
    const nonHeap = {
      ...memoryData.nonHeap[0],
      children: nonHeapChildren
    }
    const bufferPoolChildren = memoryData.bufferPool.slice(1)
    bufferPoolChildren.forEach(v => v.max = '-')
    const bufferPool = {
      ...memoryData.bufferPool[0],
      children: bufferPoolChildren
    }
    memoryInfoList.push(heap)
    memoryInfoList.push(nonHeap)
    memoryInfoList.push(bufferPool)
    memoryInfo.value = memoryInfoList
  }
}

const refresh = () => {
  if (instanceId.value) {
    sendDashboradCommand(instanceId.value)
  }
}

const sendDashboradCommand = (instanceId) => {
  const param = {
    commandType: globalProperties.$arthasType,
    instanceId: instanceId,
    command: 'dashboard',
    commandCode: dashboardCommandCode
  }
  store.dispatch('sendMessage', {
    cmd: globalProperties.$commandRequestCmd,
    message: param
  })
}

onMounted(() => {
  onCommand(globalProperties.$arthasType, dashboardCommandCode, handleDashboardMessage)
  refresh()
})
onUnmounted(() => {
  offCommand(globalProperties.$arthasType, dashboardCommandCode, handleDashboardMessage)
})
</script>

<style scoped lang="scss">
</style>
