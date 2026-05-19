<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import TSegmented from '@/components/custom/t-segmented.vue';
import type { OptionsType } from '@/components/custom/types/t-segmented';
import { fetchAppDetail } from '@/service/api';
import { formatTimeDifference } from '@/utils/time';
import { useRoute, useRouter } from 'vue-router';
import { useBoolean } from '~/packages/hooks';

type RuntimeStatus =
  | 'REGISTERING'
  | 'ONLINE'
  | 'DRAINING'
  | 'SUSPECT'
  | 'TEMP_OFFLINE'
  | 'PERMANENT_OFFLINE'
  | 'DELETED';
type StatusFilter = 'all' | 'online' | 'suspect' | 'offline' | 'permanent';
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
  { label: '疑似', value: 'suspect', icon: 'lucide:circle-alert', iconType: 'iconify' },
  { label: '临时下线', value: 'offline', icon: 'lucide:power-off', iconType: 'iconify' },
  { label: '永久下线', value: 'permanent', icon: 'lucide:archive-x', iconType: 'iconify' }
];

const viewOptions: OptionsType[] = [
  { label: '卡片视图', value: 'cards', icon: 'lucide:panel-top', iconType: 'iconify' },
  { label: '紧凑视图', value: 'list', icon: 'lucide:list-collapse', iconType: 'iconify' }
];

const instances = computed(() => appDetail.value?.instances || []);

function runtimeStatus(instance: Api.Instance.InstanceInfo): RuntimeStatus {
  if (instance.runtimeStatus) return instance.runtimeStatus as RuntimeStatus;
  return (instance.online ?? instance.state === 1) ? 'ONLINE' : 'TEMP_OFFLINE';
}

function isOnline(instance: Api.Instance.InstanceInfo) {
  return ['ONLINE', 'DRAINING'].includes(runtimeStatus(instance));
}

function isSuspect(instance: Api.Instance.InstanceInfo) {
  return runtimeStatus(instance) === 'SUSPECT';
}

function isPermanentOffline(instance: Api.Instance.InstanceInfo) {
  return ['PERMANENT_OFFLINE', 'DELETED'].includes(runtimeStatus(instance));
}

function isTemporaryOffline(instance: Api.Instance.InstanceInfo) {
  return ['TEMP_OFFLINE', 'REGISTERING'].includes(runtimeStatus(instance));
}

const onlineCount = computed(() => instances.value.filter(isOnline).length);
const suspectCount = computed(() => instances.value.filter(isSuspect).length);
const temporaryOfflineCount = computed(() => instances.value.filter(isTemporaryOffline).length);
const permanentOfflineCount = computed(() => instances.value.filter(isPermanentOffline).length);
const offlineCount = computed(() => instances.value.length - onlineCount.value);
const onlineRate = computed(() => {
  if (!instances.value.length) return 0;
  return Math.round((onlineCount.value / instances.value.length) * 100);
});
const hostCount = computed(() => appDetail.value?.hostCount || 0);

const runtimeStatusMeta: Record<RuntimeStatus, { label: string; type: 'default' | 'success' | 'warning' | 'error' | 'info'; tone: string }> = {
  REGISTERING: { label: '注册中', type: 'info', tone: 'registering' },
  ONLINE: { label: '在线', type: 'success', tone: 'online' },
  DRAINING: { label: '摘流中', type: 'warning', tone: 'draining' },
  SUSPECT: { label: '疑似下线', type: 'warning', tone: 'suspect' },
  TEMP_OFFLINE: { label: '临时下线', type: 'error', tone: 'offline' },
  PERMANENT_OFFLINE: { label: '永久下线', type: 'error', tone: 'permanent' },
  DELETED: { label: '已删除', type: 'default', tone: 'deleted' }
};

function getRuntimeMeta(instance: Api.Instance.InstanceInfo) {
  return runtimeStatusMeta[runtimeStatus(instance)] || runtimeStatusMeta.TEMP_OFFLINE;
}

function runtimeStatusWeight(instance: Api.Instance.InstanceInfo) {
  const weight: Record<RuntimeStatus, number> = {
    SUSPECT: 0,
    REGISTERING: 1,
    TEMP_OFFLINE: 2,
    PERMANENT_OFFLINE: 3,
    DELETED: 4,
    DRAINING: 5,
    ONLINE: 6
  };
  return weight[runtimeStatus(instance)] ?? 2;
}

