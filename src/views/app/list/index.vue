<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TSegmented from '@/components/custom/t-segmented.vue';
import type { OptionsType } from '@/components/custom/types/t-segmented';
import { fetchAppList } from '@/service/api';
import AppCard from '@/views/app/list/modules/app-card.vue';
import { useBoolean } from '~/packages/hooks';

type AppFilter = 'all' | 'healthy' | 'warning' | 'offline';
type AppHealthTone = Exclude<AppFilter, 'all'>;

const appList = ref<Api.Application.AppInfo[]>([]);
const searchText = ref('');
const healthFilter = ref<AppFilter>('all');
const { bool: loading, setTrue: startLoading, setFalse: stopLoading } = useBoolean();

const filterOptions: OptionsType[] = [
  { label: '全部', value: 'all', icon: 'lucide:layout-grid', iconType: 'iconify' },
  { label: '健康', value: 'healthy', icon: 'lucide:shield-check', iconType: 'iconify' },
  { label: '风险', value: 'warning', icon: 'lucide:triangle-alert', iconType: 'iconify' },
  { label: '离线', value: 'offline', icon: 'lucide:power-off', iconType: 'iconify' }
];

function resolveHealthTone(app: Api.Application.AppInfo): AppHealthTone {
  if (!app.instanceNum || app.onlineInstanceNum === 0) return 'offline';
  if (app.onlineInstanceNum === app.instanceNum) return 'healthy';
  return 'warning';
}

const totalInstances = computed(() => appList.value.reduce((sum, app) => sum + (app.instanceNum || 0), 0));
const totalOnline = computed(() => appList.value.reduce((sum, app) => sum + (app.onlineInstanceNum || 0), 0));
const totalOffline = computed(() => appList.value.reduce((sum, app) => sum + (app.offlineInstanceNum || 0), 0));
const onlineRate = computed(() => {
  if (!totalInstances.value) return 0;
  return Math.round((totalOnline.value / totalInstances.value) * 100);
});
const riskAppCount = computed(() => appList.value.filter(app => resolveHealthTone(app) !== 'healthy').length);
const hostCoverage = computed(() => appList.value.reduce((sum, app) => sum + (app.hostCount || 0), 0));

const filteredApps = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();

  return [...appList.value]
    .filter(app => healthFilter.value === 'all' || resolveHealthTone(app) === healthFilter.value)
    .filter(app => {
      if (!keyword) return true;
      return [
        app.appName,
        ...(app.topJdkVersions || [])
      ]
        .filter((value): value is string => Boolean(value))
        .some(value => value.toLowerCase().includes(keyword));
    })
    .sort((a, b) => {
      const toneWeight = { warning: 0, offline: 1, healthy: 2 } as const;
      const toneDiff = toneWeight[resolveHealthTone(a)] - toneWeight[resolveHealthTone(b)];
      if (toneDiff !== 0) return toneDiff;
      return (b.instanceNum || 0) - (a.instanceNum || 0);
    });
});

