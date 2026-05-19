<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';

const router = useRouter();

defineOptions({
  name: 'AppCard'
});

interface Props {
  app: Api.Application.AppInfo;
}

const props = defineProps<Props>();

const onlinePercent = computed(() => {
  if (typeof props.app.onlineInstanceNum !== 'number') return undefined;
  if (!props.app.instanceNum) return 0;
  return Math.round((props.app.onlineInstanceNum / props.app.instanceNum) * 100);
});

const healthMeta = computed(() => {
  if (!props.app.instanceNum) {
    return { label: '未接入', type: 'default' as const, tone: 'empty' };
  }
  if (typeof props.app.onlineInstanceNum !== 'number') {
    return { label: '已登记', type: 'info' as const, tone: 'active' };
  }
  if (props.app.onlineInstanceNum === props.app.instanceNum) {
    return { label: '在线', type: 'success' as const, tone: 'active' };
  }
  return { label: '需关注', type: 'warning' as const, tone: 'attention' };
});

const versionTags = computed(() => props.app.topJdkVersions || []);
const onlineSummary = computed(() => {
  if (!props.app.instanceNum) return '等待实例接入';
  if (typeof props.app.onlineInstanceNum !== 'number') return `${props.app.instanceNum || 0} 个登记实例`;
  return `${props.app.onlineInstanceNum || 0}/${props.app.instanceNum || 0} 在线`;
});

const progressWidth = computed(() => `${onlinePercent.value ?? 100}%`);
const rateSummary = computed(() => (onlinePercent.value === undefined ? '运行态见实例列表' : `在线率 ${onlinePercent.value}%`));

function formatRegisterTime(value: string) {
  if (!value) return '—';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

function handleClick() {
  router.push({ name: 'app_detail', params: { appName: props.app.appName } });
}
</script>

<template>
  <NCard class="id-card app-radar-card" :class="`app-radar-card--${healthMeta.tone}`" size="small" hoverable @click="handleClick">
    <div class="app-radar-card__header">
      <div class="app-radar-card__identity">
        <div class="app-radar-card__icon">
          <SvgIcon icon="lucide:app-window-mac" class="text-18px" />
        </div>
        <div>
          <div class="app-radar-card__name">{{ props.app.appName }}</div>
          <div class="app-radar-card__register">接入于 {{ formatRegisterTime(props.app.registerDate) }}</div>
        </div>
      </div>
      <NTag :type="healthMeta.type" size="small" round :bordered="false">
        {{ healthMeta.label }}
      </NTag>
    </div>

    <div class="app-radar-card__summary">
      <div>
        <div class="app-radar-card__rate">{{ onlineSummary }}</div>
      </div>
      <div class="app-radar-card__summary-text">{{ rateSummary }}</div>
    </div>

    <div class="id-progress id-progress-sm app-radar-card__progress">
      <div class="id-progress-fill app-radar-card__progress-fill" :style="{ width: progressWidth }"></div>
    </div>

    <div class="app-radar-card__versions">
      <div class="app-radar-card__version-list">
        <NTag v-for="version in versionTags" :key="version" size="small" round :bordered="false" type="info">
          {{ version }}
        </NTag>
        <span v-if="!versionTags.length" class="app-radar-card__version-empty">暂无版本数据</span>
      </div>
    </div>

    <div class="app-radar-card__footer">
      <span class="app-radar-card__footer-text">实例 {{ props.app.instanceNum || 0 }} · 主机 {{ props.app.hostCount ?? '—' }}</span>
      <NButton size="small" type="primary" ghost @click.stop="handleClick">
        查看实例
      </NButton>
    </div>
  </NCard>
</template>

<style scoped lang="scss">
.app-radar-card {
  --app-accent: rgb(var(--warning-color));
  position: relative;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  border-left: 3px solid var(--app-accent);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  }
}

.app-radar-card--active {
  --app-accent: rgb(var(--success-color));
}

.app-radar-card--attention {
  --app-accent: rgb(var(--warning-color));
}

.app-radar-card--empty {
  --app-accent: rgb(var(--error-color));
  opacity: 0.9;
}

.app-radar-card__header,
.app-radar-card__summary,
.app-radar-card__versions,
.app-radar-card__footer {
  position: relative;
}

.app-radar-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.app-radar-card__identity {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.app-radar-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--app-accent) 14%, transparent);
  color: var(--app-accent);
}

.app-radar-card__name {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  word-break: break-all;
}

.app-radar-card__register {
  margin-top: 4px;
  color: var(--n-text-color-disabled);
  font-size: 12px;
}

.app-radar-card__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 10px;
}

.app-radar-card__rate {
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
}

.app-radar-card__summary-text {
  max-width: 160px;
  text-align: right;
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.app-radar-card__progress {
  background: var(--n-color-embedded);
  border-radius: 999px;
  overflow: hidden;
}

.app-radar-card__progress-fill {
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--app-accent) 50%, #ffffff), var(--app-accent));
}

.app-radar-card__versions {
  margin-top: 16px;
}

.app-radar-card__version-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.app-radar-card__version-empty {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.app-radar-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);
}

.app-radar-card__footer-text {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

@media (max-width: 480px) {
  .app-radar-card__summary,
  .app-radar-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .app-radar-card__summary-text {
    max-width: none;
    text-align: left;
  }
}
</style>
