<script setup lang="ts">
import dayjs from 'dayjs'
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import type { TDescriptionItemProps } from '@/components/descriptions/TDescriptions.vue'
import { commandEnum } from '@/enums/commandEnums'
import type { HostInfo } from '@/proto/command/domain/HostInfo'
import type { JvmInfo } from '@/proto/command/domain/JvmInfo'
import type { SystemInfoResponse } from '@/proto/command/result/SystemInfoResponse'
import eventbus from '@/utils/eventbus'
import { div } from '@/utils'

const props = defineProps({
  instanceId: {
    type: String,
    required: true,
  },
})

const host = ref<HostInfo>()

const jvm = ref<JvmInfo>()

const hostDescriptions: Array<TDescriptionItemProps<HostInfo>> = [
  { label: 'Host Name', value: host => host?.hostName },
  { label: 'Host Address', value: host => host?.hostAddress },
  { label: 'OS Name', value: host => host?.osName },
  { label: 'Arch', value: host => host?.arch },
  { label: 'Available Processors', value: host => host?.availableProcessors },
]

const jvmDescriptions: Array<TDescriptionItemProps<JvmInfo>> = [
  { label: 'JDK Version', value: jvm => jvm?.jdkVersion },
  { label: 'Vm Name', value: jvm => jvm?.vmName },
  { label: 'Vm Vendor', value: jvm => jvm?.vmVendor },
  { label: 'Vm Version', value: jvm => jvm?.vmVersion },
  { label: 'Start Time', value: jvm => dayjs(jvm?.startTime).format('YYYY-MM-DD HH:mm:ss.SSS') },
]

const environmentDescriptions: ComputedRef<Array<TDescriptionItemProps<any>>> = computed(() => {
  if (jvm.value?.environmentProperties) {
    return Object.entries(jvm.value.environmentProperties)
      .map(([key]) => {
        return {
          label: key,
          value: property => property[key],
        }
      })
  }
  else {
    return []
  }
})

function createSystemInfoCommand() {
  const params = {
    instanceId: props.instanceId,
    param: {},
  } as CommandCreateRequest<any>
  commandCreateApi.createSystemInfoCommand(params)
}

onMounted(() => {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.SYSTEM_INFO.value) {
      const systemInfo = commandExecuteResponse.data as SystemInfoResponse

      host.value = systemInfo.host
      jvm.value = systemInfo.jvm
    }
  })
  createSystemInfoCommand()
})

onBeforeUnmount(() => {
  eventbus.off('command')
})
</script>

<template>
  <n-space mb-15 justify="right">
    <n-button type="primary" @click="createSystemInfoCommand">
      刷新
    </n-button>
  </n-space>
  <n-grid cols="6" item-responsive :x-gap="12" :y-gap="20">
    <n-grid-item span="2">
      <n-card :bordered="false" title="主机信息" embedded w-full wh-full>
        <t-descriptions label-placement="left" :column="1" :items="hostDescriptions" :val="host" />
      </n-card>
    </n-grid-item>
    <n-grid-item span="2">
      <n-card :bordered="false" title="主机资源" embedded w-full wh-full>
        <n-descriptions label-placement="top" :column="1">
          <n-descriptions-item label="物理内存（占用）">
            <n-progress
              v-if="host" type="line"
              :percentage="div(host?.totalPhysicalMemorySize - host?.freePhysicalMemorySize, host?.totalPhysicalMemorySize) * 100"
              :border-radius="5"
            >
              {{ div(host?.totalPhysicalMemorySize - host?.freePhysicalMemorySize, 1024 * 1024) }} /
              {{ div(host?.totalPhysicalMemorySize, 1024 * 1024) }} GB
            </n-progress>
          </n-descriptions-item>
          <n-descriptions-item label="交换分区（占用）">
            <n-progress
              v-if="host" type="line"
              :percentage="div(host?.totalSwapSpaceSize - host?.freeSwapSpaceSize, host?.totalSwapSpaceSize) * 100"
              :border-radius="5"
            >
              {{ div(host?.totalSwapSpaceSize - host?.freeSwapSpaceSize, 1024 * 1024) }} /
              {{ div(host?.totalSwapSpaceSize, 1024 * 1024) }} GB
            </n-progress>
          </n-descriptions-item>
          <n-descriptions-item label="硬盘空间（可用）">
            <n-progress
              v-if="host" type="line"
              :percentage="div(host?.diskTotalSpace - host?.diskFreeSpace, host?.diskTotalSpace) * 100"
              :border-radius="5"
            >
              {{ div(host?.diskTotalSpace - host?.diskFreeSpace, 1024 * 1024) }} /
              {{ div(host?.diskTotalSpace, 1024 * 1024) }} GB
            </n-progress>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
    </n-grid-item>
    <n-grid-item span="2">
      <n-card :bordered="false" title="JVM" embedded w-full wh-full>
        <t-descriptions label-placement="left" :column="1" :items="jvmDescriptions" :val="jvm" />
      </n-card>
    </n-grid-item>
    <n-grid-item v-if="jvm?.inputArguments" span="6">
      <n-card
        :bordered="false" title="启动参数" embedded w-full wh-full content-style="max-height: 480px;"
        content-class="cus-scroll-y"
      >
        <div v-for="argument of jvm.inputArguments" :key="argument">
          <n-text strong style="--n-font-weight-strong: 600">
            {{ argument }}
          </n-text>
        </div>
      </n-card>
    </n-grid-item>
    <n-grid-item v-if="jvm?.environmentProperties" span="6">
      <n-card :bordered="false" title="环境变量" embedded w-full wh-full>
        <t-descriptions
          label-placement="left" :column="1" :items="environmentDescriptions"
          :val="jvm?.environmentProperties"
        />
      </n-card>
    </n-grid-item>
  </n-grid>
</template>

<style scoped></style>
