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
      if (decompileResponse.state !== 1) {
        window.$notification.error({
          content: decompileResponse.message,
        })
      }
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
</script>

<template>
  <n-space bg="#fafafc" vertical min-h-60 rounded-8 p-15 bc-ccc dark:bg-black>
    <div w-full flex items-center>
      <div style="width: 120px">
        类全限定名
      </div>
      <n-input
        v-model:value="qualifiedClassName" clearable placeholder="Qualified Class Name"
        @keydown.enter="createDecompileCommand"
      />
    </div>
    <div flex items-center>
      <div style="width: 120px">
        方法名称
      </div>
      <n-input v-model:value="methodName" clearable placeholder="Method Name" @keydown.enter="createDecompileCommand" />
    </div>

    <n-space wrap justify="end">
      <n-button @click="createDecompileCommand">
        Decompile
      </n-button>
    </n-space>
  </n-space>
  <n-card v-if="source" embedded :bordered="false" mt-15 overflow-hidden content-class="cus-scroll-x cus-scroll-y">
    <n-config-provider :hljs="hljs">
      <n-code :code="source" language="java" show-line-numbers />
    </n-config-provider>
  </n-card>
</template>

<style scoped>
</style>
