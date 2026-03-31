<script setup lang="ts">
import { formatMemory } from '@/utils/common';
import { $t } from '@/locales';

interface Props {
  instance: Api.Instance.InstanceInfo;
}

const props = defineProps<Props>();

const metricItems = [
  { label: $t('page.instance.jdkVersion'), icon: 'lucide:coffee', key: 'jdkVersion' as const },
  { label: $t('page.instance.vmName'), icon: 'lucide:box', key: 'vmName' as const },
  { label: $t('page.instance.vmVendor'), icon: 'lucide:building-2', key: 'vmVendor' as const },
  { label: $t('page.instance.os'), icon: 'lucide:monitor', key: 'osName' as const },
  { label: $t('page.instance.availableProcessors'), icon: 'lucide:cpu', key: 'availableProcessors' as const },
  { label: $t('page.instance.hostName'), icon: 'lucide:server', key: 'hostName' as const }
];
</script>

<template>
  <div class="info-layout">
    <!-- 左侧：核心标识 -->
    <div class="info-identity">
      <div class="info-identity-header">
        <div class="info-avatar">
          <SvgIcon icon="lucide:box" class="text-20px text-primary" />
        </div>
        <div class="info-identity-text">
          <div class="info-instance-id">{{ props.instance.instanceId }}</div>
          <div class="info-app-name">{{ props.instance.appName }}</div>
        </div>
        <NTag :type="props.instance.state === 1 ? 'success' : 'error'" size="small" round>
          {{ props.instance.state === 1 ? '在线' : '离线' }}
        </NTag>
      </div>
      <div class="info-identity-meta">
        <div class="info-meta-item">
          <SvgIcon icon="lucide:globe" class="text-12px op-60" />
          <span>{{ props.instance.ip }}</span>
        </div>
        <div class="info-meta-item">
          <SvgIcon icon="lucide:clock" class="text-12px op-60" />
          <span>{{ props.instance.startTime }}</span>
        </div>
        <div class="info-meta-item">
          <SvgIcon icon="lucide:hard-drive" class="text-12px op-60" />
          <span>{{ formatMemory(props.instance.memorySize) }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：指标网格 -->
    <div class="info-metrics">
      <div v-for="item in metricItems" :key="item.key" class="info-metric-card">
        <div class="info-metric-icon">
          <SvgIcon :icon="item.icon" class="text-14px" />
        </div>
        <div class="info-metric-body">
          <span class="info-metric-label">{{ item.label }}</span>
          <span class="info-metric-value">{{ props.instance[item.key] ?? '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-layout {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.info-identity {
  flex-shrink: 0;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-identity-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: rgba(var(--primary-color), 0.1);
  flex-shrink: 0;
}

.info-identity-text {
  flex: 1;
  min-width: 0;
}

.info-instance-id {
  font-size: 16px;
  font-weight: 700;
  color: var(--n-text-color);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-app-name {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  margin-top: 2px;
}

.info-identity-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--n-text-color);
  font-family: 'Consolas', 'Monaco', monospace;
}

.info-metrics {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.info-metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background-color: var(--n-color-embedded);
  transition: background-color 0.2s ease;
}

.info-metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: rgba(var(--primary-color), 0.08);
  color: rgb(var(--primary-color));
  flex-shrink: 0;
}

.info-metric-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.info-metric-label {
  font-size: 11px;
  color: var(--n-text-color-disabled);
  line-height: 1;
}

.info-metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .info-layout {
    flex-direction: column;
  }

  .info-identity {
    min-width: unset;
  }

  .info-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