const filteredInstances = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();

  return [...instances.value]
    .filter(instance => {
      if (statusFilter.value === 'online') return isOnline(instance);
      if (statusFilter.value === 'suspect') return isSuspect(instance);
      if (statusFilter.value === 'offline') return isTemporaryOffline(instance);
      if (statusFilter.value === 'permanent') return isPermanentOffline(instance);
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
        instance.arch,
        instance.env,
        instance.region,
        instance.zone,
        instance.runtimeStatus,
        instance.ownerNodeId,
        instance.runtimeId,
        instance.bootId,
        instance.reason
      ]
        .filter((value): value is string => Boolean(value))
        .some(value => value.toLowerCase().includes(keyword));
    })
    .sort((a, b) => {
      const statusDiff = runtimeStatusWeight(a) - runtimeStatusWeight(b);
      if (statusDiff !== 0) return statusDiff;
      return timeValue(b.lastSeenAt || b.leaseExpireAt || b.startTime)
        - timeValue(a.lastSeenAt || a.leaseExpireAt || a.startTime);
    });
});

const headerStatus = computed(() => {
  if (!instances.value.length || onlineCount.value === 0) return { label: '离线风险', type: 'error' as const };
  if (suspectCount.value > 0) return { label: '存在疑似下线', type: 'warning' as const };
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

function formatRelativeTime(value?: string) {
  if (!value) return '—';
  return formatTimeDifference(value, dayjs());
}

function formatLocation(instance: Api.Instance.InstanceInfo) {
  const location = [instance.env, instance.region, instance.zone].filter(Boolean).join(' / ');
  return location || 'default';
}

function formatOwner(instance: Api.Instance.InstanceInfo) {
  if (!instance.ownerNodeId) return '—';
  return instance.ownerNodeId;
}

function timeValue(value?: string) {
  if (!value) return 0;
  const timestamp = dayjs(value).valueOf();
  return Number.isNaN(timestamp) ? 0 : timestamp;
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
            注册于 {{ formatAbsoluteTime(appDetail?.registerDate) }} · {{ hostCount }} 台主机 · 在线率 {{ onlineRate }}% ·
            疑似 {{ suspectCount }} / 临时下线 {{ temporaryOfflineCount }} / 永久下线 {{ permanentOfflineCount }}
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
      <section class="instance-war-room__toolbar id-card">
        <div class="instance-war-room__toolbar-left">
          <TSegmented v-model:model-value="statusFilter" :options="statusOptions" size="large" />
          <div class="instance-war-room__summary" aria-label="实例摘要">
            <span>总数 {{ instances.length }}</span>
            <span>在线 {{ onlineCount }}</span>
            <span>疑似 {{ suspectCount }}</span>
            <span>下线 {{ offlineCount }}</span>
          </div>
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
          :class="`signal-instance-card--${getRuntimeMeta(instance).tone}`"
          hoverable
          @click="toInstanceDetail(instance)"
        >
          <div class="signal-instance-card__header">
            <div class="signal-instance-card__identity">
              <div class="id-status-indicator">
                <span class="id-status-dot" :class="`signal-instance-card__status-dot--${getRuntimeMeta(instance).tone}`"></span>
                <div>
                  <div class="signal-instance-card__id">{{ instance.instanceId }}</div>
                  <div class="signal-instance-card__ip">{{ instance.ip }} · {{ formatLocation(instance) }}</div>
                </div>
              </div>
            </div>

            <NTag :type="getRuntimeMeta(instance).type" size="small" round :bordered="false">
              {{ getRuntimeMeta(instance).label }}
            </NTag>
          </div>

          <div class="signal-instance-card__meta-row">
            <span>{{ instance.hostName || '未知主机' }}</span>
            <span>心跳 {{ formatRelativeTime(instance.lastSeenAt) }}</span>
          </div>

          <div class="signal-instance-card__metrics">
            <div class="signal-instance-card__metric">
              <span class="signal-instance-card__metric-label">JDK</span>
              <strong class="signal-instance-card__metric-value">{{ instance.jdkVersion || '—' }}</strong>
            </div>
            <div class="signal-instance-card__metric">
              <span class="signal-instance-card__metric-label">Lease</span>
              <strong class="signal-instance-card__metric-value">{{ formatCompactTime(instance.leaseExpireAt) }}</strong>
            </div>
            <div class="signal-instance-card__metric">
              <span class="signal-instance-card__metric-label">Epoch</span>
              <strong class="signal-instance-card__metric-value">{{ instance.ownerEpoch ?? '—' }}</strong>
            </div>
            <div class="signal-instance-card__metric">
              <span class="signal-instance-card__metric-label">运行</span>
              <strong class="signal-instance-card__metric-value">{{ formatUptime(instance.startTime) }}</strong>
            </div>
          </div>

          <div class="signal-instance-card__footer">
            <div class="signal-instance-card__footer-item">
              <SvgIcon icon="lucide:server-cog" class="text-12px" />
              <span>{{ formatOwner(instance) }}</span>
            </div>
            <div class="signal-instance-card__footer-item">
              <SvgIcon icon="lucide:message-square-warning" class="text-12px" />
              <span>{{ instance.reason || '—' }}</span>
            </div>
          </div>
        </NCard>
      </div>

      <div v-else class="instance-war-room__list">
        <button
          v-for="instance in filteredInstances"
          :key="instance.instanceId"
          class="instance-line-card"
          :class="`instance-line-card--${getRuntimeMeta(instance).tone}`"
          @click="toInstanceDetail(instance)"
        >
          <div class="instance-line-card__primary">
            <div class="id-status-indicator">
              <span class="id-status-dot" :class="`signal-instance-card__status-dot--${getRuntimeMeta(instance).tone}`"></span>
              <div>
                <div class="instance-line-card__id">{{ instance.instanceId }}</div>
                <div class="instance-line-card__ip">
                  {{ instance.ip }} · {{ instance.hostName || '未知主机' }} · {{ formatLocation(instance) }}
                </div>
              </div>
            </div>
          </div>

          <div class="instance-line-card__chips">
            <div class="instance-line-card__chip">
              <span>心跳</span>
              <strong>{{ formatRelativeTime(instance.lastSeenAt) }}</strong>
            </div>
            <div class="instance-line-card__chip">
              <span>Lease</span>
              <strong>{{ formatCompactTime(instance.leaseExpireAt) }}</strong>
            </div>
            <div class="instance-line-card__chip">
              <span>Epoch</span>
              <strong>{{ instance.ownerEpoch ?? '—' }}</strong>
            </div>
          </div>

          <div class="instance-line-card__side">
            <NTag :type="getRuntimeMeta(instance).type" size="small" round :bordered="false">
              {{ getRuntimeMeta(instance).label }}
            </NTag>
            <span class="instance-line-card__runtime">{{ instance.reason || formatOwner(instance) }}</span>
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
  gap: 14px;
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

.instance-war-room__summary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.instance-war-room__summary span {
  white-space: nowrap;
}

.instance-war-room__search {
  width: 300px;
}

.instance-war-room__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
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
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  border-left: 3px solid rgb(var(--success-color));

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--primary-color), 0.35);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  }
}

