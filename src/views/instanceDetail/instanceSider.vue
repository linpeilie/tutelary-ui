<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { InstanceDetailInfo } from '@/api/types/instanceTypes'

const props = defineProps<{
  instanceInfo: InstanceDetailInfo
}>()

const descriptions = computed(() => {
  if (props.instanceInfo) {
    return [
      { label: '应用名称', value: props.instanceInfo.appName },
      { label: '实例ID', value: props.instanceInfo.instanceId },
      { label: 'IP', value: props.instanceInfo.ip },
      { label: '注册时间', value: props.instanceInfo.registerDate },
      { label: '启动时间', value: props.instanceInfo.startTime },
      { label: 'JDK版本', value: props.instanceInfo.jdkVersion },
      { label: 'VmName', value: props.instanceInfo.vmName },
      { label: 'VmVendor', value: props.instanceInfo.vmVendor },
      { label: 'VmVersion', value: props.instanceInfo.vmVersion },
    ]
  }
  else {
    return []
  }
})

const showInputArguments = computed(() => {
  if (props.instanceInfo && props.instanceInfo.inputArguments)
    return props.instanceInfo.inputArguments.slice(0, 3)
  else
    return []
})

const inputArgumentsShowMore = computed(() => {
  return showInputArguments.value.length !== props.instanceInfo?.inputArguments?.length
})

const showSystemProperties = computed(() => {
  if (props.instanceInfo && props.instanceInfo.systemProperties && Object.entries(props.instanceInfo?.systemProperties).length > 0) {
    const entries = Object.entries(props.instanceInfo?.systemProperties)
    return entries.slice(0, 3)
  }
  else {
    return []
  }
})

const systemPropertiesShowMore = computed(() => {
  return showSystemProperties.value.length !== props.instanceInfo?.systemProperties?.size
})
</script>

<template>
  <n-card style="width: 300px;" class="cus-scroll-y" rounded-10>
    <n-descriptions label-placement="top" :column="1">
      <n-descriptions-item v-for="item of descriptions" :key="item.value">
        <template #label>
          <div font-semibold text-gray-400>
            {{ item.label }}
          </div>
        </template>
        <n-ellipsis style="max-width: 250px;" font-bold>
          {{ item.value }}
        </n-ellipsis>
      </n-descriptions-item>
      <n-descriptions-item>
        <template #label>
          <div font-semibold text-gray-500>
            ClassPath
          </div>
        </template>
        <n-ellipsis :line-clamp="3" style="max-width: 250px;" :tooltip="false">
          {{ props.instanceInfo.classPath }}
        </n-ellipsis>
      </n-descriptions-item>
      <n-descriptions-item>
        <template #label>
          <n-thing>
            <template #header>
              <div font-semibold text-gray-500>
                InputArguments
              </div>
            </template>
            <template v-if="inputArgumentsShowMore" #header-extra>
              <n-button text>
                <template #icon>
                  <n-icon>
                    <Icon icon="material-symbols:read-more" />
                  </n-icon>
                </template>
                more
              </n-button>
            </template>
          </n-thing>
        </template>
        <n-card embedded size="small" :bordered="false" rounded-10>
          <n-ellipsis v-for="argument of showInputArguments" :key="argument" style="max-width: 200px;" font-bold>
            {{ argument }}
          </n-ellipsis>
        </n-card>
      </n-descriptions-item>
      <n-descriptions-item>
        <template #label>
          <n-thing>
            <template #header>
              <div font-semibold text-gray-500>
                SystemProperties
              </div>
            </template>
            <template v-if="systemPropertiesShowMore" #header-extra>
              <n-button text>
                <template #icon>
                  <n-icon>
                    <Icon icon="material-symbols:read-more" />
                  </n-icon>
                </template>
                more
              </n-button>
            </template>
          </n-thing>
        </template>
        <n-card embedded size="small" :bordered="false" rounded-10>
          <n-descriptions label-placement="left" :column="1">
            <n-descriptions-item v-for="property of showSystemProperties" :key="property[0]">
              <template #label>
                {{ property[0] }}
              </template>
              <n-ellipsis style="max-width: 100px;" font-bold>
                {{ property[1] }}
              </n-ellipsis>
            </n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-descriptions-item>
    </n-descriptions>
  </n-card>
</template>

<style scoped>
</style>
