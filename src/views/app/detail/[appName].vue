<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import TSegmented from '@/components/custom/t-segmented.vue';
import type { OptionsType } from '@/components/custom/types/t-segmented';
import { fetchAppDetail } from '@/service/api';
import { formatMemory } from '@/utils/common';
import { formatTimeDifference } from '@/utils/time';
import { useRoute, useRouter } from 'vue-router';
import { useBoolean } from '~/packages/hooks';

type StatusFilter = 'all' | 'online' | 'offline';
type ViewMode = 'cards' | 'list';

const route = useRoute();
const router = useRouter();

const appDetail = ref<Api.Application.AppDetail>();
const searchText = ref('');
const statusFilter = ref<StatusFilter>('all');
const viewMode = ref<ViewMode>('cards');
const { bool: loading, setTrue: startLoading, setFalse: stopLoading } = useBoolean();

const statusOptions: OptionsType[] = [
  { label: '全部', value: 'all', icon: 'lucide:layout-grid', iconType: 'iconify' },
  { label: '在线', value: 'online', icon: 'lucide:activity', iconType: 'iconify' },
  { label: '离线', value: 'offline', icon: 'lucide:power-off', iconType: 'iconify' }
];

const viewOptions: OptionsType[] = [
  { label: '卡片视图', value: 'cards', icon: 'lucide:panel-top', iconType: 'iconify' },
  { label: '紧凑视图', value: 'list', icon: 'lucide:list-collapse', iconType: 'iconify' }
];

const instances = computed(() => appDetail.value?.instances || []);

function isOnline(instance: Api.Instance.InstanceInfo) {
  return instance.online ?? instance.state === 1;
}

const onlineCount = computed(() => instances.value.filter(isOnline).length);
const offlineCount = computed(() => instances.value.length - onlineCount.value);
const onlineRate = computed(() => {
  if (!instances.value.length) return 0;
  return Math.round((onlineCount.value / instances.value.length) * 100);
});
const hostCount = computed(() => appDetail.value?.hostCount || 0);
const versionCount = computed(() => appDetail.value?.jdkVersionCount || 0);
const topJdkVersions = computed(() => appDetail.value?.topJdkVersions || []);

const filteredInstances = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();

  return [...instances.value]
    .filter(instance => {
      if (statusFilter.value === 'online') return isOnline(instance);
      if (statusFilter.value === 'offline') return !isOnline(instance);
      return true;
    })
    .filter(instance => {
      if (!keyword) return true;
      return [
        instance.instanceId,
        instance.ip,
        instance.hostName,
        instance.jdkVersion,
        instance.vmVersion,
        instance.arch
      ]
        .filter((value): value is string => Boolean(value))
        .some(value => value.toLowerCase().includes(keyword));
    })
    .sort((a, b) => {
      const onlineDiff = Number(isOnline(b)) - Number(isOnline(a));
      if (onlineDiff !== 0) return onlineDiff;
      return dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf();
    });
});

const headerStatus = computed(() => {
  if (!instances.value.length || onlineCount.value === 0) return { label: '离线风险', type: 'error' as const };
  if (onlineCount.value === instances.value.length) return { label: '稳定运行', type: 'success' as const };
  return { label: '存在波动', type: 'warning' as const };
});

