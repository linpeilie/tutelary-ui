<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NProgress,
  NTag
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchTraceCommand } from '@/service/api/instance';
import eventbus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { TraceResponse } from '@/proto/command/result/TraceResponse';
import type { TraceRequest } from '@/proto/command/param/TraceRequest';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;
import { div4Round } from '@/utils/math';

// Props
interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

// 表单数据
const formData = ref({
  className: 'com.tutelary.example.MathGame',
  methodName: 'primeFactors',
  count: 10,
  minTime: null as number | null,
  includeJdk: false,
  skipConstructor: false,
  deepTrace: true
});

// 追踪状态
const isTracing = ref(false);
const capturedCount = ref(0);
const totalCount = ref(10);
const progress = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((capturedCount.value / totalCount.value) * 100);
});

// 追踪结果
interface TraceResult {
  index: number;
  time: string;
  duration: number;
  depth: number;
  className: string;
  methodName: string;
  traceTree: Array<{
    name: string;
    time: number;
    depth: number;
    color: string;
  }>;
}

const traceResults = ref<TraceResponse[]>([]);
const hasResults = computed(() => traceResults.value.length > 0);

// 详情模态框
const showDetailModal = ref(false);
const selectedTrace = ref<TraceResult | null>(null);

// 获取耗时标签类型
const getDurationTagType = (duration: number) => {
  if (duration > 200) return 'error';
  if (duration > 100) return 'warning';
  return 'success';
};

// 查看详情
const handleViewDetail = (trace: TraceResult) => {
  selectedTrace.value = trace;
  showDetailModal.value = true;
};

// 表格列配置
const columns: DataTableColumns<TraceResponse> = [
  {
    title: '方法',
    key: 'method',
    width: 200,
    render: (row: TraceResponse) => {
      if (row.node.isThrow) {
        return h(
          'div',
          [
            h('span', row.node.methodName),
            h('span', {
              class: 'text-red-600/[.40] font-semibold'
            }, ' Throw ex'),
          ]
        );
      }
      return h('div', `${row.node.methodName}`);
    }
  },
  {
    title: '调用时间',
    key: 'time',
    width: 200,
    render: (row: TraceResponse) => row.finishTime
  },
  {
    title: '总耗时 (ms)',
    key: 'duration',
    width: 150,
    render: (row: TraceResponse) => {
      return h(
        NTag,
        {
          type: getDurationTagType(div4Round(row.node.totalCost, 1000000, 0)),
          size: 'small',
          bordered: false
        },
        { default: () => `${div4Round(row.node.totalCost, 1000000, 0)}ms` }
      );
    }
  },
  {
    title: '调用深度',
    key: 'depth',
    width: 120,
    render: (row: TraceResponse) => `${row.node.children.length} 层`
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center',
    render: (row: TraceResult) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => handleViewDetail(row)
        },
        { default: () => '查看详情' }
      );
    }
  }
];

onMounted(() => {
  eventbus.on('command:trace', (data: CommandExecuteResponse<TraceResponse>) => {
    console.log('data', data);
    if (data.data) {
      const traceResponse = data.data as TraceResponse;
      traceResults.value.push(traceResponse);
    }
  });
});

onUnmounted(() => {
  eventbus.off('command:trace');
});

// 开始追踪
const handleStartTrace = async () => {
  if (!formData.value.className || !formData.value.methodName || !formData.value.count) {
    window.$message?.warning('请填写完整的追踪参数');
    return;
  }

  isTracing.value = true;
  capturedCount.value = 0;
  totalCount.value = formData.value.count;
  traceResults.value = [];

  const params = {
    instanceId: props.instanceId,
    param: {
      qualifiedClassName: formData.value.className,
      methodNames: [formData.value.methodName],
      times: formData.value.count,
      cost: formData.value.minTime
    }
  } as CommandCreateRequest<TraceRequest>;

  fetchTraceCommand(params).catch(() => {
    isTracing.value = false;
  });

  // // 模拟追踪过程
  // const interval = setInterval(() => {
  //   capturedCount.value++;
  //
  //   // 生成单条追踪结果
  //   const time = new Date().toLocaleString('zh-CN');
  //   const duration = Math.round(Math.random() * 500 + 10);
  //   const depth = Math.floor(Math.random() * 5 + 3);
  //   const traceTree = generateTraceTreeData(formData.value.className, formData.value.methodName, duration);
  //
  //   const result: TraceResult = {
  //     index: capturedCount.value,
  //     time,
  //     duration,
  //     depth,
  //     className: formData.value.className,
  //     methodName: formData.value.methodName,
  //     traceTree
  //   };
  //
  //   traceResults.value.push(result);
  //
  //   if (capturedCount.value >= totalCount.value) {
  //     clearInterval(interval);
  //     isTracing.value = false;
  //     window.$message?.success(`追踪完成! 已捕获 ${totalCount.value} 条调用记录`);
  //   }
  // }, 200);
};

