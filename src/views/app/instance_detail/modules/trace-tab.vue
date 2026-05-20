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
import { recoverEnhanceTaskResults } from '@/composables/useRecoveredEnhanceTasks';
import eventbus from '@/utils/eventbus';
import { div4Round } from '@/utils/math';
import { commandEnum } from '@/enum/commandEnums';
import EnhanceTaskRecords from '@/components/custom/enhance-task-records.vue';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { TraceResponse } from '@/proto/command/result/TraceResponse';
import type { TraceNode } from '@/proto/command/domain/TraceNode';
import type { EnhanceCommandComplete } from '@/proto/command/result/EnhanceCommandComplete';
import type { TraceRequest } from '@/proto/command/param/TraceRequest';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;

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
const currentTaskId = ref('');
const taskRecordsRef = ref<InstanceType<typeof EnhanceTaskRecords> | null>(null);
const progress = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((capturedCount.value / totalCount.value) * 100);
});

// 追踪结果
const traceResults = ref<TraceResponse[]>([]);
const hasResults = computed(() => traceResults.value.length > 0);

// 详情模态框
const showDetailModal = ref(false);
const selectedTrace = ref<TraceResponse | null>(null);

// 获取耗时标签类型
const getDurationTagType = (duration: number) => {
  if (duration > 200) return 'error';
  if (duration > 100) return 'warning';
  return 'success';
};

// 查看详情
const handleViewDetail = (trace: TraceResponse) => {
  selectedTrace.value = trace;
  showDetailModal.value = true;
};

// 递归渲染调用栈树为缩进列表
function flattenTraceTree(node: TraceNode, depth: number = 0): Array<{ node: TraceNode; depth: number }> {
  const result: Array<{ node: TraceNode; depth: number }> = [{ node, depth }];
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTraceTree(child, depth + 1));
    }
  }
  return result;
}

// 获取树节点的耗时颜色
function getNodeCostClass(nodeCost: number, rootCost: number): string {
  if (rootCost === 0) return 'text-green-400';
  const ratio = nodeCost / rootCost;
  if (ratio > 0.3) return 'text-red-400';
  if (ratio > 0.1) return 'text-yellow-400';
  return 'text-green-400';
}

