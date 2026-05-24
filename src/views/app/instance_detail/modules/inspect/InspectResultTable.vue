<script setup lang="ts">
import { computed, h } from 'vue';
import { NButton, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';
import type { InspectResponse } from '@/proto/command/result/InspectResponse';

interface Props {
  results: InspectResponse[];
  running: boolean;
  recovering: boolean;
  capturedCount: number;
  totalCount: number;
  progress: number;
}

interface Emits {
  view: [result: InspectResponse];
  clear: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const hasResults = computed(() => props.results.length > 0);
const failedCount = computed(() => props.results.filter(result => Boolean(result.exception)).length);
const averageCost = computed(() => {
  if (!props.results.length) return 0;
  const total = props.results.reduce((sum, result) => sum + (result.cost || 0), 0);
  return total / props.results.length;
});

function formatCost(cost: number) {
  const ms = cost / 1_000_000;
  if (ms >= 100) return `${ms.toFixed(0)} ms`;
  if (ms >= 10) return `${ms.toFixed(1)} ms`;
  return `${ms.toFixed(2)} ms`;
}

function durationType(cost: number) {
  const ms = cost / 1_000_000;
  if (ms >= 200) return 'error';
  if (ms >= 100) return 'warning';
  return 'success';
}

const columns = computed<DataTableColumns<InspectResponse>>(() => [
  {
    title: '#',
    key: 'index',
    width: 56,
    render: (_row, index) => `${index + 1}`
  },
  {
    title: '方法',
    key: 'method',
    minWidth: 240,
    render: row => h('div', { class: 'inspect-method-cell' }, [
      h('span', { class: 'inspect-method-name' }, `${row.methodName}()`),
      h('span', { class: 'inspect-method-class' }, row.className)
    ])
  },
  {
    title: '执行时间',
    key: 'finishTime',
    width: 180,
    render: row => row.finishTime || '-'
  },
  {
    title: '耗时',
    key: 'cost',
    width: 120,
    render: row => h(
      NTag,
      { type: durationType(row.cost), size: 'small', bordered: false },
      { default: () => formatCost(row.cost) }
    )
  },
  {
    title: '线程',
    key: 'thread',
    minWidth: 180,
    render: row => row.thread?.name || '-'
  },
  {
    title: '异常',
    key: 'exception',
    width: 100,
    render: row => h(
      NTag,
      { type: row.exception ? 'error' : 'success', size: 'small', bordered: false },
      { default: () => (row.exception ? '异常' : '正常') }
    )
  },
  {
    title: '附加',
    key: 'features',
    width: 160,
    render: row => {
      const tags: ReturnType<typeof h>[] = [];
      if (row.traceNode) tags.push(h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => 'Trace' }));
      if (row.stackTraceNodeList?.length) {
        tags.push(h(NTag, { size: 'small', bordered: false, type: 'warning' }, { default: () => 'Stack' }));
      }
      if (row.returnValue) {
        tags.push(h(NTag, { size: 'small', bordered: false, type: 'success' }, { default: () => 'Return' }));
      }
      return h('div', { class: 'inspect-feature-tags' }, tags.length ? tags : '-');
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center',
    render: row => h(
      NButton,
      { size: 'small', tertiary: true, type: 'primary', onClick: () => emit('view', row) },
      {
        icon: () => h(SvgIcon, { icon: 'lucide:panel-right-open', class: 'inspect-action-icon' }),
        default: () => '详情'
      }
    )
  }
]);

function rowKey(row: InspectResponse) {
  return `${row.finishTime}|${row.className}|${row.methodName}|${row.cost}|${row.thread?.id || ''}`;
}
</script>

<template>
  <NCard size="small" class="id-card inspect-result-card">
    <template #header>
      <div class="inspect-result-head">
        <div class="inspect-result-title">
          <SvgIcon icon="lucide:list-checks" class="text-16px text-primary" />
          <span>结果</span>
        </div>
        <div class="inspect-result-meta">
          <NTag size="small" :bordered="false">捕获 {{ capturedCount }}</NTag>
          <NTag size="small" :type="failedCount ? 'error' : 'success'" :bordered="false">
            异常 {{ failedCount }}
          </NTag>
          <NTag v-if="hasResults" size="small" type="info" :bordered="false">
            平均 {{ formatCost(averageCost) }}
          </NTag>
          <NButton size="tiny" :disabled="running || results.length === 0" @click="emit('clear')">
            <template #icon>
              <SvgIcon icon="lucide:trash-2" />
            </template>
            清空
          </NButton>
        </div>
      </div>
    </template>

    <div v-if="running || recovering" class="inspect-progress">
      <div class="inspect-progress-head">
        <span>{{ running ? '采集中' : '恢复中' }}</span>
        <span>{{ capturedCount }} / {{ totalCount || '-' }}</span>
      </div>
      <NProgress type="line" :percentage="progress" :show-indicator="false" processing />
    </div>

    <NDataTable
      v-if="hasResults"
      size="small"
      :columns="columns"
      :data="results"
      :row-key="rowKey"
      :pagination="{ pageSize: 10 }"
      :scroll-x="1100"
    />
    <NEmpty v-else description="暂无调用记录" class="inspect-empty">
      <template #icon>
        <SvgIcon icon="lucide:radar" class="text-4xl" />
      </template>
    </NEmpty>
  </NCard>
</template>

<style scoped>
.inspect-result-card {
  min-width: 0;
}

.inspect-result-head,
.inspect-result-title,
.inspect-result-meta {
  display: flex;
  align-items: center;
}

.inspect-result-head {
  justify-content: space-between;
  gap: 12px;
}

.inspect-result-title {
  gap: 8px;
  min-width: 0;
  font-weight: 650;
}

.inspect-result-meta {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.inspect-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.inspect-progress-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--n-text-color-2);
}

:deep(.inspect-feature-tags) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

:deep(.inspect-method-cell) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

:deep(.inspect-method-name) {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-weight: 650;
  color: var(--n-text-color);
}

:deep(.inspect-method-class) {
  overflow: hidden;
  color: var(--n-text-color-2);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.inspect-action-icon) {
  font-size: 14px;
}

.inspect-empty {
  padding: 54px 0;
  border: 1px dashed var(--n-border-color);
  border-radius: 8px;
}

@media (max-width: 720px) {
  .inspect-result-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .inspect-result-meta {
    justify-content: flex-start;
  }
}
</style>
