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
  if (!props.app.instanceNum) return 0;
  return Math.round(((props.app.onlineInstanceNum || 0) / props.app.instanceNum) * 100);
});

const healthMeta = computed(() => {
  if (!props.app.instanceNum || props.app.onlineInstanceNum === 0) {
    return { label: props.app.instanceNum ? '离线' : '未接入', type: 'error' as const, tone: 'offline' };
  }
  if (props.app.onlineInstanceNum === props.app.instanceNum) {
    return { label: '健康', type: 'success' as const, tone: 'healthy' };
  }
  return { label: '风险', type: 'warning' as const, tone: 'warning' };
});

const versionTags = computed(() => props.app.topJdkVersions || []);
const onlineSummary = computed(() => {
  if (!props.app.instanceNum) return '等待实例接入';
  return `${props.app.onlineInstanceNum || 0} 在线 / ${props.app.offlineInstanceNum || 0} 离线`;
});

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
    <div class="app-radar-card__halo"></div>

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
        <div class="app-radar-card__eyebrow">在线率</div>
        <div class="app-radar-card__rate">{{ onlinePercent }}%</div>
      </div>
      <div class="app-radar-card__summary-text">{{ onlineSummary }}</div>
    </div>

    <div class="id-progress id-progress-sm app-radar-card__progress">
      <div class="id-progress-fill app-radar-card__progress-fill" :style="{ width: `${onlinePercent}%` }"></div>
    </div>

    <div class="app-radar-card__metrics">
      <div class="app-radar-card__metric">
        <span class="app-radar-card__metric-label">实例总数</span>
        <strong class="app-radar-card__metric-value">{{ props.app.instanceNum || 0 }}</strong>
      </div>
      <div class="app-radar-card__metric">
        <span class="app-radar-card__metric-label">部署主机</span>
        <strong class="app-radar-card__metric-value">{{ props.app.hostCount || 0 }}</strong>
      </div>
      <div class="app-radar-card__metric">
        <span class="app-radar-card__metric-label">JDK 簇</span>
        <strong class="app-radar-card__metric-value">{{ props.app.jdkVersionCount || 0 }}</strong>
      </div>
    </div>

    <div class="app-radar-card__versions">
      <div class="app-radar-card__section-label">版本画像</div>
      <div class="app-radar-card__version-list">
        <NTag v-for="version in versionTags" :key="version" size="small" round :bordered="false" type="info">
          {{ version }}
        </NTag>
        <span v-if="!versionTags.length" class="app-radar-card__version-empty">暂无版本数据</span>
      </div>
    </div>

    <div class="app-radar-card__footer">
      <span class="app-radar-card__footer-text">查看实例编排、节点状态与版本分布</span>
      <NButton size="small" type="primary" ghost @click.stop="handleClick">
        进入实例列表
      </NButton>
    </div>
  </NCard>
</template>

<style scoped lang="scss">
.app-radar-card {
  --app-accent: rgb(var(--warning-color));
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 0.35s ease;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent 35%),
    linear-gradient(160deg, rgba(13, 18, 32, 0.98), rgba(24, 30, 50, 0.98));
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-6px) scale(1.01);
    border-color: color-mix(in srgb, var(--app-accent) 45%, transparent);
    box-shadow:
      0 12px 32px rgba(15, 23, 42, 0.25),
      0 0 40px color-mix(in srgb, var(--app-accent) 15%, transparent);
  }
}

.app-radar-card--healthy {
  --app-accent: rgb(var(--success-color));
}

.app-radar-card--warning {
  --app-accent: rgb(var(--warning-color));
}

.app-radar-card--offline {
  --app-accent: rgb(var(--error-color));
  opacity: 0.9;
}

.app-radar-card__halo {
  position: absolute;
  inset: auto -36px -52px auto;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--app-accent) 40%, transparent);
  filter: blur(52px);
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.app-radar-card:hover .app-radar-card__halo {
  opacity: 0.75;
}

.app-radar-card__header,
.app-radar-card__summary,
.app-radar-card__metrics,
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
  border-radius: 14px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--app-accent) 24%, rgba(255, 255, 255, 0.06));
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.app-radar-card__name {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  word-break: break-all;
  color: #f8fafc;
}

.app-radar-card__register {
  margin-top: 4px;
  color: rgba(241, 245, 249, 0.56);
  font-size: 12px;
}

.app-radar-card__summary {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 18px 0 14px;
}

.app-radar-card__eyebrow,
.app-radar-card__section-label,
.app-radar-card__metric-label {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(241, 245, 249, 0.52);
}

.app-radar-card__rate {
  margin-top: 6px;
  font-size: 32px;
  line-height: 1;
  font-weight: 800;
  color: #f8fafc;
}

.app-radar-card__summary-text {
  max-width: 160px;
  text-align: right;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(241, 245, 249, 0.72);
}

.app-radar-card__progress {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  overflow: hidden;
}

.app-radar-card__progress-fill {
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--app-accent) 50%, #ffffff), var(--app-accent));
  box-shadow: 0 0 12px color-mix(in srgb, var(--app-accent) 70%, transparent);
  position: relative;
}

.app-radar-card__progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shine 2.5s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.app-radar-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.app-radar-card__metric {
  padding: 14px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.03);
}

.app-radar-card__metric-value {
  display: block;
  margin-top: 10px;
  font-size: 20px;
  line-height: 1;
  font-weight: 800;
  color: #f8fafc;
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
  color: rgba(241, 245, 249, 0.46);
}

.app-radar-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.app-radar-card__footer-text {
  font-size: 12px;
  color: rgba(241, 245, 249, 0.56);
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