// 表格列配置
const columns: DataTableColumns<TraceResponse> = [
  {
    title: '#',
    key: 'index',
    width: 60,
    render: (_row: TraceResponse, rowIndex: number) => `${rowIndex + 1}`
  },
  {
    title: '方法',
    key: 'method',
    width: 200,
    render: (row: TraceResponse) => {
      if (row.node.isThrow) {
        return h('div', [
          h('span', row.node.methodName),
          h(
            'span',
            {
              class: 'text-red-600/[.40] font-semibold'
            },
            ' Throw ex'
          )
        ]);
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
    render: (row: TraceResponse) => {
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

// 处理 trace 结果
function handleTraceResult(data: CommandExecuteResponse<TraceResponse>) {
  if (data.data) {
    const traceResponse = data.data as TraceResponse;
    traceResults.value.push(traceResponse);
    capturedCount.value = traceResponse.currentTimes || traceResults.value.length;

    // 实时更新 running tasks 中的 currentTimes
    if (data.taskId) {
      taskRecordsRef.value?.updateRunningTaskTimes(data.taskId, traceResponse.currentTimes || capturedCount.value);
    }
  }
}

// 处理增强完成回调
function handleEnhanceComplete(data: CommandExecuteResponse<EnhanceCommandComplete>) {
  if (!isTracing.value) return;
  const complete = data.data as EnhanceCommandComplete | undefined;
  if (!complete) return;

  // 匹配 trace 命令码，或匹配当前任务ID
  const isTraceComplete =
    complete.code === (commandEnum.TRACE_METHOD.value as number) ||
    (currentTaskId.value && data.taskId === currentTaskId.value);

  if (isTraceComplete) {
    isTracing.value = false;
    window.$message?.success(`追踪完成! 已捕获 ${capturedCount.value} 条调用记录`);
    taskRecordsRef.value?.refresh();
  }
}

onMounted(() => {
  eventbus.on('command:trace', handleTraceResult);
  eventbus.on('command:enhance-complete', handleEnhanceComplete);
  recoverEnhanceTaskResults<TraceResponse>(
    props.instanceId,
    commandEnum.TRACE_METHOD.value as number,
    handleTraceResult
  );
});

onUnmounted(() => {
  eventbus.off('command:trace', handleTraceResult);
  eventbus.off('command:enhance-complete', handleEnhanceComplete);
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

  const { data: taskResponse, error } = await fetchTraceCommand(params);
  if (error) {
    isTracing.value = false;
    return;
  }
  if (taskResponse) {
    currentTaskId.value = taskResponse.taskId || '';
  }
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
    <NCard class="id-card mb-6">
      <h4 class="id-card-title-lg">
        <SvgIcon icon="lucide:git-branch" class="text-20px text-primary" />
        方法追踪配置
      </h4>

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
        <div class="id-action-buttons">
          <NButton v-if="!isTracing" type="primary" @click="handleStartTrace">
            <template #icon>
              <SvgIcon icon="lucide:play" />
            </template>
            开始追踪
          </NButton>
          <NButton v-else type="error" @click="handleStopTrace">
            <template #icon>
              <SvgIcon icon="lucide:square" />
            </template>
            停止追踪
          </NButton>
          <NButton @click="handleLoadSample">
            <template #icon>
              <SvgIcon icon="lucide:file-text" />
            </template>
            加载示例
          </NButton>
          <NButton @click="handleReset">
            <template #icon>
              <SvgIcon icon="lucide:rotate-ccw" />
            </template>
            重置
          </NButton>
        </div>
      </NForm>
    </NCard>

    <!-- Trace 任务记录 -->
    <EnhanceTaskRecords
      ref="taskRecordsRef"
      :instance-id="props.instanceId"
      :command-code="commandEnum.TRACE_METHOD.value as number"
      running-label="进行中的追踪"
      recent-label="最近完成"
    />

    <!-- 追踪状态 -->
    <NCard v-if="isTracing" class="id-card mb-6">
      <div class="flex items-center justify-between gap-20px">
        <div class="flex items-center gap-16px">
          <div class="id-status-indicator">
            <div class="id-status-dot bg-success" />
            <span class="text-14px">追踪中...</span>
          </div>
          <div class="text-12px text-gray">
            已捕获:
            <span class="font-600">{{ capturedCount }}</span>
            /
            <span class="font-600">{{ totalCount }}</span>
          </div>
        </div>
        <div class="max-w-300px flex flex-1 items-center gap-12px">
          <NProgress type="line" :percentage="progress" :show-indicator="false" />
          <span class="min-w-40px text-12px text-gray">{{ progress }}%</span>
        </div>
      </div>
    </NCard>

    <!-- 追踪结果 -->
    <NCard class="id-table-card">
      <template #header>
        <div class="id-table-header">
          <div class="id-table-title">
            <SvgIcon icon="lucide:list-tree" class="text-16px text-success" />
            <span>调用栈列表</span>
            <span v-if="hasResults" class="text-12px text-gray font-normal">
              追踪: {{ traceResults[0].node.className }}.{{ traceResults[0].node.methodName }}()
            </span>
          </div>
          <div class="id-table-actions">
            <NButton size="small" @click="handleExport">
              <template #icon>
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="handleClear">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <NEmpty v-if="!hasResults" description="暂无追踪数据" class="id-empty-state">
        <template #icon>
          <div class="id-empty-icon">
            <SvgIcon icon="lucide:git-branch" class="text-48px text-gray-600" />
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
        class="id-mono-table"
      />
    </NCard>

    <!-- 调用栈详情模态框 -->
    <NModal v-model:show="showDetailModal" preset="card" title="调用栈详情" style="width: 900px">
      <template #header-extra>
        <div class="i-carbon-branch text-20px text-blue-500" />
      </template>

      <div v-if="selectedTrace" class="detail-content">
        <!-- 追踪信息 -->
        <div class="id-detail-section">
          <h5 class="id-detail-section-title">追踪信息</h5>
          <NGrid :x-gap="12" :y-gap="8" :cols="2">
            <NGridItem>
              <div class="info-item">
                <span class="id-detail-label">调用时间:</span>
                <span class="id-detail-value font-mono">{{ selectedTrace.finishTime }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="id-detail-label">总耗时:</span>
                <NTag
                  :type="getDurationTagType(div4Round(selectedTrace.node.totalCost, 1000000, 0))"
                  size="small"
                  :bordered="false"
                >
                  {{ div4Round(selectedTrace.node.totalCost, 1000000, 0) }}ms
                </NTag>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="id-detail-label">类名:</span>
                <span class="id-detail-value font-mono">{{ selectedTrace.node.className }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="info-item">
                <span class="id-detail-label">方法:</span>
                <span class="id-detail-value font-mono">{{ selectedTrace.node.methodName }}()</span>
              </div>
            </NGridItem>
            <NGridItem v-if="selectedTrace.thread">
              <div class="info-item">
                <span class="id-detail-label">线程:</span>
                <span class="id-detail-value font-mono">
                  {{ selectedTrace.thread.name }} (id={{ selectedTrace.thread.id }})
                </span>
              </div>
            </NGridItem>
            <NGridItem v-if="selectedTrace.node.isThrow">
              <div class="info-item">
                <span class="id-detail-label">异常:</span>
                <NTag type="error" size="small" :bordered="false">抛出异常</NTag>
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
            <div
              v-for="(item, index) in flattenTraceTree(selectedTrace.node)"
              :key="index"
              class="tree-node"
              :style="{ paddingLeft: `${item.depth * 20 + 8}px` }"
            >
              <span class="node-name" :class="{ 'text-red-400': item.node.isThrow }">
                <span v-if="item.depth > 0" class="text-gray-500">{{ '└─ '.repeat(1) }}</span>
                {{ item.node.className }}.{{ item.node.methodName }}()
                <span v-if="item.node.line > 0" class="text-11px text-gray-500">:{{ item.node.line }}</span>
              </span>
              <span :class="getNodeCostClass(item.node.totalCost, selectedTrace.node.totalCost)" class="node-time">
                {{ div4Round(item.node.totalCost, 1000000, 2) }}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style lang="scss">
.trace-container {
  padding: 0;
}

// 异常行样式
.id-mono-table {
  :deep(.trace-row-error) {
    background-color: rgba(239, 68, 68, 0.08);
    border-left: 3px solid rgb(239, 68, 68);

    &:hover {
      background-color: rgba(239, 68, 68, 0.12);
    }
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  color: var(--n-text-color);
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
    background-color: var(--n-color-target);
  }
}

.node-name {
  flex: 1;
}

.node-time {
  font-weight: 600;
}
</style>
