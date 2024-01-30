<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import java from 'highlight.js/lib/languages/java'
import eventbus from '@/utils/eventbus'
import { commandEnum } from '@/enums/commandEnums'
import commandCreateApi from '@/api/commandCreateApi'
import type { DecompileRequest } from '@/proto/command/param/DecompileRequest'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import type { DecompileResponse } from '@/proto/command/result/DecompileResponse'

const props = defineProps({
  instanceId: { type: String, required: true },
})

hljs.registerLanguage('java', java)

const qualifiedClassName = ref<string>('')
const methodName = ref<string>('')

const source = ref<string>('')

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.DECOMPILE.value) {
      const decompileResponse = commandExecuteResponse.data as DecompileResponse
      source.value = decompileResponse.source
    }
  })
  createDecompileCommand()
})

onBeforeUnmount(() => eventbus.off('command'))

function createDecompileCommand() {
  if (qualifiedClassName.value) {
    const params: CommandCreateRequest<DecompileRequest> = {
      instanceId: props.instanceId,
      param: {
        qualifiedClassName: qualifiedClassName.value,
        methodName: methodName.value,
      },
    }
    commandCreateApi.createDecompile(params)
  }
  else {
    source.value = ''
  }
}

function reset() {
  source.value = ''
  methodName.value = ''
  qualifiedClassName.value = ''
}
</script>

<template>
  <query-bar :show-reset="false" @search="createDecompileCommand" @reset="reset">
    <query-bar-item label="类全限定名" :content-width="400">
      <n-input v-model:value="qualifiedClassName" clearable placeholder="Qualified Class Name" />
    </query-bar-item>
    <query-bar-item label="方法名">
      <n-input v-model:value="methodName" clearable placeholder="Method Name" />
    </query-bar-item>
  </query-bar>
  <n-card v-if="source" embedded :bordered="false" mt-15 overflow-hidden content-class="cus-scroll-x cus-scroll-y">
    <n-config-provider :hljs="hljs">
      <n-code :code="source" language="java" show-line-numbers />
    </n-config-provider>
  </n-card>
</template>

<style scoped>
</style>
