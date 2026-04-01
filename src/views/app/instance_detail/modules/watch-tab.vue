<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  NButton,
  NCard,
  NCheckbox,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NProgress,
  NTag,
  useMessage
} from 'naive-ui';
import { fetchWatchCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import { commandEnum } from '@/enum/commandEnums';
import EnhanceTaskRecords from '@/components/custom/enhance-task-records.vue';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { WatchResponse } from '@/proto/command/result/WatchResponse';

interface WatchResult {
  id: number;
  className: string;
  methodName: string;
  params: string;
  target: string;
  returnValue: string;
  exception: string;
  cost: number;
  finishTime: string;
  expanded: boolean;
}

defineOptions({
  name: 'WatchTab'
});

interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

const message = useMessage();

const watchFormRef = ref();
const isWatching = ref(false);

// 配置
const watchConfig = ref({
  qualifiedClassName: '',
  methodNames: '',
  times: 50,
  cost: 0,
  includeParams: true,
  includeReturn: true,
  includeException: true
});

const watchResults = ref<WatchResult[]>([]);
let resultIdCounter = 1;

const resultInfo = computed(() => {
  if (watchResults.value.length === 0) return '';
  const classes = new Set(watchResults.value.map(r => r.className));
  const methods = new Set(watchResults.value.map(r => `${r.className}.${r.methodName}`));
  return `共 ${watchResults.value.length} 条记录,来自 ${classes.size} 个类的 ${methods.size} 个方法`;
});

const watchProgress = computed(() => {
  if (watchConfig.value.times <= 0) return 0;
  return Math.min(Math.round((watchResults.value.length / watchConfig.value.times) * 100), 100);
});

// 开始观察
function startWatch() {
  if (!watchConfig.value.qualifiedClassName.trim()) {
    message.warning('请填写类名');
    return;
  }
  if (!watchConfig.value.methodNames.trim()) {
    message.warning('请填写方法名');
    return;
  }

  const methodNameList = watchConfig.value.methodNames
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(s => s);

  isWatching.value = true;
  watchResults.value = [];
  resultIdCounter = 1;

  fetchWatchCommand({
    instanceId: props.instanceId,
    param: {
      qualifiedClassName: watchConfig.value.qualifiedClassName,
      methodNames: methodNameList,
      times: watchConfig.value.times,
      cost: watchConfig.value.cost,
      includeParams: watchConfig.value.includeParams,
      includeReturn: watchConfig.value.includeReturn,
      includeException: watchConfig.value.includeException
    }
  }).catch(() => {
    isWatching.value = false;
  });
}

// 停止观察
function stopWatch() {
  isWatching.value = false;
  message.success(`观察已停止,共捕获 ${watchResults.value.length} 条记录`);
}

// eventBus 回调
function handleWatchResult(response: CommandExecuteResponse<WatchResponse>) {
  const data = response.data as WatchResponse | undefined;
  if (!data || data.state === 0) {
    if (data?.message) message.error(data.message);
    isWatching.value = false;
    return;
  }

  const result: WatchResult = {
    id: resultIdCounter,
    className: data.className,
    methodName: data.methodName,
    params: data.params,
    target: data.target,
    returnValue: data.returnValue,
    exception: data.exception,
    cost: data.cost,
    finishTime: data.finishTime,
    expanded: false
  };

  resultIdCounter += 1;
  watchResults.value.push(result);

  // 达到次数上限自动停止
  if (watchConfig.value.times > 0 && watchResults.value.length >= watchConfig.value.times) {
    isWatching.value = false;
    message.success(`观察完成,共捕获 ${watchResults.value.length} 条记录`);
  }
}

onMounted(() => {
  eventBus.on('command:watch', handleWatchResult);
});

onUnmounted(() => {
  eventBus.off('command:watch', handleWatchResult);
});

// 获取耗时标签类型
function getDurationTagType(duration: number): 'success' | 'warning' | 'error' {
  if (duration > 500) return 'error';
  if (duration > 200) return 'warning';
  return 'success';
}

// 加载示例
function loadSample() {
  watchConfig.value.qualifiedClassName = 'com.example.service.UserService';
  watchConfig.value.methodNames = 'getUserById\ncreateUser\nupdateUser';
  watchConfig.value.times = 30;
  watchConfig.value.cost = 0;
  watchConfig.value.includeParams = true;
  watchConfig.value.includeReturn = true;
  watchConfig.value.includeException = true;
  message.success('已加载示例配置');
}

// 重置表单
function resetForm() {
  watchConfig.value = {
    qualifiedClassName: '',
    methodNames: '',
    times: 50,
    cost: 0,
    includeParams: true,
    includeReturn: true,
    includeException: true
  };
  message.success('已重置表单');
}

// 导出结果
function exportResults() {
  if (watchResults.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  const blob = new Blob([JSON.stringify(watchResults.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'watch-results.json';
  a.click();
  URL.revokeObjectURL(url);
  message.success('导出成功');
}

// 清空结果
function clearResults() {
  watchResults.value = [];
  resultIdCounter = 1;
  message.success('已清空结果');
}
</script>

<template>
  <div class="flex flex-col gap-16px">
    <!-- Watch 配置表单 -->
    <NCard size="small" class="id-card">
      <template #header>
        <div class="flex-y-center gap-8px">
          <SvgIcon icon="lucide:eye" class="text-18px" />
          <span class="font-semibold">方法观察配置</span>
        </div>
      </template>

      <NForm ref="watchFormRef" :model="watchConfig" label-placement="top">
        <NGrid :cols="24" :x-gap="16" :y-gap="16">
          <!-- 类名 -->
          <NGridItem :span="24">
            <NFormItem path="qualifiedClassName">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:package" class="text-14px" />
                  <span>类名</span>
                  <span class="text-12px text-gray-400">(完整类名)</span>
                </div>
              </template>
              <NInput
                v-model:value="watchConfig.qualifiedClassName"
                placeholder="例如: com.example.service.UserService"
                class="font-mono"
                :disabled="isWatching"
              />
            </NFormItem>
          </NGridItem>

          <!-- 方法名列表 -->
          <NGridItem :span="24">
            <NFormItem path="methodNames">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:list" class="text-14px" />
                  <span>方法名列表</span>
                  <span class="text-12px text-gray-400">(支持多行,每行一个方法名)</span>
                </div>
              </template>
              <NInput
                v-model:value="watchConfig.methodNames"
                type="textarea"
                :rows="4"
                placeholder="例如:&#10;getUserById&#10;createUser&#10;updateUser"
                class="font-mono"
                :disabled="isWatching"
              />
            </NFormItem>
          </NGridItem>

          <!-- 观察次数 -->
          <NGridItem :span="8">
            <NFormItem label="观察次数" path="times">
              <NInputNumber
                v-model:value="watchConfig.times"
                :min="1"
                :max="10000"
                placeholder="例如: 50"
                class="w-full"
                :disabled="isWatching"
              >
                <template #suffix>
                  <span class="text-12px text-gray-400">次</span>
                </template>
              </NInputNumber>
            </NFormItem>
          </NGridItem>

          <!-- 最低耗时过滤 -->
          <NGridItem :span="8">
            <NFormItem path="cost">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:timer" class="text-14px" />
                  <span>最低耗时 (ms)</span>
                </div>
              </template>
              <NInputNumber
                v-model:value="watchConfig.cost"
                :min="0"
                placeholder="例如: 50"
                class="w-full"
                :disabled="isWatching"
              >
                <template #suffix>
                  <span class="text-12px text-gray-400">ms</span>
                </template>
              </NInputNumber>
            </NFormItem>
          </NGridItem>

          <!-- 选项 -->
          <NGridItem :span="8">
            <NFormItem label="观察选项">
              <div class="flex flex-col gap-8px">
                <NCheckbox v-model:checked="watchConfig.includeParams" :disabled="isWatching">包含入参</NCheckbox>
                <NCheckbox v-model:checked="watchConfig.includeReturn" :disabled="isWatching">包含返回值</NCheckbox>
                <NCheckbox v-model:checked="watchConfig.includeException" :disabled="isWatching">包含异常</NCheckbox>
              </div>
            </NFormItem>
          </NGridItem>

          <!-- 操作按钮 -->
          <NGridItem :span="24">
            <div class="flex-y-center gap-12px">
              <NButton v-if="!isWatching" type="primary" @click="startWatch">
                <template #icon>
                  <SvgIcon icon="lucide:play" />
                </template>
                开始观察
              </NButton>
              <NButton v-if="isWatching" type="error" @click="stopWatch">
                <template #icon>
                  <SvgIcon icon="lucide:square" />
                </template>
                停止观察
              </NButton>
              <NButton :disabled="isWatching" @click="loadSample">
                <template #icon>
                  <SvgIcon icon="lucide:file-text" />
                </template>
                加载示例
              </NButton>
              <NButton :disabled="isWatching" @click="resetForm">
                <template #icon>
                  <SvgIcon icon="lucide:refresh-cw" />
                </template>
                重置表单
              </NButton>
            </div>
          </NGridItem>
        </NGrid>
      </NForm>
    </NCard>

    <!-- Watch 任务记录 -->
    <EnhanceTaskRecords
      :instance-id="props.instanceId"
      :command-code="commandEnum.WATCH_METHOD.value as number"
      running-label="进行中的观察"
      recent-label="最近完成"
    />

    <!-- 观察状态 -->
    <NCard v-show="isWatching" size="small" class="id-card">
      <div class="mb-12px flex-y-center justify-between">
        <div class="flex-y-center gap-16px">
          <div class="id-status-indicator">
            <div class="id-status-dot bg-primary"></div>
            <span class="text-14px">观察中...</span>
          </div>
          <div class="text-14px text-gray">
            已捕获:
            <span class="text-primary font-semibold">{{ watchResults.length }}</span>
            /
            <span>{{ watchConfig.times }}</span>
          </div>
        </div>
      </div>
      <NProgress type="line" :percentage="watchProgress" status="success" :show-indicator="false" />
    </NCard>

    <!-- 观察结果 -->
    <NCard size="small" class="id-card">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:list" class="text-16px" />
            <span class="font-semibold">观察结果</span>
            <span v-if="resultInfo" class="text-12px text-gray">{{ resultInfo }}</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NButton size="small" @click="exportResults">
              <template #icon>
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="clearResults">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="watchResults.length === 0" class="py-48px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
        </div>
        <div class="text-14px">暂无观察结果</div>
        <div class="mt-4px text-12px text-gray">填写配置并点击"开始观察"</div>
      </div>

      <div v-else class="flex flex-col gap-12px">
        <div
          v-for="result in watchResults"
          :key="result.id"
          class="overflow-hidden border border-container rounded-8px bg-container"
        >
          <!-- 标题栏 -->
          <div class="flex-y-center justify-between border-b border-container p-16px">
            <div class="flex-y-center gap-12px">
              <NTag size="small" :bordered="false">
                <span class="font-mono">#{{ result.id }}</span>
              </NTag>
              <div class="text-14px font-mono">
                <span class="text-primary">{{ result.className }}</span>
                <span class="text-gray">.</span>
                <span class="text-success">{{ result.methodName }}</span>
                <span class="text-gray">()</span>
              </div>
            </div>
            <div class="flex-y-center gap-16px text-12px">
              <div class="flex-y-center gap-6px">
                <SvgIcon icon="lucide:clock" class="text-12px text-gray" />
                <span class="text-gray">{{ result.finishTime }}</span>
              </div>
              <div class="flex-y-center gap-6px">
                <SvgIcon icon="lucide:zap" class="text-12px" />
                <NTag :type="getDurationTagType(result.cost)" size="small" :bordered="false">{{ result.cost }}ms</NTag>
              </div>
              <div v-if="result.exception" class="flex-y-center gap-4px">
                <SvgIcon icon="lucide:alert-circle" class="text-12px text-error" />
                <span class="text-12px text-error">异常</span>
              </div>
              <div
                class="flex-y-center cursor-pointer text-gray transition hover:text-primary"
                @click="result.expanded = !result.expanded"
              >
                <SvgIcon :icon="result.expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="text-16px" />
              </div>
            </div>
          </div>

          <!-- 详细内容 -->
          <div v-show="result.expanded" class="flex flex-col gap-16px p-16px">
            <!-- 入参 -->
            <div v-if="result.params">
              <div class="mb-8px flex-y-center gap-6px text-12px text-gray font-semibold">
                <SvgIcon icon="lucide:arrow-right" class="text-12px" />
                入参 (Parameters)
              </div>
              <div class="border border-container rounded-8px bg-layout p-12px">
                <pre class="text-12px font-mono">{{ result.params }}</pre>
              </div>
            </div>

            <!-- Target 对象 -->
            <div v-if="result.target">
              <div class="mb-8px flex-y-center gap-6px text-12px text-gray font-semibold">
                <SvgIcon icon="lucide:target" class="text-12px" />
                Target 对象
              </div>
              <div class="border border-container rounded-8px bg-layout p-12px">
                <pre class="text-12px font-mono">{{ result.target }}</pre>
              </div>
            </div>

            <!-- 异常信息 -->
            <div v-if="result.exception">
              <div class="mb-8px flex-y-center gap-6px text-12px text-error font-semibold">
                <SvgIcon icon="lucide:alert-circle" class="text-12px" />
                异常 (Exception)
              </div>
              <div class="border border-error rounded-8px bg-error/10 p-12px">
                <pre class="max-h-200px overflow-y-auto text-12px text-error font-mono">{{ result.exception }}</pre>
              </div>
            </div>

            <!-- 返回值 -->
            <div v-if="result.returnValue && !result.exception">
              <div class="mb-8px flex-y-center gap-6px text-12px text-gray font-semibold">
                <SvgIcon icon="lucide:arrow-left" class="text-12px" />
                返回值 (Return Value)
              </div>
              <div class="border border-container rounded-8px bg-layout p-12px">
                <pre class="text-12px font-mono">{{ result.returnValue }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
