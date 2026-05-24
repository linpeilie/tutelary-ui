<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import InspectConfigPanel from './inspect/InspectConfigPanel.vue';
import InspectResultDetail from './inspect/InspectResultDetail.vue';
import InspectResultTable from './inspect/InspectResultTable.vue';
import { createDefaultInspectForm, type InspectFormModel, type InspectLaunchAction } from './inspect/types';
import { useInspectTask } from './inspect/useInspectTask';
import type { InspectRequest } from '@/proto/command/param/InspectRequest';
import type { InspectResponse } from '@/proto/command/result/InspectResponse';

interface Props {
  instanceId: string;
  browserSessionId: string;
  launchAction?: InspectLaunchAction | null;
}

const props = defineProps<Props>();

const formModel = ref<InspectFormModel>(createDefaultInspectForm());
const selectedResult = shallowRef<InspectResponse | null>(null);
const showDetail = shallowRef(false);
const handledLaunchActionId = shallowRef(0);

const methodCount = computed(() => normalizeMethodNames(formModel.value.methodNames).length);

const capabilityTags = computed(() => {
  const tags = [];
  if (formModel.value.includeTrace) tags.push({ label: 'Trace', type: 'info' as const });
  if (formModel.value.includeStack) tags.push({ label: 'Stack', type: 'warning' as const });
  if (formModel.value.includeReturn) tags.push({ label: 'Return', type: 'success' as const });
  return tags;
});

const statusInfo = computed(() => {
  if (inspectTask.isRunning.value) {
    return { label: '运行中', type: 'info' as const, icon: 'lucide:activity' };
  }
  if (inspectTask.isRecovering.value) {
    return { label: '恢复中', type: 'warning' as const, icon: 'lucide:rotate-cw' };
  }
  return { label: '待执行', type: 'default' as const, icon: 'lucide:circle-dot' };
});

const progressLabel = computed(() => {
  const total = inspectTask.totalExpectedCount.value;
  if (!total) return `${inspectTask.capturedCount.value}`;
  return `${inspectTask.capturedCount.value}/${total}`;
});

function normalizeMethodNames(value: string[]) {
  return Array.from(new Set(
    value
      .map(item => item.trim())
      .filter(Boolean)
  ));
}

function buildRequest(): InspectRequest | null {
  const qualifiedClassName = formModel.value.className.trim();
  const methodNames = normalizeMethodNames(formModel.value.methodNames);
  if (!qualifiedClassName) {
    window.$message?.warning('请填写类全限定名');
    return null;
  }
  if (!methodNames.length) {
    window.$message?.warning('请填写至少一个方法名');
    return null;
  }
  return {
    qualifiedClassName,
    methodNames,
    times: Math.max(formModel.value.times || 1, 1),
    cost: formModel.value.minTime || 0,
    includeTrace: formModel.value.includeTrace,
    includeStack: formModel.value.includeStack,
    includeReturn: formModel.value.includeReturn
  };
}

function applyRecoveredParam(param?: string) {
  if (!param) return undefined;
  try {
    const request = JSON.parse(param) as InspectRequest;
    formModel.value = {
      className: request.qualifiedClassName || '',
      methodNames: normalizeMethodNames(request.methodNames || []),
      times: request.times || 1,
      minTime: request.cost > 0 ? request.cost : null,
      includeTrace: Boolean(request.includeTrace),
      includeStack: Boolean(request.includeStack),
      includeReturn: Boolean(request.includeReturn)
    };
    return request;
  } catch {
    window.$message?.warning('Inspect 参数恢复失败，请检查历史任务数据');
    return undefined;
  }
}

const inspectTask = useInspectTask({
  instanceId: () => props.instanceId,
  browserSessionId: () => props.browserSessionId,
  applyRecoveredParam
});

async function handleStart() {
  const request = buildRequest();
  if (!request) return;
  await inspectTask.start(request);
}

function handleSample() {
  formModel.value = {
    className: 'com.tutelary.example.MathGame',
    methodNames: ['primeFactors'],
    times: 10,
    minTime: null,
    includeTrace: false,
    includeStack: false,
    includeReturn: false
  };
}

function handleReset() {
  formModel.value = createDefaultInspectForm();
}

function handleViewDetail(result: InspectResponse) {
  selectedResult.value = result;
  showDetail.value = true;
}

function handleLaunchAction(action?: InspectLaunchAction | null) {
  if (!action || action.id === handledLaunchActionId.value) return;
  handledLaunchActionId.value = action.id;
  if (inspectTask.isRunning.value) {
    window.$message?.warning('已有进行中的 Inspect，停止后才能检查新方法');
    return;
  }
  formModel.value = {
    ...formModel.value,
    className: action.className,
    methodNames: [action.methodName],
    times: 10,
    minTime: null
  };
  handleStart();
}

onMounted(() => {
  inspectTask.loadLatest({ notifyRecovered: true }).then(() => {
    handleLaunchAction(props.launchAction);
  });
});