function formatAbsoluteTime(value?: string) {
  if (!value) return '—';
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function formatCompactTime(value?: string) {
  if (!value) return '—';
  return dayjs(value).format('MM-DD HH:mm');
}

function formatUptime(value?: string) {
  if (!value) return '—';
  return formatTimeDifference(value, dayjs());
}

function fetchData() {
  startLoading();
  fetchAppDetail(route.params.appName as string)
    .then(res => {
      appDetail.value = res.data || undefined;
    })
    .finally(() => stopLoading());
}

function toInstanceDetail(instance: Api.Instance.InstanceInfo) {
  router.push({ name: 'app_instance_detail', params: { instanceId: instance.instanceId } });
}

function goBack() {
  router.push({ name: 'app_list' });
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <AppPage :show-back-button="false">
    <template #header>
      <div class="instance-war-room__header">
        <div class="instance-war-room__header-icon">
          <SvgIcon icon="lucide:app-window" class="text-18px" />
        </div>
        <div>
          <div class="instance-war-room__title-row">
            <div class="instance-war-room__title">{{ appDetail?.appName || route.params.appName }}</div>
            <NTag :type="headerStatus.type" size="small" round :bordered="false">
              {{ headerStatus.label }}
            </NTag>
          </div>
          <div class="instance-war-room__subtitle">
            注册于 {{ formatAbsoluteTime(appDetail?.registerDate) }} · {{ hostCount }} 台主机 · 在线率 {{ onlineRate }}%
          </div>
        </div>
      </div>
    </template>

    <template #action>
      <div class="instance-war-room__header-actions">
        <NButton tertiary @click="goBack">
          <template #icon>
            <SvgIcon icon="lucide:arrow-left" />
          </template>
          返回应用列表
        </NButton>
        <NButton type="primary" secondary :loading="loading" @click="fetchData">
          <template #icon>
            <SvgIcon icon="lucide:refresh-cw" />
          </template>
          刷新
        </NButton>
      </div>
    </template>

    <div class="instance-war-room">
      <section class="instance-war-room__hero id-card">
        <div class="instance-war-room__hero-mesh"></div>
        <div class="instance-war-room__hero-main">
          <div>
            <div class="instance-war-room__hero-eyebrow">Instance Orchestration Surface</div>
            <div class="instance-war-room__hero-title">实例作战面板</div>
            <p class="instance-war-room__hero-description">
              把在线状态、主机分布、JDK 版本和单实例关键画像压缩到同一视图里，快速判断这个应用是否健康、是否分裂。
            </p>
          </div>

          <div class="instance-war-room__hero-side">
            <div class="instance-war-room__hero-rate">{{ onlineRate }}%</div>
            <div class="instance-war-room__hero-rate-label">集群在线率</div>
          </div>
        </div>

        <div class="instance-war-room__hero-tags">
          <span class="instance-war-room__hero-tag-label">版本画像</span>
          <NTag v-for="version in topJdkVersions" :key="version" size="small" round :bordered="false" type="info">
            {{ version }}
          </NTag>
          <span v-if="!topJdkVersions.length" class="instance-war-room__hero-tag-empty">暂无版本标签</span>
        </div>
      </section>

      <section class="instance-war-room__stats">
        <button class="instance-war-room__stat-card" :class="{ 'is-active': statusFilter === 'all' }" @click="statusFilter = 'all'">
          <div class="instance-war-room__stat-icon bg-primary/12 text-primary">
            <SvgIcon icon="lucide:boxes" class="text-18px" />
          </div>
          <div>
            <div class="instance-war-room__stat-label">实例总数</div>
            <div class="instance-war-room__stat-value">{{ instances.length }}</div>
          </div>
        </button>

        <button class="instance-war-room__stat-card" :class="{ 'is-active': statusFilter === 'online' }" @click="statusFilter = 'online'">
          <div class="instance-war-room__stat-icon bg-success/12 text-success">
            <SvgIcon icon="lucide:activity" class="text-18px" />
          </div>
          <div>
            <div class="instance-war-room__stat-label">在线</div>
            <div class="instance-war-room__stat-value text-success">{{ onlineCount }}</div>
          </div>
        </button>

        <button class="instance-war-room__stat-card" :class="{ 'is-active': statusFilter === 'offline' }" @click="statusFilter = 'offline'">
          <div class="instance-war-room__stat-icon bg-error/12 text-error">
            <SvgIcon icon="lucide:power-off" class="text-18px" />
          </div>
          <div>
            <div class="instance-war-room__stat-label">离线</div>
            <div class="instance-war-room__stat-value text-error">{{ offlineCount }}</div>
          </div>
        </button>

        <div class="instance-war-room__stat-card instance-war-room__stat-card--static">
          <div class="instance-war-room__stat-icon bg-info/12 text-info">
            <SvgIcon icon="lucide:network" class="text-18px" />
          </div>
          <div>
            <div class="instance-war-room__stat-label">主机数</div>
            <div class="instance-war-room__stat-value">{{ hostCount }}</div>
          </div>
        </div>

        <div class="instance-war-room__stat-card instance-war-room__stat-card--static">
          <div class="instance-war-room__stat-icon bg-purple-500/12 text-purple-500">
            <SvgIcon icon="lucide:git-branch" class="text-18px" />
          </div>
          <div>
            <div class="instance-war-room__stat-label">JDK 版本簇</div>
            <div class="instance-war-room__stat-value">{{ versionCount }}</div>
          </div>
        </div>
      </section>

      <section class="instance-war-room__toolbar id-card">
        <div class="instance-war-room__toolbar-left">
          <TSegmented v-model:model-value="statusFilter" :options="statusOptions" size="large" />
          <span class="instance-war-room__toolbar-hint">
            当前显示 {{ filteredInstances.length }} / {{ instances.length }} 个实例
          </span>
        </div>

        <div class="instance-war-room__toolbar-right">
          <TSegmented v-model:model-value="viewMode" :options="viewOptions" size="medium" />
          <NInput
            v-model:value="searchText"
            class="instance-war-room__search"
            placeholder="搜索 ID / IP / 主机 / 版本 / 架构..."
            clearable
          >
            <template #prefix>
              <SvgIcon icon="lucide:search" class="text-14px" />
            </template>
          </NInput>
        </div>
      </section>

      <div v-if="loading && !appDetail" class="instance-war-room__grid">
        <NCard v-for="i in 6" :key="i" size="small" class="id-card">
          <NSkeleton text :repeat="6" round />
        </NCard>
      </div>

      <div v-else-if="filteredInstances.length === 0" class="id-empty-state instance-war-room__empty id-card">
        <div class="id-empty-icon">
          <SvgIcon icon="lucide:server-off" class="text-44px op-55" />
        </div>
        <div class="text-16px font-700">没有匹配的实例</div>
        <div class="mt-8px text-13px op-70">
          {{ searchText || statusFilter !== 'all' ? '试试调整筛选条件或搜索关键词。' : '当实例连接到这个应用后，会在这里形成实例阵列。' }}
        </div>
      </div>

      <div v-else-if="viewMode === 'cards'" class="instance-war-room__grid">
        <NCard
          v-for="instance in filteredInstances"
          :key="instance.instanceId"
          size="small"
          class="id-card signal-instance-card"
          :class="{ 'signal-instance-card--offline': !isOnline(instance) }"
          hoverable
          @click="toInstanceDetail(instance)"
        >
          <div class="signal-instance-card__header">
            <div class="signal-instance-card__identity">
              <div class="id-status-indicator">
                <span class="id-status-dot" :class="isOnline(instance) ? 'signal-instance-card__status-dot--online' : 'signal-instance-card__status-dot--offline'"></span>
                <div>
                  <div class="signal-instance-card__id">{{ instance.instanceId }}</div>
                  <div class="signal-instance-card__ip">{{ instance.ip }}</div>
                </div>
              </div>
            </div>

            <NTag :type="isOnline(instance) ? 'success' : 'error'" size="small" round :bordered="false">
              {{ isOnline(instance) ? '在线' : '离线' }}
            </NTag>
          </div>

          <div class="signal-instance-card__meta-row">
            <span>{{ instance.hostName || '未知主机' }}</span>
            <span>接入 {{ formatCompactTime(instance.registerDate) }}</span>
          </div>

          <div class="signal-instance-card__metrics">
            <div class="signal-instance-card__metric">
              <span class="signal-instance-card__metric-label">JDK</span>
              <strong class="signal-instance-card__metric-value">{{ instance.jdkVersion || '—' }}</strong>
            </div>
            <div class="signal-instance-card__metric">
              <span class="signal-instance-card__metric-label">VM</span>
              <strong class="signal-instance-card__metric-value">{{ instance.vmVersion || instance.vmName || '—' }}</strong>
            </div>
            <div class="signal-instance-card__metric">
              <span class="signal-instance-card__metric-label">架构</span>
              <strong class="signal-instance-card__metric-value">{{ instance.arch || '—' }}</strong>
            </div>
            <div class="signal-instance-card__metric">
              <span class="signal-instance-card__metric-label">CPU / 内存</span>
              <strong class="signal-instance-card__metric-value">{{ instance.availableProcessors ?? '-' }} 核 / {{ formatMemory(instance.memorySize) }}</strong>
            </div>
          </div>

          <div class="signal-instance-card__footer">
            <div class="signal-instance-card__footer-item">
              <SvgIcon icon="lucide:clock-3" class="text-12px" />
              <span>运行 {{ formatUptime(instance.startTime) }}</span>
            </div>
            <div class="signal-instance-card__footer-item">
              <SvgIcon icon="lucide:calendar-range" class="text-12px" />
              <span>{{ formatCompactTime(instance.startTime) }}</span>
            </div>
          </div>
        </NCard>
      </div>

      <div v-else class="instance-war-room__list">
        <button
          v-for="instance in filteredInstances"
          :key="instance.instanceId"
          class="instance-line-card"
          :class="{ 'instance-line-card--offline': !isOnline(instance) }"
          @click="toInstanceDetail(instance)"
        >
          <div class="instance-line-card__primary">
            <div class="id-status-indicator">
              <span class="id-status-dot" :class="isOnline(instance) ? 'signal-instance-card__status-dot--online' : 'signal-instance-card__status-dot--offline'"></span>
              <div>
                <div class="instance-line-card__id">{{ instance.instanceId }}</div>
                <div class="instance-line-card__ip">{{ instance.ip }} · {{ instance.hostName || '未知主机' }}</div>
              </div>
            </div>
          </div>

          <div class="instance-line-card__chips">
            <div class="instance-line-card__chip">
              <span>JDK</span>
              <strong>{{ instance.jdkVersion || '—' }}</strong>
            </div>
            <div class="instance-line-card__chip">
              <span>VM</span>
              <strong>{{ instance.vmVersion || instance.vmName || '—' }}</strong>
            </div>
            <div class="instance-line-card__chip">
              <span>ARCH</span>
              <strong>{{ instance.arch || '—' }}</strong>
            </div>
            <div class="instance-line-card__chip">
              <span>MEM</span>
              <strong>{{ formatMemory(instance.memorySize) }}</strong>
            </div>
          </div>

          <div class="instance-line-card__side">
            <NTag :type="isOnline(instance) ? 'success' : 'error'" size="small" round :bordered="false">
              {{ isOnline(instance) ? '在线' : '离线' }}
            </NTag>
            <span class="instance-line-card__runtime">运行 {{ formatUptime(instance.startTime) }}</span>
          </div>
        </button>
      </div>
    </div>
  </AppPage>
</template>

<style lang="scss">
@use '../instance_detail/styles/instance-detail.scss';

.instance-war-room {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.instance-war-room__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.instance-war-room__header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(var(--primary-color), 0.16), rgba(var(--info-color), 0.14));
  color: rgb(var(--primary-color));
}

.instance-war-room__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.instance-war-room__title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.instance-war-room__subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.instance-war-room__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.instance-war-room__hero {
  position: relative;
  overflow: hidden;
  padding: 26px 32px;
  background:
    radial-gradient(circle at top right, rgba(var(--primary-color), 0.22), transparent 32%),
    radial-gradient(circle at left bottom, rgba(var(--info-color), 0.18), transparent 26%),
    linear-gradient(145deg, rgba(10, 14, 26, 0.99), rgba(22, 30, 50, 0.99));
  color: #f8fafc !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.instance-war-room__hero-mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.95), transparent);
}

.instance-war-room__hero-main,
.instance-war-room__hero-tags {
  position: relative;
}

.instance-war-room__hero-main {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.instance-war-room__hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background-color: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
}

.instance-war-room__hero-title {
  margin-top: 14px;
  font-size: 32px;
  font-weight: 900;
  line-height: 1.15;
  color: #f8fafc;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.instance-war-room__hero-description {
  margin: 10px 0 0;
  max-width: 640px;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(241, 245, 249, 0.72);
}

.instance-war-room__hero-side {
  min-width: 140px;
  text-align: right;
}

.instance-war-room__hero-rate {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
  color: #f8fafc;
}

.instance-war-room__hero-rate-label {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(241, 245, 249, 0.56);
}

.instance-war-room__hero-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.instance-war-room__hero-tag-label {
  font-size: 12px;
  color: rgba(241, 245, 249, 0.6);
}

.instance-war-room__hero-tag-empty {
  font-size: 12px;
  color: rgba(241, 245, 249, 0.5);
}

.instance-war-room__stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.instance-war-room__stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  backdrop-filter: blur(24px);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.03);
  text-align: left;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease;
}

