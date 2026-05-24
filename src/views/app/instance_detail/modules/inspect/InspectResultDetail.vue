<script setup lang="ts">
import { computed } from 'vue';
import type { InspectResponse } from '@/proto/command/result/InspectResponse';
import type { TraceNode } from '@/proto/command/domain/TraceNode';

interface Props {
  result: InspectResponse | null;
}

const props = defineProps<Props>();
const show = defineModel<boolean>('show', { required: true });

function formatCost(cost?: number) {
  if (!cost) return '0 ms';
  return `${(cost / 1_000_000).toFixed(2)} ms`;
}

function flattenTraceTree(node: TraceNode, depth = 0): Array<{ node: TraceNode; depth: number }> {
  const rows = [{ node, depth }];
  for (const child of node.children || []) {
    rows.push(...flattenTraceTree(child, depth + 1));
  }
  return rows;
}

const traceRows = computed(() => {
  if (!props.result?.traceNode) return [];
  return flattenTraceTree(props.result.traceNode);
});
</script>

<template>
  <NModal v-model:show="show" preset="card" title="Inspect 详情" class="inspect-detail-modal">
    <div v-if="result" class="inspect-detail">
      <div class="inspect-detail-summary">
        <div class="inspect-detail-summary-main">
          <span class="inspect-detail-class">{{ result.className }}</span>
          <strong>{{ result.methodName }}()</strong>
        </div>
        <div class="inspect-detail-metrics">
          <div class="inspect-detail-metric">
            <span>耗时</span>
            <strong>{{ formatCost(result.cost) }}</strong>
          </div>
          <div class="inspect-detail-metric">
            <span>线程</span>
            <strong>{{ result.thread?.name || '-' }}</strong>
          </div>
          <div class="inspect-detail-metric">
            <span>状态</span>
            <strong>{{ result.exception ? '异常' : '正常' }}</strong>
          </div>
        </div>
      </div>

      <NDescriptions :column="2" bordered size="small" class="inspect-descriptions">
        <NDescriptionsItem label="执行时间">{{ result.finishTime || '-' }}</NDescriptionsItem>
        <NDescriptionsItem label="线程状态">{{ result.thread?.state || '-' }}</NDescriptionsItem>
        <NDescriptionsItem label="TCCL" :span="2">{{ result.tccl || '-' }}</NDescriptionsItem>
      </NDescriptions>

      <div class="inspect-detail-block">
        <div class="inspect-detail-title">参数</div>
        <pre class="inspect-code">{{ result.params || '[]' }}</pre>
      </div>

      <div v-if="result.returnValue" class="inspect-detail-block">
        <div class="inspect-detail-title">返回值</div>
        <pre class="inspect-code">{{ result.returnValue }}</pre>
      </div>

      <div v-if="result.exception" class="inspect-detail-block">
        <div class="inspect-detail-title inspect-detail-title--error">异常</div>
        <pre class="inspect-code inspect-code--error">{{ result.exception }}</pre>
      </div>

      <div v-if="traceRows.length" class="inspect-detail-block">
        <div class="inspect-detail-title">Trace</div>
        <div class="inspect-trace-list">
          <div
            v-for="item in traceRows"
            :key="`${item.depth}-${item.node.className}-${item.node.methodName}-${item.node.line}`"
            class="inspect-trace-row"
            :style="{ paddingLeft: `${item.depth * 16}px` }"
          >
            <span class="inspect-trace-method">{{ item.node.className }}.{{ item.node.methodName }}</span>
            <span class="inspect-trace-cost">{{ formatCost(item.node.totalCost) }}</span>
            <NTag v-if="item.node.throwEx" type="error" size="tiny" :bordered="false">异常</NTag>
          </div>
        </div>
      </div>

      <div v-if="result.stackTraceNodeList?.length" class="inspect-detail-block">
        <div class="inspect-detail-title">Stack</div>
        <div class="inspect-stack-list">
          <div v-for="(node, index) in result.stackTraceNodeList" :key="index" class="inspect-stack-row">
            <span class="inspect-stack-no">{{ index + 1 }}</span>
            <span>{{ node.declaringClass }}.{{ node.methodName }}:{{ node.lineNumber }}</span>
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.inspect-detail-modal {
  width: min(920px, 92vw);
}

.inspect-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.inspect-detail-summary {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: rgba(24, 160, 88, 0.06);
}

.inspect-detail-summary-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.inspect-detail-summary-main strong {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 16px;
}

.inspect-detail-class {
  overflow: hidden;
  color: var(--n-text-color-2);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspect-detail-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(92px, 1fr));
  gap: 8px;
  min-width: 360px;
}

.inspect-detail-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  background: var(--n-card-color);
}

.inspect-detail-metric span {
  color: var(--n-text-color-2);
  font-size: 12px;
}

.inspect-detail-metric strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspect-detail-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inspect-detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
}

.inspect-detail-title--error {
  color: var(--n-error-color);
}

.inspect-code {
  max-height: 240px;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--n-code-color);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.inspect-code--error {
  color: var(--n-error-color);
}

.inspect-trace-list,
.inspect-stack-list {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
}

.inspect-trace-row,
.inspect-stack-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--n-border-color);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
}

.inspect-trace-row:last-child,
.inspect-stack-row:last-child {
  border-bottom: none;
}

.inspect-trace-method {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspect-trace-cost {
  color: var(--n-text-color-2);
}

.inspect-stack-no {
  width: 32px;
  flex: 0 0 auto;
  color: var(--n-text-color-3);
}

@media (max-width: 720px) {
  .inspect-detail-summary {
    flex-direction: column;
  }

  .inspect-detail-metrics {
    min-width: 0;
    grid-template-columns: 1fr;
  }
}
</style>