function fetchData() {
  startLoading();
  fetchAppList()
    .then(res => {
      appList.value = res.data || [];
    })
    .finally(() => stopLoading());
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="app-command-page">
    <section class="app-command-hero id-card">
      <div class="app-command-hero__mesh"></div>
      <div class="app-command-hero__content">
        <div class="app-command-hero__copy">
          <span class="app-command-hero__eyebrow">Application Control Deck</span>
          <h1 class="app-command-hero__title">应用编组</h1>
          <p class="app-command-hero__description">
            统一查看接入规模、健康度与版本分布，优先锁定存在波动和离线风险的应用。
          </p>
        </div>

        <div class="app-command-hero__actions">
          <NInput
            v-model:value="searchText"
            class="app-command-search"
            placeholder="搜索应用名或 JDK 版本..."
            clearable
          >
            <template #prefix>
              <SvgIcon icon="lucide:search" class="text-14px" />
            </template>
          </NInput>
          <NButton type="primary" secondary :loading="loading" @click="fetchData">
            <template #icon>
              <SvgIcon icon="lucide:refresh-cw" />
            </template>
            刷新数据
          </NButton>
        </div>
      </div>

      <div class="app-command-stats">
        <div class="app-command-stat-card">
          <div class="app-command-stat-card__icon bg-primary/12 text-primary">
            <SvgIcon icon="lucide:boxes" class="text-18px" />
          </div>
          <div>
            <div class="app-command-stat-card__label">应用总数</div>
            <div class="app-command-stat-card__value">{{ appList.length }}</div>
          </div>
        </div>

        <div class="app-command-stat-card">
          <div class="app-command-stat-card__icon bg-info/12 text-info">
            <SvgIcon icon="lucide:server" class="text-18px" />
          </div>
          <div>
            <div class="app-command-stat-card__label">实例规模</div>
            <div class="app-command-stat-card__value">{{ totalInstances }}</div>
          </div>
        </div>

        <div class="app-command-stat-card">
          <div class="app-command-stat-card__icon bg-success/12 text-success">
            <SvgIcon icon="lucide:activity" class="text-18px" />
          </div>
          <div>
            <div class="app-command-stat-card__label">在线率</div>
            <div class="app-command-stat-card__value text-success">{{ onlineRate }}%</div>
          </div>
        </div>

        <div class="app-command-stat-card">
          <div class="app-command-stat-card__icon bg-warning/12 text-warning">
            <SvgIcon icon="lucide:triangle-alert" class="text-18px" />
          </div>
          <div>
            <div class="app-command-stat-card__label">风险应用</div>
            <div class="app-command-stat-card__value text-warning">{{ riskAppCount }}</div>
          </div>
        </div>

        <div class="app-command-stat-card">
          <div class="app-command-stat-card__icon bg-purple-500/12 text-purple-500">
            <SvgIcon icon="lucide:network" class="text-18px" />
          </div>
          <div>
            <div class="app-command-stat-card__label">部署主机</div>
            <div class="app-command-stat-card__value">{{ hostCoverage }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="app-command-toolbar id-card">
      <div class="app-command-toolbar__left">
        <TSegmented v-model:model-value="healthFilter" :options="filterOptions" size="large" />
        <span class="app-command-toolbar__hint">
          当前显示 {{ filteredApps.length }} / {{ appList.length }} 个应用，在线 {{ totalOnline }}，离线 {{ totalOffline }}
        </span>
      </div>
    </section>

    <div v-if="loading && appList.length === 0" class="app-command-grid">
      <NCard v-for="i in 6" :key="i" class="id-card" size="small">
        <NSkeleton text :repeat="6" round />
      </NCard>
    </div>

    <div v-else-if="filteredApps.length === 0" class="id-empty-state app-command-empty id-card">
      <div class="id-empty-icon">
        <SvgIcon icon="lucide:package-search" class="text-44px op-55" />
      </div>
      <div class="text-16px font-700">没有匹配的应用</div>
      <div class="mt-8px text-13px op-70">
        {{ searchText ? '试试调整关键词，或者切换健康筛选条件。' : '当应用接入 Tutelary 后，会在这里形成编组视图。' }}
      </div>
    </div>

    <div v-else class="app-command-grid">
      <AppCard v-for="app in filteredApps" :key="app.appName" :app="app" />
    </div>
  </div>
</template>

<style lang="scss">
@use '../instance_detail/styles/instance-detail.scss';

.app-command-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 20px;
}

.app-command-hero {
  position: relative;
  overflow: hidden;
  padding: 28px 32px;
  background:
    radial-gradient(circle at top left, rgba(var(--primary-color), 0.22), transparent 45%),
    radial-gradient(circle at 82% 18%, rgba(var(--success-color), 0.18), transparent 35%),
    linear-gradient(135deg, rgba(11, 15, 27, 0.99), rgba(24, 31, 53, 0.98));
  color: #f8fafc !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.app-command-hero__mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent);
  pointer-events: none;
}

.app-command-hero__content {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.app-command-hero__copy {
  max-width: 620px;
}

.app-command-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.06);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f8fafc;
}

.app-command-hero__title {
  margin: 16px 0 10px;
  font-size: 38px;
  line-height: 1.1;
  font-weight: 900;
  color: #f8fafc;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.app-command-hero__description {
  margin: 0;
  max-width: 580px;
  color: rgba(248, 250, 252, 0.84);
  font-size: 15px;
  line-height: 1.7;
}

.app-command-hero__actions {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-left: auto;
}

.app-command-search {
  width: 320px;
}

.app-command-stats {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.app-command-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  backdrop-filter: blur(24px);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.app-command-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 24px rgba(0, 0, 0, 0.12);
}

.app-command-stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1);
}

.app-command-stat-card__label {
  font-size: 13px;
  color: rgba(248, 250, 252, 0.65);
}

.app-command-stat-card__value {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
  color: #f8fafc;
}

.app-command-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background:
    linear-gradient(135deg, rgba(var(--primary-color), 0.06), transparent 36%),
    var(--n-color);
}

.app-command-toolbar__left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.app-command-toolbar__hint {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.app-command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.app-command-empty {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(circle at top, rgba(var(--primary-color), 0.08), transparent 42%),
    var(--n-color);
}

@media (max-width: 1200px) {
  .app-command-hero__content {
    flex-direction: column;
  }

  .app-command-hero__actions {
    width: 100%;
    margin-left: 0;
  }

  .app-command-search {
    flex: 1;
    width: auto;
  }

  .app-command-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .app-command-hero {
    padding: 18px;
  }

  .app-command-hero__title {
    font-size: 28px;
  }

  .app-command-hero__actions {
    flex-direction: column;
  }

  .app-command-search {
    width: 100%;
  }

  .app-command-stats {
    grid-template-columns: 1fr;
  }

  .app-command-grid {
    grid-template-columns: 1fr;
  }
}
</style>
