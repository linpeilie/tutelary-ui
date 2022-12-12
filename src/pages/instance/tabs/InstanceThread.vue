<template>
  <div class="row">
    <q-card class="q-pa-md q-ma-md col-2" style="min-width: 200px">
      <div class="text-grey text-weight-bolder">Thread Count</div>
      <div class="text-h5 text-weight-bold">{{ threadStatistic.threadCount || 0 }}</div>
    </q-card>
    <q-card class="q-pa-md q-ma-md col-2" style="min-width: 200px">
      <div class="text-grey text-weight-bolder">Daemon Thread Count</div>
      <div class="text-h5 text-weight-bold">{{ threadStatistic.daemonThreadCount || 0 }}</div>
    </q-card>
    <q-card class="q-pa-md q-ma-md col-2" style="min-width: 200px">
      <div class="text-grey text-weight-bolder">Peak Thread Count</div>
      <div class="text-h5 text-weight-bold">{{ threadStatistic.peakThreadCount || 0 }}</div>
    </q-card>
    <q-card class="q-pa-md q-ma-md col-2" style="min-width: 200px">
      <div class="text-grey text-weight-bolder">Total Started Thread Count</div>
      <div class="text-h5 text-weight-bold">{{ threadStatistic.totalStartedThreadCount || 0 }}</div>
    </q-card>
  </div>
  <div class="q-pa-md">
    <q-table :rows="showThreadList"
             :columns="threadColumns"
             separator="horizontal"
             flat
             bordered
             row-key="id"
             :loading="loading"
             table-header-class="text-weight-bold">
      <template #top-left>
        <div class="row inline items-center">
          <div class="q-gutter-sm">
            <q-chip v-for="state in stateConfig"
                    v-model:selected="statesSelected[state.label]"
                    square
                    clickable
                    :color="state.color"
                    :text-color="state.textColor"
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
      <template #header="props">
        <q-tr :props="props">
          <q-th auto-width/>
          <q-th v-for="col in props.cols" :key="col.name" :props="props">{{ col.label }}</q-th>
        </q-tr>
      </template>
      <template #body="props">
        <q-tr :props="props" @click="loadThreadDetail(props)">
          <q-td auto-width>
            <q-btn size="sm" round flat :icon="props.expand ? 'r_expand_more' : 'r_chevron_right'"
                   @click="loadThreadDetail(props)"/>
          </q-td>
          <q-td v-for="col in props.cols" :key="col.name" :props="props" class="text-weight-medium">{{
              col.value
            }}
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <q-card flat class="bg-grey-3 q-pa-md">
              <div class="q-mb-sm">
                <span class="thread-detail__label">State</span>
                <span>{{ threadDetailMap[props.row.id]?.threadState }}</span>
              </div>
              <div class="q-mb-sm">
                <span class="thread-detail__label">LockName</span>
                <span>{{ threadDetailMap[props.row.id]?.lockName }}</span>
              </div>
              <div class="q-mb-sm">
                <span class="thread-detail__label">LockOwnerId</span>
                <span>{{ threadDetailMap[props.row.id]?.lockOwnerId }}</span>
              </div>
              <div class="q-mb-sm">
                <span class="thread-detail__label">LockOwnerName</span>
                <span>{{ threadDetailMap[props.row.id]?.lockOwnerName }}</span>
              </div>
              <q-separator/>
              <div class="row items-center">
                <div class="thread-detail__label">StackTrace</div>
                <q-list dense>
                  <q-item v-for="stackNode in threadDetailMap[props.row.id]?.stackTrace">
                    <q-item-section>
                      <q-item-label>{{ stackNode.declaringClass }}.{{ stackNode.methodName }} # {{ stackNode.lineNumber }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, computed, reactive } from 'vue'
import { useStore } from 'vuex'
import useGetGlobalProperties from 'src/composables/useGetGlobalProperties'
import { threadListCommand, threadDetailCommand } from 'src/proto/commandProto'
import _ from 'lodash'
import { date } from 'quasar'

const store = useStore()
const globalProperties = useGetGlobalProperties()

const instanceId = inject('instanceId')

const onCommand = inject('onCommand')
const offCommand = inject('offCommand')
const onError = inject('onError')
const offError = inject('offError')

const threadColumns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'center',
    sortable: true
  },
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'center'
  },
  {
    name: 'group',
    label: 'Group',
    field: 'group',
    align: 'center'
  },
  {
    name: 'priority',
    label: 'Priority',
    field: 'priority',
    align: 'center',
    sortable: true
  },
  {
    name: 'state',
    label: 'State',
    field: 'state',
    align: 'center'
  },
  {
    name: 'cpu',
    label: 'CPU(%)',
    field: 'cpu',
    align: 'center',
    sortable: true
  },
  {
    name: 'daemon',
    label: 'Daemon',
    field: 'daemon',
    align: 'center'
  },
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
  {
    label: 'NEW',
    color: 'primary',
    textColor: 'white'
  },
  {
    label: 'RUNNABLE',
    color: 'positive',
    textColor: 'white'
  },
  {
    label: 'BLOCKED',
    color: 'negative',
    textColor: 'white'
  },
  {
    label: 'WAITING',
    color: 'warning',
    textColor: 'white'
  },
  {
    label: 'TIMED_WAITING',
    color: 'amber-10',
    textColor: 'white'
  },
  {
    label: 'TERMINATED',
    textColor: 'black'
  },
]

const loading = ref(false)

const threadKeyword = ref('')

const updatedTime = ref('')

const threadList = ref([])

const threadStatistic = ref({})

const threadStateCont = ref({})

const threadDetailMap = ref({})

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
  onCommand(globalProperties.$tutelaryType, threadDetailCommand, handleThreadDetailMessage)
  onError(handleCommandError)
  sendThreadListCommand()
})

onUnmounted(() => {
  offCommand(globalProperties.$tutelaryType, threadListCommand, handleThreadListMessage)
  offCommand(globalProperties.$tutelaryType, threadDetailCommand, handleThreadDetailMessage)
  offError(handleCommandError)
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
  updatedTime.value = date.formatDate(message.timestamp, 'YYYY-MM-DD HH:mm:ss')
  threadList.value = message.data.threads
  threadStatistic.value = message.data.threadStatistic
  calcStateCont(threadList.value)
}

const handleThreadDetailMessage = (message) => {
  threadDetailMap.value[message.data.id] = message.data
  loading.value = false
}

const handleCommandError = (message) => {
  loading.value = false
}

const calcStateCont = (threadList) => {
  const stateList = threadList.map(item => item.state)
  threadStateCont.value = stateList.reduce((prev, next) => {
    prev[next] = (prev[next] + 1) || 1
    return prev
  }, {})
}

const loadThreadDetail = (props) => {
  const threadId = props.row.id
  threadDetailMap[threadId] = undefined
  if (props.expand) {
    props.expand = false
    return
  }
  loading.value = true
  const threadDetailParam = {
    instanceId: instanceId,
    commandType: globalProperties.$tutelaryType,
    commandCode: threadDetailCommand,
    param: {
      'id': props.row.id
    }
  }
  store.dispatch('sendMessage', {
    cmd: globalProperties.$commandRequestCmd,
    message: threadDetailParam
  })
  props.expand = true
}

</script>

<style scoped lang="scss">
.thread-detail__label {
  color: $grey-7;
}
.thread-detail__label::after {
  display: inline-block;
  content: ':';
  margin-left: 5px;
  margin-right: 5px;
}
</style>
