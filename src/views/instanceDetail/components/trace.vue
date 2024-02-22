<script setup lang="ts">
import type { FormInst, FormItemRule, FormRules } from 'naive-ui'
import eventbus from '@/utils/eventbus'
import commandCreateApi from '@/api/commandCreateApi'
import type { TraceRequest } from '@/proto/command/param/TraceRequest'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import { commandEnum } from '@/enums/commandEnums'
import type { TraceResponse } from '@/proto/command/result/TraceResponse'
import type { EnhanceAffect } from '@/proto/command/result/EnhanceAffect'

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
const currentEnhanceAffect = ref<EnhanceAffect>({} as EnhanceAffect)
const currentTraceList = ref<TraceResponse[]>([])

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

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.taskId !== currentTaskId.value)
      return

    if (commandExecuteResponse.code === commandEnum.TRACE_METHOD.value) {
      const traceResponse: TraceResponse = commandExecuteResponse.data
      currentTraceList.value.push(traceResponse)
    }
    else if (commandExecuteResponse.code === commandEnum.ENHANCE_AFFECT.value) {
      const enhanceAffect: EnhanceAffect = commandExecuteResponse.data
      currentEnhanceAffect.value = enhanceAffect
    }
    // else if (commandExecuteResponse.code === commandEnum.ENHANCE_COMPLETE.value) {
    // }
  })
})

onBeforeUnmount(() => eventbus.off('command'))

function traceMethod() {
  formRef.value?.validate((errors) => {
    if (!errors) {
      const params: CommandCreateRequest<TraceRequest> = {
        instanceId: props.instanceId,
        param: traceRequest.value,
      }

      currentTaskId.value = ''
      currentEnhanceAffect.value = {} as EnhanceAffect
      currentTraceList.value = []

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
      <n-button secondary>
        历史
      </n-button>
    </n-space>
  </common-container>

  <div v-if="currentTaskId">
    <n-divider />
    <div v-for="(traceItem, index) of currentTraceList" :key="index" my-20>
      <common-container>
        <n-grid :cols="2" x-gap="10">
          <n-gi>
            <n-card :bordered="false" h-full>
              <n-h4 prefix="bar">
                <n-text>Target Method</n-text>
              </n-h4>
              <n-descriptions :columns="1" label-placement="left" mb-20>
                <n-descriptions-item>
                  <template #label>
                    <n-text :depth="3">
                      Class
                    </n-text>
                  </template>
                  <n-text strong>
                    {{ traceItem.node?.className }}
                  </n-text>
                </n-descriptions-item>
                <n-descriptions-item>
                  <template #label>
                    <n-text :depth="3">
                      Method
                    </n-text>
                  </template>
                  <n-text strong>
                    {{ traceItem.node?.methodName }}
                  </n-text>
                </n-descriptions-item>
                <n-descriptions-item>
                  <template #label>
                    <n-text :depth="3">
                      Elapsed Time
                    </n-text>
                  </template>
                  <n-text strong>
                    {{ traceItem.node.totalCost / 1000000 }} ms
                  </n-text>
                  <n-text v-if="traceItem.node.isThrow" ml-10 type="error">
                    Throws Exception
                  </n-text>
                </n-descriptions-item>
                <n-descriptions-item v-if="traceItem.node.mark">
                  <template #label>
                    <n-text :depth="3">
                      Mark
                    </n-text>
                  </template>
                  <n-text strong>
                    {{ traceItem.node.mark }}
                  </n-text>
                </n-descriptions-item>
              </n-descriptions>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card :bordered="false" h-full>
              <n-h4 prefix="bar">
                <n-text>Thread</n-text>
              </n-h4>
              <n-descriptions :columns="1" label-placement="left" mb-20>
                <n-descriptions-item>
                  <template #label>
                    <n-text :depth="3">
                      ID
                    </n-text>
                  </template>
                  <n-text strong>
                    {{ traceItem.thread?.id }}
                  </n-text>
                </n-descriptions-item>
                <n-descriptions-item>
                  <template #label>
                    <n-text :depth="3">
                      Name
                    </n-text>
                  </template>
                  <n-text strong>
                    {{ traceItem.thread?.name }}
                  </n-text>
                </n-descriptions-item>
                <n-descriptions-item>
                  <template #label>
                    <n-text :depth="3">
                      TCCL
                    </n-text>
                  </template>
                  <n-text strong>
                    {{ traceItem.tccl }}
                  </n-text>
                </n-descriptions-item>
              </n-descriptions>
            </n-card>
          </n-gi>
        </n-grid>
        <n-card :bordered="false">
          <n-h4 prefix="bar">
            <n-text>Trace</n-text>
          </n-h4>
          <n-list>
            <n-list-item v-for="node of traceItem.node.children" :key="node.className + node.methodName + node.line">
              <n-space justify="space-between" :wrap="false">
                <div>
                  <n-text>{{ node.className }}</n-text>
                  <n-text>{{ `:${node.methodName}` }}</n-text>
                  <n-text ml-8 :depth="3">
                    {{ `#${node.line}` }}
                  </n-text>
                </div>
                <n-text v-if="node.count === 1">
                  {{ `${node.totalCost / 1000000} ms ` }}
                </n-text>
                <n-text v-else>
                  {{ `total=${node.totalCost / 1000000}ms, min=${node.minCost / 1000000}ms, max=${
                    node.maxCost / 1000000}ms, count=${node.count}` }}
                </n-text>
              </n-space>
              <n-text v-if="node.mark" :type="node.isThrow ? 'error' : 'info'">
                {{ node.mark }}
              </n-text>
            </n-list-item>
          </n-list>
        </n-card>
      </common-container>
      <n-divider v-if="index !== currentTraceList.length - 1" dashed />
    </div>
  </div>
</template>

<style scoped>
.n-list {
  background-color: inherit;
}

.n-list .n-list-item {
  padding: 5px 0;
}
</style>