watch(
  () => props.launchAction?.id,
  () => {
    handleLaunchAction(props.launchAction);
  }
);
</script>

<template>
  <div class="inspect-container">
    <NAlert v-if="inspectTask.connectionInterrupted.value" type="warning" :bordered="false" class="inspect-alert">
      页面连接已断开，恢复后会自动补拉 Inspect 结果。
    </NAlert>

    <section class="inspect-overview">
      <div class="inspect-overview-main">
        <div class="inspect-icon">
          <SvgIcon icon="lucide:scan-search" />
        </div>
        <div class="inspect-title-block">
          <div class="inspect-title-row">
            <h3 class="inspect-title">Inspect</h3>
            <NTag size="small" :type="statusInfo.type" :bordered="false" round>
              <template #icon>
                <SvgIcon :icon="statusInfo.icon" />
              </template>
              {{ statusInfo.label }}
            </NTag>
          </div>
          <div class="inspect-target">
            <span class="inspect-target-text">{{ formModel.className || '未选择类' }}</span>
            <span class="inspect-target-dot" />
            <span>{{ methodCount }} 个方法</span>
            <span v-if="formModel.minTime" class="inspect-target-dot" />
            <span v-if="formModel.minTime">≥ {{ formModel.minTime }} ms</span>
          </div>
        </div>
      </div>

      <div class="inspect-overview-side">
        <div class="inspect-feature-row">
          <NTag v-for="tag in capabilityTags" :key="tag.label" size="small" :type="tag.type" :bordered="false">
            {{ tag.label }}
          </NTag>
          <NTag v-if="!capabilityTags.length" size="small" :bordered="false">基础信息</NTag>
        </div>
        <div class="inspect-progress-mini">
          <div class="inspect-progress-text">
            <span>{{ inspectTask.isRunning.value ? `运行 ${inspectTask.elapsedLabel.value}` : '采集进度' }}</span>
            <strong>{{ progressLabel }}</strong>
          </div>
          <NProgress
            type="line"
            :percentage="inspectTask.progress.value"
            :show-indicator="false"
            :processing="inspectTask.isRunning.value"
          />
        </div>
      </div>
    </section>

    <NAlert v-if="inspectTask.hasWaitedTooLong.value" type="warning" :bordered="false" class="inspect-alert">
      已等待超过 1 分钟，目标方法可能暂未被调用或最低耗时阈值过高。
    </NAlert>

    <div class="inspect-workspace">
      <InspectConfigPanel
        v-model="formModel"
        :running="inspectTask.isRunning.value"
        @submit="handleStart"
        @cancel="inspectTask.cancel"
        @reset="handleReset"
        @sample="handleSample"
      />

      <InspectResultTable
        :results="inspectTask.results.value"
        :running="inspectTask.isRunning.value"
        :recovering="inspectTask.isRecovering.value"
        :captured-count="inspectTask.capturedCount.value"
        :total-count="inspectTask.totalExpectedCount.value"
        :progress="inspectTask.progress.value"
        @view="handleViewDetail"
        @clear="inspectTask.clearResults"
      />
    </div>

    <InspectResultDetail v-model:show="showDetail" :result="selectedResult" />
  </div>
</template>

<style scoped>
.inspect-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.inspect-alert {
  margin-bottom: -2px;
}

.inspect-overview {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(24, 160, 88, 0.08), rgba(64, 158, 255, 0.04)),
    var(--n-card-color);
}

.inspect-overview-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.inspect-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 8px;
  background: rgba(24, 160, 88, 0.12);
  color: var(--n-primary-color);
  font-size: 20px;
}

.inspect-title-block {
  min-width: 0;
}

.inspect-title-row,
.inspect-target,
.inspect-feature-row,
.inspect-progress-text {
  display: flex;
  align-items: center;
}

.inspect-title-row {
  gap: 10px;
}

.inspect-title {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  line-height: 1.3;
}

.inspect-target {
  gap: 8px;
  margin-top: 5px;
  color: var(--n-text-color-2);
  font-size: 12px;
}

.inspect-target-text {
  max-width: min(520px, 54vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.inspect-target-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--n-border-color);
}

.inspect-overview-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-width: 220px;
}

.inspect-feature-row {
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.inspect-progress-mini {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.inspect-progress-text {
  justify-content: space-between;
  gap: 16px;
  color: var(--n-text-color-2);
  font-size: 12px;
}

.inspect-progress-text strong {
  color: var(--n-text-color);
  font-weight: 650;
}

.inspect-workspace {
  display: grid;
  grid-template-columns: minmax(320px, 390px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 1100px) {
  .inspect-overview,
  .inspect-workspace {
    grid-template-columns: 1fr;
  }

  .inspect-overview {
    flex-direction: column;
  }

  .inspect-overview-side {
    min-width: 0;
  }

  .inspect-feature-row {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .inspect-overview {
    padding: 14px;
  }

  .inspect-target {
    flex-wrap: wrap;
  }

  .inspect-target-text {
    max-width: 100%;
  }
}
</style>
