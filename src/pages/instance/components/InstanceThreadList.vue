<template>
  <div class="q-pa-md">
    <q-card>
      <q-table
        :rows="showThreadList"
        :columns="threadColumns"
        separator="horizontal"
        flat
        @row-click="handleRowClick"
        row-key="name">
        <template v-slot:top-left>
          <div class="row inline items-center">
            <div class="text-h6 q-mr-lg">总数：{{ threadInfo.threadList?.length || 0 }}</div>
            <div class="q-gutter-sm">
              <q-chip v-model:selected="statesSelected.NEW" square clickable color="primary" text-color="white"
                      :outline="!statesSelected.NEW">NEW
                <q-badge floating rounded color="secondary">{{ threadInfo.newCount || 0 }}</q-badge>
              </q-chip>
              <q-chip v-model:selected="statesSelected.RUNNABLE" square clickable color="positive" text-color="white"
                      :outline="!statesSelected.RUNNABLE">
                RUNNABLE
                <q-badge floating rounded color="secondary">{{ threadInfo.runnableCount || 0 }}</q-badge>
              </q-chip>
              <q-chip v-model:selected="statesSelected.BLOCKED" square clickable color="negative" text-color="white"
                      :outline="!statesSelected.BLOCKED">
                BLOCKED
                <q-badge floating rounded color="secondary">{{ threadInfo.blockedCount || 0 }}</q-badge>
              </q-chip>
              <q-chip v-model:selected="statesSelected.WAITING" square clickable color="warning" text-color="white"
                      :outline="!statesSelected.WAITING">
                WAITING
                <q-badge floating rounded color="secondary">{{ threadInfo.waitingCount || 0 }}</q-badge>
              </q-chip>
              <q-chip v-model:selected="statesSelected.TIMED_WAITING" square clickable color="warning"
                      text-color="white" :outline="!statesSelected.TIMED_WAITING">
                TIMED_WAITING
                <q-badge floating rounded color="secondary">{{ threadInfo.timedWaitingCount || 0 }}</q-badge>
              </q-chip>
              <q-chip v-model:selected="statesSelected.TERMINATED" square clickable
                      :outline="!statesSelected.TERMINATED">TERMINATED
                <q-badge floating rounded color="secondary">{{ threadInfo.terminatedCount || 0 }}</q-badge>
              </q-chip>
            </div>
          </div>
        </template>
        <template v-slot:top-right>
          <div>
            <q-input dense v-model="threadKeyword" label="关键字"/>
          </div>
        </template>
      </q-table>
    </q-card>
    <auto-refresh-sticky
      :update-time="updatedTime"
      @refresh="refresh"/>
    <q-dialog v-model="threadTraceDialogShow">
      <instance-thread-trace :thread-id="selectedThreadId"/>
    </q-dialog>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, inject, watch, computed, reactive } from 'vue'
import { onCommand, offCommand } from 'boot/eventbus'
import { useStore } from 'vuex'
import useGetGlobalProperties from 'src/composables/useGetGlobalProperties'
import {
  threadListCommandCode, threadStackTraceCommandCode
} from 'src/proto/commandProto'
import dayjs from 'dayjs'
import AutoRefreshSticky from 'pages/instance/components/AutoRefreshSticky.vue'
import _ from 'lodash'
import InstanceThreadTrace from 'pages/instance/components/InstanceThreadTrace.vue'

const store = useStore()
const globalPropertiese = useGetGlobalProperties()

const instance = inject('instance')

const instanceId = computed(() => {
  return instance.value.instanceId
})

const updatedTime = ref('')

const threadTraceDialogShow = ref(false)

const selectedThreadId = ref(-1)

const threadColumns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'center'
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
    align: 'center'
  },
  {
    name: 'state',
    label: 'State',
    field: 'state',
    align: 'center'
  },
  {
    name: 'cpu',
    label: 'CPU',
    field: 'cpu',
    align: 'center',
    sortable: true,
    format: val => `${val} %`
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

watch(instanceId, (val) => {
  sendCommand(val)
})

onMounted(() => {
  onCommand(globalPropertiese.$arthasType, threadListCommandCode, handleThreadListMessage)
  refresh()
})

onUnmounted(() => {
  offCommand(globalPropertiese.$arthasType, threadListCommandCode, handleThreadListMessage)
})

const threadInfo = ref({})

const showThreadList = computed(() => {
  return _.filter(threadInfo.value.threadList, threadItem => {
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

const statesSelected = reactive({
  NEW: true,
  RUNNABLE: true,
  BLOCKED: true,
  WAITING: true,
  TIMED_WAITING: true,
  TERMINATED: true
})

const threadKeyword = ref('')

const refresh = () => {
  if (instanceId.value) {
    sendCommand(instanceId.value)
  }
}

const sendCommand = (instanceId) => {
  const threadListParam = {
    commandType: globalPropertiese.$arthasType,
    instanceId: instanceId,
    command: 'thread',
    commandCode: threadListCommandCode
  }
  store.dispatch('sendMessage', {
    cmd: globalPropertiese.$commandRequestCmd,
    message: threadListParam
  })
}

const handleThreadListMessage = (message) => {
  updatedTime.value = dayjs().format('MM-DD HH:mm:ss')
  console.log('=>(InstanceThreadList.vue:57) message', message)
  threadInfo.value = message.data
}

const handleRowClick = (evt, row, index) => {
  console.log("=>(InstanceThreadList.vue:206) index", index);
  console.log("=>(InstanceThreadList.vue:206) row", row);
  console.log("=>(InstanceThreadList.vue:206) evt", evt);
  selectedThreadId.value = row.id
  threadTraceDialogShow.value = true
}

</script>

<style scoped>

</style>
