<script setup lang="ts">
import type { FormInst, FormItemRule, FormRules } from 'naive-ui'
import eventbus from '@/utils/eventbus'
import commandCreateApi from '@/api/commandCreateApi'
import type { TraceRequest } from '@/proto/command/param/TraceRequest'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'

const props = defineProps({
  instanceId: { type: String, required: true },
})

const traceRequest = ref<TraceRequest>({
  qualifiedClassName: 'com.tutelary.example.MathGame',
  methodNames: ['exec1'],
  times: 1,
  cost: 0,
})

const currentTaskId = ref<string>('')

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
  cost: [{ type: 'number', required: true, trigger: 'blur' }],
}

// onMounted(() => {
// eventbus.on('command', (commandExecuteResponse) => {
// if (commandExecuteResponse.taskId !== currentTaskId.value)
// return

// if (commandExecuteResponse.code === commandEnum.TRACE_METHOD.value) {
// const traceResponse: TraceResponse = commandExecuteResponse.data
// console.log('🚀 ~ eventbus.on ~ traceResponse:', traceResponse)
// }
// else if (commandExecuteResponse.code === commandEnum.ENHANCE_AFFECT.value) {
// const enhanceAffect: EnhanceAffect = commandExecuteResponse.data
// console.log('🚀 ~ eventbus.on ~ enhanceAffect:', enhanceAffect)
// }
// else if (commandExecuteResponse.code === commandEnum.ENHANCE_COMPLETE.value) {
// const enhanceComplete: EnhanceCommandComplete = commandExecuteResponse.data
// console.log('🚀 ~ eventbus.on ~ enhanceComplete:', enhanceComplete)
// }
// })
// })

onBeforeUnmount(() => eventbus.off('command'))

function traceMethod() {
  formRef.value?.validate((errors) => {
    if (!errors) {
      const params: CommandCreateRequest<TraceRequest> = {
        instanceId: props.instanceId,
        param: traceRequest.value,
      }
      commandCreateApi.createTraceCommand(params)
        .then((res) => {
          currentTaskId.value = res.taskId
        })
    }
  })
}
</script>

<template>
  <common-container>
    <n-form ref="formRef" :label-width="100" :model="traceRequest" label-placement="left" :rules="formRules">
      <n-form-item label="类全限定名" path="qualifiedClassName">
        <n-input v-model:value="traceRequest.qualifiedClassName" placeholder="Please Input Qualified Class Name" />
      </n-form-item>
      <n-form-item label="方法" path="methodNames">
        <n-dynamic-input v-model:value="traceRequest.methodNames" :min="1" />
      </n-form-item>
      <n-form-item label="次数" path="times">
        <n-input-number v-model:value="traceRequest.times" :min="1" :max="500" />
      </n-form-item>
      <n-form-item label="最低耗时" path="cost">
        <n-input-number v-model:value="traceRequest.cost" :min="0" />
      </n-form-item>
    </n-form>
    <n-space justify="end">
      <n-button type="primary" @click="traceMethod">
        确定
      </n-button>
    </n-space>
  </common-container>

  <common-container mt-20>
    <h1>增加成功</h1>
  </common-container>
</template>

<style scoped>
</style>