// 停止追踪
const handleStopTrace = () => {
  isTracing.value = false;
  window.$message?.info('已停止追踪');
};

// 加载示例
const handleLoadSample = () => {
  formData.value.className = 'com.example.service.UserService';
  formData.value.methodName = 'getUserById';
  formData.value.count = 10;
  formData.value.minTime = 100;
};

// 重置表单
const handleReset = () => {
  formData.value = {
    className: '',
    methodName: '',
    count: 10,
    minTime: null,
    includeJdk: false,
    skipConstructor: false,
    deepTrace: true
  };
};

// 导出结果
const handleExport = () => {
  console.log('导出追踪结果');
  window.$message?.info('导出功能开发中');
};

// 清空结果
const handleClear = () => {
  traceResults.value = [];
  capturedCount.value = 0;
  window.$message?.success('已清空追踪结果');
};
</script>

<template>
  <div class="trace-container">
    <!-- 追踪配置表单 -->
    <NCard class="config-card mb-6">
      <div class="config-header">
        <div class="i-carbon-activity text-20px text-blue-500" />
        <h4 class="config-title">方法追踪配置</h4>
      </div>

      <NForm :model="formData" label-placement="top">
        <NGrid :x-gap="16" :y-gap="16" :cols="2">
          <NGridItem>
            <NFormItem label="类全限定名" required>
              <NInput v-model:value="formData.className" placeholder="例如: com.example.service.UserService" />
            </NFormItem>
          </NGridItem>

          <NGridItem>
            <NFormItem label="方法名称" required>
              <NInput v-model:value="formData.methodName" placeholder="例如: getUserById" />
            </NFormItem>
          </NGridItem>

          <NGridItem>
            <NFormItem label="追踪次数" required>
              <NInputNumber
                v-model:value="formData.count"
                :min="1"
                :max="1000"
                placeholder="例如: 10"
                style="width: 100%"
              />
              <template #feedback>
                <span class="text-xs text-gray-500">捕获方法调用的次数(1-1000)</span>
              </template>
            </NFormItem>
          </NGridItem>

          <NGridItem>
            <NFormItem label="最低耗时 (ms)">
              <NInputNumber v-model:value="formData.minTime" :min="0" placeholder="例如: 100" style="width: 100%" />
              <template #feedback>
                <span class="text-xs text-gray-500">只记录耗时超过此值的调用</span>
              </template>
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <NButton v-if="!isTracing" type="primary" @click="handleStartTrace">
            <template #icon>
              <div class="i-carbon-play" />
            </template>
            开始追踪
          </NButton>
          <NButton v-else type="error" @click="handleStopTrace">
            <template #icon>
              <div class="i-carbon-stop" />
            </template>
            停止追踪
          </NButton>
          <NButton @click="handleLoadSample">
            <template #icon>
              <div class="i-carbon-document-tasks" />
            </template>
            加载示例
          </NButton>
          <NButton @click="handleReset">
            <template #icon>
              <div class="i-carbon-reset" />
            </template>
            重置
          </NButton>
        </div>
      </NForm>
    </NCard>

    <!-- 追踪状态 -->
    <NCard v-if="isTracing" class="status-card mb-6">
      <div class="status-content">
        <div class="status-info">
          <div class="status-indicator">
            <div class="status-dot" />
            <span class="status-text">追踪中...</span>
          </div>
          <div class="status-count">
            已捕获:
            <span class="count-current">{{ capturedCount }}</span>
            /
            <span class="count-total">{{ totalCount }}</span>
          </div>
        </div>
        <div class="status-progress">
          <NProgress type="line" :percentage="progress" :show-indicator="false" />
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>
    </NCard>

    <!-- 追踪结果 -->
    <NCard class="result-card">
      <template #header>
        <div class="result-header">
          <div class="result-title">
            <div class="i-carbon-tree-view text-16px text-green-500" />
            <span>调用栈列表</span>
            <span v-if="hasResults" class="result-info">
              追踪: {{ traceResults[0].node.className }}.{{ traceResults[0].node.methodName }}()
            </span>
          </div>
          <div class="result-actions">
            <NButton size="small" @click="handleExport">
              <template #icon>
                <div class="i-carbon-download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="handleClear">
              <template #icon>
                <div class="i-carbon-trash-can" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <NEmpty v-if="!hasResults" description="暂无追踪数据" class="empty-state">
        <template #icon>
          <div class="empty-icon">
            <div class="i-carbon-activity text-48px text-gray-600" />
          </div>
        </template>
        <template #extra>
          <span class="text-xs text-gray-500">请配置追踪参数并点击"开始追踪"按钮</span>
        </template>
      </NEmpty>

      <!-- 结果列表 -->
      <NDataTable
        v-else
        :columns="columns"
        :data="traceResults"
        :bordered="false"
        :single-line="false"
        :max-height="500"
        :row-class-name="(row: TraceResponse) => (row.node.isThrow ? 'trace-row-error' : '')"
        class="trace-table"
      />
    </NCard>

    <!-- 调用栈详情模态框 -->
    <NModal v-model:show="showDetailModal" preset="card" title="调用栈详情" style="width: 900px">
      <template #header-extra>
        <div class="i-carbon-branch text-20px text-blue-500" />
      </template>

      <div v-if="selectedTrace" class="detail-content">
        <!-- 追踪信息 -->
        <div class="trace-info">
          <h5 class="info-title">追踪信息</h5>
          <NGrid :x-gap="12" :y-gap="8" :cols="2">
            <NGridItem>
              <div class="info-item">
                <span class="info-label">序号:</span>
                <span class="info-value">#{{ selectedTrace.index }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="info-label">总耗时:</span>
                <span class="info-value">{{ selectedTrace.duration }}ms</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="info-label">类名:</span>
                <span class="info-value">{{ selectedTrace.className }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="info-label">方法:</span>
                <span class="info-value">{{ selectedTrace.methodName }}()</span>
              </div>
            </NGridItem>
          </NGrid>
        </div>

        <!-- 调用栈树 -->
        <div class="trace-tree">
          <h5 class="tree-title">
            <div class="i-carbon-branch text-16px text-blue-500" />
            调用栈树
          </h5>
          <div class="tree-content">
            <div v-for="(node, index) in selectedTrace.traceTree" :key="index" class="tree-node">
              <span :class="node.color" class="node-name">{{ node.name }}</span>
              <span
                :class="{
                  'text-red-400': node.time > selectedTrace.duration * 0.3,
                  'text-yellow-400':
                    node.time > selectedTrace.duration * 0.1 && node.time <= selectedTrace.duration * 0.3,
                  'text-green-400': node.time <= selectedTrace.duration * 0.1
                }"
                class="node-time"
              >
                {{ node.time }}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.config-card {
  border-radius: 12px;

  :deep(.n-card__content) {
    padding: 20px;
  }
}

