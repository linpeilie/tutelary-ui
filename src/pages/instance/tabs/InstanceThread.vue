<template>
  <div class="row">
    <q-card class="q-pa-md q-ma-md col-2" style="min-width: 200px">
      <div class="text-grey text-weight-bolder">线程数量</div>
      <div class="text-h5 text-weight-bold">{{ threadStatistic.threadCount || 0}}</div>
    </q-card>
    <q-card class="q-pa-md q-ma-md col-2" style="min-width: 200px">
      <div class="text-grey text-weight-bolder">非守护线程数量</div>
      <div class="text-h5 text-weight-bold">{{ threadStatistic.daemonThreadCount || 0}}</div>
    </q-card>
    <q-card class="q-pa-md q-ma-md col-2" style="min-width: 200px">
      <div class="text-grey text-weight-bolder">线程数量峰值</div>
      <div class="text-h5 text-weight-bold">{{ threadStatistic.peakThreadCount || 0}}</div>
    </q-card>
    <q-card class="q-pa-md q-ma-md col-2" style="min-width: 200px">
      <div class="text-grey text-weight-bolder">启动过的线程总数</div>
      <div class="text-h5 text-weight-bold">{{ threadStatistic.totalStartedThreadCount || 0}}</div>
    </q-card>
  </div>
  <div class="q-pa-md">
    <q-table :rows="showThreadList"
             :columns="threadColumns"
             separator="horizontal"
             flat
             bordered
             row-key="id"
             @row-click="handleRowClick"
             table-header-class="text-weight-bold">
      <template #top-left>
        <div class="row inline items-center">
          <div class="q-gutter-sm">
            <q-chip v-for="state in stateConfig"
                    v-model:selected="statesSelected[state.label]"
                    square
                    clickable
                    :color="state.color"
                    text-color="white"
                    :outline="!statesSelected[state.label]">{{ state.label }}
              <q-badge floating rounded color="secondary">{{ threadStateCont[state.label] || 0 }}</q-badge>
            </q-chip>
          </div>
        </div>
      </template>
      <template #top-right>
        <q-input v-model="threadKeyword" label="Thread Keyword" filled dense>
          <template #after>
            <q-btn rounded flat icon="refresh" @click="sendThreadListCommand"/>
            <span class="text-body1">{{ updatedTime }}</span>
          </template>
        </q-input>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted, inject, computed, reactive} from 'vue'
import {useStore} from "vuex"
import useGetGlobalProperties from "src/composables/useGetGlobalProperties"
import {threadListCommand, threadDetailCommand} from "src/proto/commandProto"
import _ from 'lodash'
import {date} from 'quasar'

const store = useStore()
const globalProperties = useGetGlobalProperties()

const instanceId = inject('instanceId')

const onCommand = inject('onCommand')
const offCommand = inject('offCommand')

const threadColumns = [
  {name: 'id', label: 'ID', field: 'id', align: 'center', sortable: true},
  {name: 'name', label: 'Name', field: 'name', align: 'center'},
  {name: 'group', label: 'Group', field: 'group', align: 'center'},
  {name: 'priority', label: 'Priority', field: 'priority', align: 'center', sortable: true},
  {name: 'state', label: 'State', field: 'state', align: 'center'},
  {name: 'cpu', label: 'CPU(%)', field: 'cpu', align: 'center', sortable: true},
  {name: 'daemon', label: 'Daemon', field: 'daemon', align: 'center'},
]

const statesSelected = reactive({
  NEW: true,
  RUNNABLE: true,
  BLOCKED: true,
  WAITING: true,
  TIMED_WAITING: true,
  TERMINATED: true
})

const stateConfig = [
  {label: 'NEW', color: 'primary'},
  {label: 'RUNNABLE', color: 'positive'},
  {label: 'BLOCKED', color: 'negative'},
  {label: 'WAITING', color: 'warning'},
  {label: 'TIMED_WAITING', color: 'warning'},
  {label: 'TERMINATED'},
]

const threadKeyword = ref('')

const updatedTime = ref('')

const threadList = ref([])

const threadStatistic = ref({})

const threadStateCont = ref({})

const showThreadList = computed(() => {
  return _.filter(threadList.value, threadItem => {
    let selected = statesSelected[threadItem.state]
    if (!selected) {
      return false
    }
    if (threadKeyword.value) {
      return threadItem.name.toLowerCase().indexOf(threadKeyword.value.toLowerCase()) > -1
        || threadItem.group.toLowerCase().indexOf(threadKeyword.value.toLowerCase()) > -1
    }
    return true
  })
})

onMounted(() => {
  onCommand(globalProperties.$tutelaryType, threadListCommand, handleThreadListMessage)
  sendThreadListCommand()
})

onUnmounted(() => {
  offCommand(globalProperties.$tutelaryType, threadListCommand)
})

const sendThreadListCommand = () => {
  const threadListParam = {
    instanceId: instanceId,
    commandType: globalProperties.$tutelaryType,
    commandCode: threadListCommand,
    param: {}
  }
  store.dispatch('sendMessage', {
    cmd: globalProperties.$commandRequestCmd,
    message: threadListParam
  })
}

const handleThreadListMessage = (message) => {
  updatedTime.value = date.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss')
  threadList.value = message.data.threads
  threadStatistic.value = message.data.threadStatistic
  calcStateCont(threadList.value)
}

const calcStateCont = (threadList) => {
  const stateList = threadList.map(item => item.state)
  threadStateCont.value = stateList.reduce((prev, next) => {
    prev[next] = (prev[next] + 1) || 1
    return prev
  }, {})
}

const handleRowClick = (evt, row, index) => {
  const threadDetailParam = {
    instanceId: instanceId,
    commandType: globalProperties.$tutelaryType,
    commandCode: threadDetailCommand,
    param: {
      "id": row.id
    }
  }
  store.dispatch('sendMessage', {
    cmd: globalProperties.$commandRequestCmd,
    message: threadDetailParam
  })
}

</script>

<style scoped lang="scss">
</style>
