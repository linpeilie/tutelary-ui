<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TSegmented from '@/components/custom/t-segmented.vue';
import type { OptionsType } from '@/components/custom/types/t-segmented';
import { fetchAppList } from '@/service/api';
import AppCard from '@/views/app/list/modules/app-card.vue';
import { useBoolean } from '~/packages/hooks';

type AppFilter = 'all' | 'active' | 'empty' | 'attention';
type AppHealthTone = Exclude<AppFilter, 'all'>;

const appList = ref<Api.Application.AppInfo[]>([]);
const searchText = ref('');
const healthFilter = ref<AppFilter>('all');
const { bool: loading, setTrue: startLoading, setFalse: stopLoading } = useBoolean();

const filterOptions: OptionsType[] = [
  { label: '全部', value: 'all', icon: 'lucide:layout-grid', iconType: 'iconify' },
  { label: '有实例', value: 'active', icon: 'lucide:server', iconType: 'iconify' },
  { label: '空应用', value: 'empty', icon: 'lucide:server-off', iconType: 'iconify' },
  { label: '需关注', value: 'attention', icon: 'lucide:triangle-alert', iconType: 'iconify' }
];

function resolveHealthTone(app: Api.Application.AppInfo): AppHealthTone {
  if (!app.instanceNum) return 'empty';
  if (typeof app.onlineInstanceNum === 'number' && app.onlineInstanceNum < app.instanceNum) return 'attention';
  return 'active';
}

const totalInstances = computed(() => appList.value.reduce((sum, app) => sum + (app.instanceNum || 0), 0));
const activeAppCount = computed(() => appList.value.filter(app => (app.instanceNum || 0) > 0).length);
const emptyAppCount = computed(() => appList.value.length - activeAppCount.value);

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
      const toneWeight = { attention: 0, empty: 1, active: 2 } as const;
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
    <section class="app-command-hero">
      <div class="app-command-hero__content">
        <div class="app-command-hero__copy">
          <h1 class="app-command-hero__title">应用列表</h1>
          <p class="app-command-hero__description">
            查看已接入应用和登记实例规模，进入应用后查看会话、Lease 和运行态。
          </p>
        </div>

        <div class="app-command-summary" aria-label="应用摘要">
          <div class="app-command-summary__item">
            <span>应用</span>
            <strong>{{ appList.length }}</strong>
          </div>
          <div class="app-command-summary__item">
            <span>实例</span>
            <strong>{{ totalInstances }}</strong>
          </div>
          <div class="app-command-summary__item">
            <span>有实例</span>
            <strong>{{ activeAppCount }}</strong>
          </div>
        </div>

        <div class="app-command-hero__actions">
          <NInput
            v-model:value="searchText"
            class="app-command-search"
            placeholder="搜索应用名或 JDK 版本"
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

    </section>

    <section class="app-command-toolbar id-card">
      <div class="app-command-toolbar__left">
        <TSegmented v-model:model-value="healthFilter" :options="filterOptions" size="large" />
        <span class="app-command-toolbar__hint">
          当前显示 {{ filteredApps.length }} / {{ appList.length }} 个应用，空应用 {{ emptyAppCount }}
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
  gap: 16px;
  padding: 16px 20px;
}

.app-command-hero {
  padding: 6px 2px 2px;
}

.app-command-hero__content {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(360px, auto);
  align-items: center;
  gap: 18px;
}

.app-command-hero__copy {
  min-width: 0;
}

.app-command-hero__title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 800;
}

.app-command-hero__description {
  margin: 6px 0 0;
  color: var(--n-text-color-disabled);
  font-size: 13px;
}

.app-command-summary {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background-color: var(--n-color);
}

.app-command-summary__item {
  min-width: 78px;
  padding: 6px 12px;
  border-right: 1px solid var(--n-border-color);
}

.app-command-summary__item:last-child {
  border-right: 0;
}

.app-command-summary__item span {
  display: block;
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.app-command-summary__item strong {
  display: block;
  margin-top: 2px;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
}

.app-command-hero__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-command-search {
  width: 260px;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
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
    grid-template-columns: 1fr;
  }

  .app-command-hero__actions {
    width: 100%;
  }

  .app-command-search {
    flex: 1;
    width: auto;
  }

  .app-command-summary {
    width: fit-content;
  }
}

@media (max-width: 768px) {
  .app-command-hero__title {
    font-size: 22px;
  }

  .app-command-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .app-command-search {
    width: 100%;
  }

  .app-command-summary {
    width: 100%;
  }

  .app-command-summary__item {
    flex: 1;
    min-width: 0;
  }

  .app-command-grid {
    grid-template-columns: 1fr;
  }
}
</style>
