<template>
  <q-card class="q-pa-lg" style="width: 700px; max-width: 80vw;">
    <div class="q-gutter-md">
      <q-field standout="bg-teal text-white" label="Thread Id" stack-label hide-bottom-space hide-hint>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">{{ threadDetail.id }}</div>
        </template>
      </q-field>
      <q-field standout="bg-teal text-white" label="Thread Name" stack-label hide-bottom-space hide-hint>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">{{ threadDetail.name }}</div>
        </template>
      </q-field>
      <q-field standout="bg-teal text-white" label="Thread State" stack-label hide-bottom-space hide-hint>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">{{ threadDetail.state }}</div>
        </template>
      </q-field>
      <q-field standout="bg-teal text-white" label="Thread LockName" stack-label v-if="threadDetail.lockName"
               hide-bottom-space hide-hint>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">{{ threadDetail.lockName }}</div>
        </template>
      </q-field>
      <q-field standout="bg-teal text-white" label="Thread Lock OwnerId" stack-label v-if="threadDetail.lockOwnerId"
               hide-bottom-space hide-hint>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">{{ threadDetail.lockOwnerId }}</div>
        </template>
      </q-field>
      <q-field standout="bg-teal text-white" label="Thread Lock OwnerName" stack-label v-if="threadDetail.lockOwnerName"
               hide-bottom-space hide-hint>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">{{ threadDetail.lockOwnerName }}</div>
        </template>
      </q-field>
    </div>
    <q-separator spaced inset/>
    <div class="text-h6">堆栈信息</div>
    <q-scroll-area style="height: 300px">
      <q-list class="bg-grey-1 rounded-borders">
        <q-item v-for="stackTraceItem in threadDetail.stackTrace" clickable v-ripple>
          <q-item-section>
            <q-item-label>{{ stackTraceItem.declaringClass }}.{{ stackTraceItem.methodName }}</q-item-label>
            <q-item-label caption>{{ stackTraceItem.fileName }} : {{ stackTraceItem.lineNumber }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-card>
</template>

<script setup>
import { onMounted, onUnmounted, ref, inject, watch, computed, defineProps } from 'vue'
import { onCommand, offCommand } from 'boot/eventbus'
import { useStore } from 'vuex'
import useGetGlobalProperties from 'src/composables/useGetGlobalProperties'
import {
  threadStackTraceCommandCode
} from 'src/proto/commandProto'

const props = defineProps({
  threadId: {
    type: Number,
    required: true
  }
})

const store = useStore()
const globalPropertiese = useGetGlobalProperties()

const instance = inject('instance')

const instanceId = computed(() => {
  return instance.value.instanceId
})

const threadDetail = ref({})

onMounted(() => {
  console.log('InstanceThreadTrace onMounted , thread id : ', props.threadId)
  onCommand(globalPropertiese.$arthasType, threadStackTraceCommandCode, handleThreadStackTraceMessage)
  sendThreadStackTraceCommand(props.threadId)
})

onUnmounted(() => {
  console.log('InstanceThreadTrace onUnmounted')
  offCommand(globalPropertiese.$arthasType, threadStackTraceCommandCode, handleThreadStackTraceMessage)
})

const sendThreadStackTraceCommand = (threadId) => {
  const param = {
    commandType: globalPropertiese.$arthasType,
    instanceId: instanceId.value,
    command: `thread ${threadId}`,
    commandCode: threadStackTraceCommandCode
  }
  store.dispatch('sendMessage', {
    cmd: globalPropertiese.$commandRequestCmd,
    message: param
  })
}

const handleThreadStackTraceMessage = (message) => {
  console.log('=>(InstanceThreadList.vue:213) message', message)
  threadDetail.value = message.data.threadInfo
}

</script>

<style scoped>

</style>