.config-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.config-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color-1);
  margin: 0;
}

.advanced-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
}

.advanced-toggle {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.advanced-options {
  margin-top: 12px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
}

.status-card {
  border-radius: 12px;

  :deep(.n-card__content) {
    padding: 20px;
  }
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: rgb(34, 197, 94);
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 14px;
  color: var(--n-text-color-1);
}

.status-count {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.count-current,
.count-total {
  font-weight: 600;
  color: var(--n-text-color-1);
}

.status-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 300px;
}

.progress-text {
  font-size: 12px;
  color: var(--n-text-color-3);
  min-width: 40px;
}

.result-card {
  border-radius: 12px;

  :deep(.n-card-header) {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--n-border-color);
  }

  :deep(.n-card__content) {
    padding: 0;
  }
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.result-info {
  font-size: 12px;
  font-weight: 400;
  color: var(--n-text-color-3);
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  padding: 48px 0;
}

.empty-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.trace-table {
  :deep(.n-data-table-th) {
    font-size: 12px;
    font-weight: 500;
    background-color: var(--n-th-color);
  }

  :deep(.n-data-table-td) {
    font-size: 12px;
    font-family: 'Consolas', 'Monaco', monospace;
  }

  :deep(.n-data-table-tr:hover) {
    background-color: var(--n-td-color-hover);
  }

  // 异常行样式
  :deep(.trace-row-error) {
    background-color: rgba(239, 68, 68, 0.08);
    border-left: 3px solid rgb(239, 68, 68);

    &:hover {
      background-color: rgba(239, 68, 68, 0.12);
    }
  }
}

// 方法名样式
.method-with-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgb(239, 68, 68);
  font-weight: 600;
  cursor: help;
}

.method-error-icon {
  flex-shrink: 0;
  color: rgb(239, 68, 68);
}

.method-normal {
  color: var(--n-text-color);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trace-info {
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color-1);
  margin: 0 0 12px 0;
}

.info-item {
  font-size: 12px;
  display: flex;
  gap: 8px;
}

.info-label {
  color: var(--n-text-color-3);
}

.info-value {
  color: var(--n-text-color-1);
  font-family: 'Consolas', 'Monaco', monospace;
}

.trace-tree {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.tree-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color-1);
  margin: 0 0 12px 0;
}

.tree-content {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.8;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

.node-name {
  flex: 1;
}

.node-time {
  font-weight: 600;
}
</style>
