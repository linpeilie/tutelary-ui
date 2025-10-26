<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import type { InstanceDetailInfo } from '@/api/types/instanceTypes'

const props = defineProps<{
  instanceInfo: InstanceDetailInfo
}>()

const router = useRouter()

const descriptions = computed(() => {
  if (props.instanceInfo) {
    return [
      { label: 'App Name', value: props.instanceInfo.appName, icon: 'ph:app-window-duotone' },
      { label: 'Instance ID', value: props.instanceInfo.instanceId, icon: 'ph:fingerprint-duotone' },
      { label: 'IP Address', value: props.instanceInfo.ip, icon: 'ph:globe-duotone' },
      { label: 'Register Time', value: props.instanceInfo.registerDate, icon: 'ph:calendar-check-duotone' },
      { label: 'Startup Time', value: props.instanceInfo.startTime, icon: 'ph:clock-duotone' },
      { label: 'JDK Version', value: props.instanceInfo.jdkVersion, icon: 'ph:coffee-duotone' },
      { label: 'VM Name', value: props.instanceInfo.vmName, icon: 'ph:cpu-duotone' },
      { label: 'VM Vendor', value: props.instanceInfo.vmVendor, icon: 'ph:package-duotone' },
      { label: 'VM Version', value: props.instanceInfo.vmVersion, icon: 'ph:tag-duotone' },
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

const showenvironmentProperties = computed(() => {
  if (props.instanceInfo && props.instanceInfo.environmentProperties && Object.entries(props.instanceInfo?.environmentProperties).length > 0) {
    const entries = Object.entries(props.instanceInfo?.environmentProperties)
    return entries.slice(0, 3)
  }
  else {
    return []
  }
})

const environmentPropertiesShowMore = computed(() => {
  return showenvironmentProperties.value.length !== props.instanceInfo?.environmentProperties?.size
})

function goBack() {
  if (props.instanceInfo && props.instanceInfo.appName)
    router.push({ name: 'InstanceList', params: { appName: props.instanceInfo.appName } })
  else
    router.push({ name: 'AppList' })
}
</script>

<template>
  <aside class="instance-sider cus-scroll-y">
    <!-- 返回按钮 -->
    <div class="back-button-container">
      <button class="back-button" @click="goBack">
        <Icon icon="ph:arrow-left" class="back-icon" />
        <span>Back</span>
      </button>
    </div>

    <!-- 实例信息卡片 -->
    <div class="info-section">
      <h3 class="section-title">
        <Icon icon="ph:info-duotone" class="title-icon" />
        Instance Info
      </h3>
      
      <div class="info-grid">
        <div v-for="item of descriptions" :key="item.label" class="info-item">
          <div class="info-label">
            <Icon :icon="item.icon" class="label-icon" />
            {{ item.label }}
          </div>
          <div class="info-value" :title="item.value">
            {{ item.value }}
          </div>
        </div>
      </div>
    </div>

    <!-- ClassPath -->
    <div class="info-section">
      <h3 class="section-title">
        <Icon icon="ph:folder-duotone" class="title-icon" />
        ClassPath
      </h3>
      <div class="code-block">
        {{ props.instanceInfo.classPath }}
      </div>
    </div>

    <!-- Input Arguments -->
    <div v-if="showInputArguments.length" class="info-section">
      <div class="section-header">
        <h3 class="section-title">
          <Icon icon="ph:terminal-window-duotone" class="title-icon" />
          Input Arguments
        </h3>
        <button v-if="inputArgumentsShowMore" class="more-button">
          <Icon icon="ph:dots-three" />
        </button>
      </div>
      <div class="code-list">
        <div v-for="argument of showInputArguments" :key="argument" class="code-item">
          {{ argument }}
        </div>
      </div>
    </div>

    <!-- Environment Properties -->
    <div v-if="showenvironmentProperties.length" class="info-section">
      <div class="section-header">
        <h3 class="section-title">
          <Icon icon="ph:gear-duotone" class="title-icon" />
          Environment
        </h3>
        <button v-if="environmentPropertiesShowMore" class="more-button">
          <Icon icon="ph:dots-three" />
        </button>
      </div>
      <div class="env-list">
        <div v-for="property of showenvironmentProperties" :key="property[0]" class="env-item">
          <div class="env-key">{{ property[0] }}</div>
          <div class="env-value">{{ property[1] }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.instance-sider {
  width: 320px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

.back-button-container {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.15);
    transform: translateX(-2px);
  }

  &:active {
    transform: translateX(0);
  }

  .back-icon {
    font-size: 18px;
  }
}

.info-section {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  &:last-child {
    border-bottom: none;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 16px 0;

  .title-icon {
    font-size: 16px;
    color: #9CA3AF;
  }
}

.more-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #9CA3AF;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #374151;
  }
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  .label-icon {
    font-size: 14px;
  }
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.code-block {
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  color: #374151;
  line-height: 1.6;
  overflow-wrap: break-word;
  word-break: break-all;
}

.code-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.code-item {
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
  }
}

.env-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.env-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  transition: all 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
  }
}

.env-key {
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.env-value {
  font-size: 12px;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}
</style>