button.instance-war-room__stat-card {
  cursor: pointer;
}

button.instance-war-room__stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--primary-color), 0.35);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08);
}

.instance-war-room__stat-card.is-active {
  border-color: rgba(var(--primary-color), 0.45);
  background: linear-gradient(135deg, rgba(var(--primary-color), 0.1), rgba(255, 255, 255, 0.05));
  box-shadow: 0 8px 24px rgba(var(--primary-color), 0.12);
}

.instance-war-room__stat-card--static {
  cursor: default;
}

.instance-war-room__stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.08);
}

.instance-war-room__stat-label {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.instance-war-room__stat-value {
  margin-top: 4px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.instance-war-room__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background:
    linear-gradient(135deg, rgba(var(--primary-color), 0.06), transparent 36%),
    var(--n-color);
}

.instance-war-room__toolbar-left,
.instance-war-room__toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.instance-war-room__toolbar-hint {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.instance-war-room__search {
  width: 300px;
}

.instance-war-room__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.instance-war-room__empty {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(circle at top, rgba(var(--primary-color), 0.08), transparent 42%),
    var(--n-color);
}

.signal-instance-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 0.35s ease;
  background:
    radial-gradient(circle at top right, rgba(var(--success-color), 0.14), transparent 30%),
    linear-gradient(160deg, rgba(13, 18, 28, 0.98), rgba(26, 34, 52, 0.98));
  color: #f8fafc !important;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-4px) scale(1.01);
    border-color: rgba(var(--primary-color), 0.35);
    box-shadow:
      0 18px 40px rgba(15, 23, 42, 0.25),
      0 0 40px rgba(var(--primary-color), 0.15);
  }
}

