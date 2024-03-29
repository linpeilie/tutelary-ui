<script setup lang="ts">
import type { FormInst, FormItemRule, FormRules } from 'naive-ui'
import { NSpace, NText } from 'naive-ui'
import StackTrace from './StackTrace.vue'
import eventbus from '@/utils/eventbus'
import commandCreateApi from '@/api/commandCreateApi'
import type { StackRequest } from '@/proto/command/param/StackRequest'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import { commandEnum } from '@/enums/commandEnums'
import type { StackResponse } from '@/proto/command/result/StackResponse'
import type { EnhanceAffect } from '@/proto/command/result/EnhanceAffect'
import type { TDescriptionItemProps } from '@/components/descriptions/TDescriptions.vue'

const props = defineProps({
  instanceId: { type: String, required: true },
})

const stackRequest = ref<StackRequest>({
  qualifiedClassName: 'com.tutelary.example.MathGame',
  methodNames: ['exec1'],
  times: 1,
})

const currentTaskId = ref<string>('')
const currentEnhanceAffect = ref<EnhanceAffect>({} as EnhanceAffect)
const currentStackList = ref<StackResponse[]>([])

const formRef = ref<FormInst | null>(null)

const formRules: FormRules = {
  qualifiedClassName: [{ required: true, message: '请输入类全限定名', trigger: 'blur' }],
  methodNames: [
    {
      required: true,
      validator(rule: FormItemRule, value: string[]) {
        if (!value || value.length === 0)
          return new Error('请输入方法')

        if (!value.find(item => item && item !== ''))
          return new Error('请输入方法')

        return true
      },
      trigger: 'blur',
    },
  ],
  times: [{ type: 'number', required: true, trigger: 'blur' }],
}

const targetMethodDescriptions: Array<TDescriptionItemProps<StackResponse>> = [
  {
    label: 'Class',
    value: val => val.className,
  },
  {
    label: 'Method',
    value: val => val.methodName,
  },
  {
    label: 'Finish Time',
    value: val => val.finishTime,
  },
]

const threadDescriptions: Array<TDescriptionItemProps<StackResponse>> = [
  { label: 'ID', value: val => val.thread.id },
  { label: 'Name', value: val => val.thread.name },
  { label: 'TCCL', value: val => val.tccl },
]

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.taskId !== currentTaskId.value)
      return

    if (commandExecuteResponse.code === commandEnum.STACK_METHOD.value) {
      const stackResponse: StackResponse = commandExecuteResponse.data
      currentStackList.value.push(stackResponse)
    }
    else if (commandExecuteResponse.code === commandEnum.ENHANCE_AFFECT.value) {
      const enhanceAffect: EnhanceAffect = commandExecuteResponse.data
      currentEnhanceAffect.value = enhanceAffect
    }
  })
})

onBeforeUnmount(() => eventbus.off('command'))

function stackMethod() {
  formRef.value?.validate((errors) => {
    if (!errors) {
      const params: CommandCreateRequest<StackRequest> = {
        instanceId: props.instanceId,
        param: stackRequest.value,
      }

      currentTaskId.value = ''
      currentEnhanceAffect.value = {} as EnhanceAffect
      currentStackList.value = []

      commandCreateApi.createStackCommand(params)
        .then((res) => {
          currentTaskId.value = res.taskId
        })
    }
  })
}
</script>

<template>
  <common-container>
    <n-form ref="formRef" :label-width="100" :model="stackRequest" label-placement="left" :rules="formRules">
      <n-form-item label="类全限定名" path="qualifiedClassName">
        <n-input v-model:value="stackRequest.qualifiedClassName" placeholder="Please Input Qualified Class Name" />
      </n-form-item>
      <n-form-item label="方法" path="methodNames">
        <n-dynamic-input v-model:value="stackRequest.methodNames" :min="1" />
      </n-form-item>
      <n-form-item label="次数" path="times">
        <n-input-number v-model:value="stackRequest.times" :min="1" :max="500" />
      </n-form-item>
    </n-form>
    <NSpace justify="end">
      <n-button type="primary" @click="stackMethod">
        确定
      </n-button>
      <n-button secondary>
        历史
      </n-button>
    </NSpace>
  </common-container>

  <div v-if="currentTaskId">
    <n-divider />
    <div v-for="(traceItem, index) of currentStackList" :key="index" my-20>
      <common-container>
        <n-grid :cols="2" x-gap="10">
          <n-gi>
            <n-card :bordered="false" h-full>
              <n-h4 prefix="bar">
                <NText>Target Method</NText>
              </n-h4>
              <t-descriptions :columns="1" label-placement="left" :items="targetMethodDescriptions" :val="traceItem" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card :bordered="false" h-full>
              <n-h4 prefix="bar">
                <NText>Thread</NText>
              </n-h4>
              <t-descriptions :columns="1" label-placement="left" :items="threadDescriptions" :val="traceItem" />
            </n-card>
          </n-gi>
        </n-grid>
        <n-card :bordered="false">
          <n-h4 prefix="bar">
            <NText>Trace</NText>
          </n-h4>
          <StackTrace :stack-trace="traceItem.stackTraceNodeList" />
        </n-card>
      </common-container>
      <n-divider v-if="index !== currentStackList.length - 1" dashed />
    </div>
  </div>
</template>

<style scoped></style>