.signal-instance-card--draining,
.signal-instance-card--suspect,
.signal-instance-card--registering {
  border-left-color: rgb(var(--warning-color));
}

.signal-instance-card--offline,
.signal-instance-card--permanent,
.signal-instance-card--deleted {
  border-left-color: rgb(var(--error-color));
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
}

.signal-instance-card__ip,
.signal-instance-card__meta-row,
.signal-instance-card__footer-item {
  font-size: 12px;
  color: var(--n-text-color-disabled);
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
  border-radius: 8px;
  background: var(--n-color-embedded);
}

.signal-instance-card__metric-label {
  font-size: 11px;
  color: var(--n-text-color-disabled);
  text-transform: uppercase;
}

.signal-instance-card__metric-value {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.35;
  word-break: break-all;
}

.signal-instance-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--n-border-color);
}

.signal-instance-card__footer-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.signal-instance-card__footer-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signal-instance-card__status-dot--online,
.signal-instance-card__status-dot--draining {
  background-color: rgb(var(--success-color));
  box-shadow: 0 0 10px rgba(var(--success-color), 0.58);
}

.signal-instance-card__status-dot--suspect,
.signal-instance-card__status-dot--registering {
  background-color: rgb(var(--warning-color));
  box-shadow: 0 0 10px rgba(var(--warning-color), 0.5);
}

.signal-instance-card__status-dot--offline,
.signal-instance-card__status-dot--permanent,
.signal-instance-card__status-dot--deleted {
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
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.9fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--n-color);
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

.instance-line-card--suspect,
.instance-line-card--draining,
.instance-line-card--registering {
  border-left: 3px solid rgb(var(--warning-color));
}

.instance-line-card--offline,
.instance-line-card--permanent,
.instance-line-card--deleted {
  border-left: 3px solid rgb(var(--error-color));
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.instance-line-card__chip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
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
  .signal-instance-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .instance-war-room__search {
    width: 100%;
  }

  .instance-war-room__grid,
  .signal-instance-card__metrics,
  .instance-line-card__chips {
    grid-template-columns: 1fr;
  }
}
</style>