.signal-instance-card--offline {
  background:
    radial-gradient(circle at top right, rgba(var(--error-color), 0.16), transparent 26%),
    linear-gradient(160deg, rgba(18, 18, 24, 0.98), rgba(34, 26, 30, 0.98));
  opacity: 0.9;
}

.signal-instance-card__header,
.signal-instance-card__meta-row,
.signal-instance-card__metrics,
.signal-instance-card__footer {
  position: relative;
}

.signal-instance-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.signal-instance-card__id {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #f8fafc;
}

.signal-instance-card__ip,
.signal-instance-card__meta-row,
.signal-instance-card__footer-item {
  font-size: 12px;
  color: rgba(241, 245, 249, 0.62);
}

.signal-instance-card__ip {
  margin-top: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.signal-instance-card__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
}

.signal-instance-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.signal-instance-card__metric {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.signal-instance-card__metric-label {
  font-size: 11px;
  color: rgba(241, 245, 249, 0.54);
  text-transform: uppercase;
}

.signal-instance-card__metric-value {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.35;
  word-break: break-all;
  color: #f8fafc;
}

.signal-instance-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.signal-instance-card__footer-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.signal-instance-card__status-dot--online {
  background-color: rgb(var(--success-color));
  box-shadow: 0 0 10px rgba(var(--success-color), 0.58);
}

.signal-instance-card__status-dot--offline {
  background-color: rgb(var(--error-color));
  box-shadow: none;
  animation: none;
  opacity: 0.7;
}

.instance-war-room__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.instance-line-card {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(var(--primary-color), 0.05), transparent 30%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
  backdrop-filter: blur(12px);
  text-align: left;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--primary-color), 0.35);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  }
}

