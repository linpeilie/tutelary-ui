<script setup lang="ts">
import type { StackTraceNode } from '@/proto/command/domain/StackTraceNode'

const props = defineProps({
  stackTrace: {
    type: Array<StackTraceNode>,
  },
})
</script>

<template>
  <n-list :bordered="false" clickable :show-divider="false">
    <n-list-item
      v-for="(node, index) of props.stackTrace" :key="index"
      style="padding-left: 0; padding-right: 0; padding-bottom: 5;padding-top: 0"
    >
      <n-space inline font-semibold :wrap="false" align="start">
        <span>{{ node.declaringClass }}.{{ node.methodName }}#{{ node.lineNumber }}</span>
        <n-tag v-if="node.isNative" :bordered="false" size="small">
          Native
        </n-tag>
      </n-space>
    </n-list-item>
  </n-list>
</template>

<style scoped></style>