.instance-line-card--offline {
  background:
    linear-gradient(135deg, rgba(var(--error-color), 0.06), transparent 32%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  opacity: 0.9;
}

.instance-line-card__id {
  font-size: 15px;
  font-weight: 700;
  font-family: 'Consolas', 'Monaco', monospace;
}

.instance-line-card__ip,
.instance-line-card__runtime {
  margin-top: 4px;
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.instance-line-card__chips {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.instance-line-card__chip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background-color: var(--n-color-embedded);
}

.instance-line-card__chip span {
  font-size: 11px;
  color: var(--n-text-color-disabled);
  text-transform: uppercase;
}

.instance-line-card__chip strong {
  font-size: 13px;
  word-break: break-all;
}

.instance-line-card__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

@media (max-width: 1200px) {
  .instance-war-room__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .instance-war-room__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .instance-war-room__toolbar-right {
    justify-content: space-between;
  }

  .instance-line-card {
    grid-template-columns: 1fr;
  }

  .instance-line-card__side {
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .instance-war-room__header,
  .instance-war-room__header-actions,
  .instance-war-room__hero-main,
  .signal-instance-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .instance-war-room__search {
    width: 100%;
  }

  .instance-war-room__stats,
  .instance-war-room__grid,
  .signal-instance-card__metrics,
  .instance-line-card__chips {
    grid-template-columns: 1fr;
  }

  .instance-war-room__hero-side {
    text-align: left;
  }
}
</style>
