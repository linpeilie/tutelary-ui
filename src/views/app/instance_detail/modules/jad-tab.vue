<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
// 引入组件
import { Codemirror } from 'vue-codemirror';
// 引入JavaScript语言支持
import { java } from '@codemirror/lang-java';
// 引入One Dark主题
import { oneDark } from '@codemirror/theme-one-dark';
// CodeMirror merge/diff extension
import { MergeView } from '@codemirror/merge';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  fetchDecompileCommand,
  fetchRetransformCommand,
  fetchRetransformDetailCommand,
  fetchRetransformHistoryCommand,
  fetchRetransformRevertCommand
} from '@/service/api/instance';
import eventbus from '@/utils/eventbus';
import type { DecompileResponse } from '@/proto/command/result/DecompileResponse';
import type { RetransformHistoryResponse } from '@/proto/command/result/RetransformHistoryResponse';
import type { RetransformDetailResponse } from '@/proto/command/result/RetransformDetailResponse';
import type { RetransformRevertResponse } from '@/proto/command/result/RetransformRevertResponse';
import type { RetransformResponse } from '@/proto/command/result/RetransformResponse';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';

interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

// 表单数据
const formData = ref({
  className: '',
  methodName: ''
});

// 高级选项
const advancedOptions = ref({
  showLineNumbers: false,
  showComments: true,
  beautifyCode: true
});

const showAdvanced = ref(false);

// 反编译结果相关
const decompileResult = ref('');

const decompileClassName = ref('');
const decompileMethod = ref('');

const isLoading = ref(false);
const hasResult = ref(false);

const isEditMode = ref(false);

const hasUnsavedChanges = ref(false);

const originalCode = ref('');

const isHotSwapping = ref(false);
const isHistoryLoading = ref(false);

// 反编译历史
interface HistoryItem {
  className: string;
  methodName?: string;
  time: string;
}

const decompileHistory = ref<HistoryItem[]>([]);

// 热更新历史
interface HotswapRecord {
  className: string;
  updateTime: number;
  time: string;
}

const hotswapHistory = ref<HotswapRecord[]>([]);

// 执行反编译
function performDecompile() {
  if (!formData.value.className) {
    window.$message?.warning('请输入类全限定名');
    return;
  }

  isLoading.value = true;
  hasResult.value = false;

  const params = {
    instanceId: props.instanceId,
    param: {
      qualifiedClassName: formData.value.className,
      methodName: formData.value.methodName
    }
  };
  fetchDecompileCommand(params).catch(() => {
    isLoading.value = false;
  });
}

// 重置表单
function resetForm() {
  formData.value.className = '';
  formData.value.methodName = '';
  advancedOptions.value = {
    showLineNumbers: false,
    showComments: true,
    beautifyCode: true
  };
}

// 添加到历史记录
function addToHistory(className: string, methodName?: string) {
  const newItem: HistoryItem = {
    className,
    methodName,
    time: '刚刚'
  };

  // 避免重复
  const exists = decompileHistory.value.some(item => item.className === className && item.methodName === methodName);

  if (!exists) {
    decompileHistory.value.unshift(newItem);
    if (decompileHistory.value.length > 10) {
      decompileHistory.value.pop();
    }
  }
}

// 清空历史记录
function clearHistory() {
  window.$dialog?.warning({
    title: '确认操作',
    content: '确定要清空反编译历史记录吗?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      decompileHistory.value = [];
      window.$message?.success('历史记录已清空');
    }
  });
}

// 从历史记录加载
function loadFromHistory(item: HistoryItem) {
  formData.value.className = item.className;
  formData.value.methodName = item.methodName || '';
  performDecompile();
}

// 切换编辑模式
function toggleEditMode() {
  isEditMode.value = !isEditMode.value;
  if (isEditMode.value) {
    originalCode.value = decompileResult.value;
  }
}

// 保存代码更改
function saveCodeChanges() {
  if (!decompileResult.value) {
    window.$message?.warning('代码内容为空');
    return;
  }

  hasUnsavedChanges.value = false;
  isEditMode.value = false;
  window.$message?.success('代码已保存,可以进行热更新');
}

// 取消编辑
function cancelEdit() {
  if (hasUnsavedChanges.value) {
    window.$dialog?.warning({
      title: '确认操作',
      content: '有未保存的更改,确定要取消编辑吗?',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        isEditMode.value = false;
        hasUnsavedChanges.value = false;

        decompileResult.value = originalCode.value;
      }
    });
  } else {
    isEditMode.value = false;
  }
}

// 编辑器内容变化
function onCodeChange(value: string) {
  decompileResult.value = value;
  if (isEditMode.value) {
    hasUnsavedChanges.value = value !== originalCode.value;
  }
}

// 执行热更新
function performHotSwap() {
  if (!decompileClassName.value) {
    window.$message?.warning('没有可热更新的类');
    return;
  }

  window.$dialog?.warning({
    title: '确认热更新',
    content: '确定要将修改后的代码热更新到运行中的JVM吗?\n\n注意:热更新可能会影响应用运行,请谨慎操作。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      isHotSwapping.value = true;

      fetchRetransformCommand({
        instanceId: props.instanceId,
        param: {
          qualifiedClassName: decompileClassName.value,
          javaSource: decompileResult.value
        }
      }).catch(() => {
        isHotSwapping.value = false;
        window.$message?.error('请求发送失败');
      });
    }
  });
}

function formatHistoryTime(updateTime: number) {
  return new Date(updateTime).toLocaleString('zh-CN');
}

function loadRetransformHistory() {
  isHistoryLoading.value = true;
  fetchRetransformHistoryCommand({
    instanceId: props.instanceId,
    param: {}
  }).catch(() => {
    isHistoryLoading.value = false;
    window.$message?.error('获取热更新历史失败');
  });
}

// 复制代码
function copyCode() {
  navigator.clipboard.writeText(decompileResult.value).then(() => {
    window.$message?.success('代码已复制到剪贴板');
  });
}

// 下载代码
function downloadCode() {
  const blob = new Blob([decompileResult.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${decompileClassName.value.split('.').pop()}.java`;
  a.click();
  URL.revokeObjectURL(url);
  window.$message?.success('代码已下载');
}

// 处理反编译结果
function handleDecompileResult(data: any) {
  const decompile = data.data as DecompileResponse;
  let source = decompile.source;
  if (source === 'null') {
    source = '';
  }

  decompileResult.value = source;
  originalCode.value = source;

  decompileClassName.value = decompile.qualifiedClassName;
  decompileMethod.value = decompile.methodName;

  isLoading.value = false;
  hasResult.value = true;

  addToHistory(formData.value.className, formData.value.methodName);
}

function handleRetransformHistoryResult(response: CommandExecuteResponse<RetransformHistoryResponse>) {
  isHistoryLoading.value = false;
  const data = response.data as RetransformHistoryResponse | undefined;

  if (!data || data.state === 0) {
    window.$message?.error(data?.message || '获取热更新历史失败');
    return;
  }

  hotswapHistory.value = (data.records || []).map(record => ({
    className: record.qualifiedClassName,
    updateTime: record.updateTime,
    time: formatHistoryTime(record.updateTime)
  }));
}

// 处理热更新结果
function handleRetransformResult(response: CommandExecuteResponse<RetransformResponse>) {
  isHotSwapping.value = false;
  const data = response.data as RetransformResponse | undefined;

  if (data && data.state !== 0) {
    originalCode.value = decompileResult.value;
    hasUnsavedChanges.value = false;
    loadRetransformHistory();
    window.$message?.success('热更新成功');
  } else {
    const errorMsg = data?.message || '热更新失败';
    window.$message?.error(errorMsg);
  }
}

// Diff 查看相关
const showDiffModal = ref(false);
const isDiffLoading = ref(false);
const diffClassName = ref('');
const diffContainerRef = ref<HTMLElement | null>(null);
let mergeViewInstance: MergeView | null = null;

function viewDiff(className: string) {
  diffClassName.value = className;
  isDiffLoading.value = true;
  showDiffModal.value = true;

  fetchRetransformDetailCommand({
    instanceId: props.instanceId,
    param: { qualifiedClassName: className }
  }).catch(() => {
    isDiffLoading.value = false;
    window.$message?.error('获取热更新详情失败');
  });
}

function handleRetransformDetailResult(response: CommandExecuteResponse<RetransformDetailResponse>) {
  isDiffLoading.value = false;
  const data = response.data as RetransformDetailResponse | undefined;

  if (!data || data.state === 0) {
    window.$message?.error(data?.message || '获取热更新详情失败');
    return;
  }

  nextTick(() => {
    createMergeView(data.originalSource || '', data.latestSource || '');
  });
}

function createMergeView(original: string, modified: string) {
  if (mergeViewInstance) {
    mergeViewInstance.destroy();
    mergeViewInstance = null;
  }

  const container = diffContainerRef.value;
  if (!container) return;

  container.innerHTML = '';

  mergeViewInstance = new MergeView({
    a: {
      doc: original,
      extensions: [java(), oneDark, EditorView.editable.of(false), EditorState.readOnly.of(true)]
    },
    b: {
      doc: modified,
      extensions: [java(), oneDark, EditorView.editable.of(false), EditorState.readOnly.of(true)]
    },
    parent: container
  });
}

function closeDiffModal() {
  showDiffModal.value = false;
  if (mergeViewInstance) {
    mergeViewInstance.destroy();
    mergeViewInstance = null;
  }
}

// 还原相关
const isReverting = ref(false);
const revertingClassName = ref('');

function revertRetransform(className: string) {
  window.$dialog?.warning({
    title: '确认还原',
    content: `确定要还原类 ${className} 到热更新前的原始状态吗？`,
    positiveText: '确定还原',
    negativeText: '取消',
    onPositiveClick: () => {
      isReverting.value = true;
      revertingClassName.value = className;

      fetchRetransformRevertCommand({
        instanceId: props.instanceId,
        param: { qualifiedClassName: className }
      }).catch(() => {
        isReverting.value = false;
        revertingClassName.value = '';
        window.$message?.error('还原请求发送失败');
      });
    }
  });
}

function handleRetransformRevertResult(response: CommandExecuteResponse<RetransformRevertResponse>) {
  isReverting.value = false;
  const revertedClass = revertingClassName.value;
  revertingClassName.value = '';
  const data = response.data as RetransformRevertResponse | undefined;

  if (data && data.state !== 0) {
    window.$message?.success(`类 ${revertedClass} 已还原到原始状态`);
    showDiffModal.value = false;
    if (mergeViewInstance) {
      mergeViewInstance.destroy();
      mergeViewInstance = null;
    }
    loadRetransformHistory();
  } else {
    const errorMsg = data?.message || '还原失败';
    window.$message?.error(errorMsg);
  }
}

onMounted(() => {
  eventbus.on('command:decompile', handleDecompileResult);
  eventbus.on('command:retransform', handleRetransformResult);
  eventbus.on('command:retransform-history', handleRetransformHistoryResult);
  eventbus.on('command:retransform-detail', handleRetransformDetailResult);
  eventbus.on('command:retransform-revert', handleRetransformRevertResult);
  loadRetransformHistory();
});

onUnmounted(() => {
  eventbus.off('command:decompile', handleDecompileResult);
  eventbus.off('command:retransform', handleRetransformResult);
  eventbus.off('command:retransform-history', handleRetransformHistoryResult);
  eventbus.off('command:retransform-detail', handleRetransformDetailResult);
  eventbus.off('command:retransform-revert', handleRetransformRevertResult);
  if (mergeViewInstance) {
    mergeViewInstance.destroy();
    mergeViewInstance = null;
  }
});
</script>

<template>
  <div class="jad-tab">
    <!-- 反编译表单 -->
    <NCard size="small" class="id-card mb-6">
      <div class="mb-4 flex items-center gap-2">
        <SvgIcon icon="mdi:code-tags" class="h-5 w-5 text-primary" />
        <h4 class="text-sm font-semibold">反编译配置</h4>
      </div>

      <NForm :model="formData" label-placement="top" @submit.prevent="performDecompile">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- 类全限定名 -->
          <NFormItem label="类全限定名" required>
            <NInput v-model:value="formData.className" placeholder="例如: com.example.service.UserService" clearable>
              <template #suffix>
                <span class="text-xs text-gray-400">*</span>
              </template>
            </NInput>
            <template #feedback>
              <span class="text-xs text-gray-400">请输入完整的类路径</span>
            </template>
          </NFormItem>

          <!-- 方法名称 -->
          <NFormItem label="方法名称">
            <NInput v-model:value="formData.methodName" placeholder="例如: getUserById" clearable>
              <template #suffix>
                <span class="text-xs text-gray-400">可选</span>
              </template>
            </NInput>
            <template #feedback>
              <span class="text-xs text-gray-400">留空则反编译整个类</span>
            </template>
          </NFormItem>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-4 flex items-center gap-3">
          <NButton type="primary" attr-type="submit">
            <template #icon>
              <SvgIcon icon="mdi:play" />
            </template>
            开始反编译
          </NButton>
          <NButton @click="resetForm">
            <template #icon>
              <SvgIcon icon="mdi:refresh" />
            </template>
            重置
          </NButton>
        </div>
      </NForm>
    </NCard>

    <!-- 反编译历史记录 -->
    <NCard size="small" class="id-card mb-6">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SvgIcon icon="mdi:history" class="h-4 w-4 text-purple-500" />
          <h4 class="text-sm font-semibold">反编译历史</h4>
        </div>
        <NButton size="small" text type="error" @click="clearHistory">
          <template #icon>
            <SvgIcon icon="mdi:delete" class="h-3 w-3" />
          </template>
          清空历史
        </NButton>
      </div>
      <NScrollbar x-scrollable>
        <div class="flex gap-2 pb-2">
          <NTag
            v-for="(item, index) in decompileHistory"
            :key="index"
            :bordered="false"
            class="cursor-pointer"
            @click="loadFromHistory(item)"
          >
            <div class="flex items-center gap-2">
              <SvgIcon icon="mdi:file-code" class="h-3 w-3" />
              <span class="text-xs">
                {{ item.className.split('.').pop() }}
                <span v-if="item.methodName" class="text-gray-400">#{{ item.methodName }}</span>
              </span>
            </div>
          </NTag>
        </div>
      </NScrollbar>
    </NCard>

    <!-- 生效中的热更新历史 -->
    <NCard size="small" class="id-card mb-6">
      <div class="mb-4 flex items-center gap-2">
        <SvgIcon icon="mdi:git-commit" class="h-4 w-4 text-orange-500" />
        <h4 class="text-sm font-semibold">生效中的热更新历史</h4>
        <NTag size="small" :bordered="false">{{ hotswapHistory.length }} 个类</NTag>
      </div>

      <div v-if="isHistoryLoading" class="py-8">
        <NSkeleton text :repeat="3" round />
      </div>

      <NEmpty
        v-else-if="hotswapHistory.length === 0"
        description="当前没有仍在生效中的热更新类"
        class="py-8"
        size="small"
        :show-icon="false"
      />

      <div v-else class="space-y-3">
        <div
          v-for="record in hotswapHistory"
          :key="record.className"
          class="id-history-record flex items-center justify-between border-1 border-gray rounded-lg p-3"
        >
          <div class="flex items-center gap-3">
            <SvgIcon icon="mdi:check-circle" class="h-5 w-5 text-success" />
            <div>
              <div class="text-sm font-medium">{{ record.className }}</div>
              <div class="text-xs text-gray-400">最近热更新时间 · {{ record.time }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <NButton size="small" type="info" @click="viewDiff(record.className)">
              <template #icon>
                <SvgIcon icon="mdi:file-compare" class="h-3 w-3" />
              </template>
              查看差异
            </NButton>
            <NButton
              size="small"
              type="warning"
              :loading="isReverting && revertingClassName === record.className"
              @click="revertRetransform(record.className)"
            >
              <template #icon>
                <SvgIcon icon="mdi:undo" class="h-3 w-3" />
              </template>
              还原
            </NButton>
            <NTag type="success" size="small">生效中</NTag>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 反编译结果 -->
    <NCard size="small" class="id-card">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <SvgIcon icon="mdi:file-code-outline" class="h-4 w-4 text-success" />
            <h4 class="text-sm font-semibold">反编译结果</h4>
            <NTag v-if="decompileClassName" type="info" size="small">
              {{ decompileClassName }}{{ decompileMethod ? '#' + decompileMethod : '' }}
            </NTag>
            <NTag v-if="isEditMode" type="warning" size="small">
              <template #icon>
                <SvgIcon icon="mdi:pencil" class="h-3 w-3" />
              </template>
              编辑模式
            </NTag>
            <NTag v-if="hasUnsavedChanges" type="error" size="small">
              <template #icon>
                <SvgIcon icon="mdi:alert-circle" class="h-3 w-3" />
              </template>
              未保存
            </NTag>
          </div>
          <div class="flex items-center gap-2">
            <NButton
              v-if="hasResult && !isEditMode && !decompileMethod"
              size="small"
              type="warning"
              @click="toggleEditMode"
            >
              <template #icon>
                <SvgIcon icon="mdi:pencil" />
              </template>
              编辑代码
            </NButton>
            <NButton v-if="isEditMode" size="small" type="success" @click="saveCodeChanges">
              <template #icon>
                <SvgIcon icon="mdi:content-save" />
              </template>
              保存更改
            </NButton>
            <NButton v-if="isEditMode" size="small" @click="cancelEdit">
              <template #icon>
                <SvgIcon icon="mdi:close" />
              </template>
              取消
            </NButton>
            <NButton
              v-if="hasResult && !isEditMode && decompileResult !== originalCode"
              size="small"
              type="info"
              :loading="isHotSwapping"
              @click="performHotSwap"
            >
              <template #icon>
                <SvgIcon icon="mdi:flash" />
              </template>
              热更新
            </NButton>
            <NButton v-if="hasResult" size="small" @click="copyCode">
              <template #icon>
                <SvgIcon icon="mdi:content-copy" />
              </template>
              复制
            </NButton>
            <NButton v-if="hasResult" size="small" @click="downloadCode">
              <template #icon>
                <SvgIcon icon="mdi:download" />
              </template>
              下载
            </NButton>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <NEmpty v-if="!hasResult && !isLoading" description="请输入类名并点击开始反编译按钮" class="py-12">
        <template #icon>
          <SvgIcon icon="mdi:file-search" class="text-gray-600" />
        </template>
      </NEmpty>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="py-8">
        <NSkeleton text :repeat="12" round />
      </div>

      <!-- 代码展示区 -->
      <div v-if="hasResult && !isLoading">
        <Codemirror
          :disabled="!isEditMode"
          :model-value="decompileResult"
          :extensions="[java(), oneDark]"
          :style="{ height: 'auto' }"
          @update:model-value="onCodeChange"
        />
      </div>
    </NCard>

    <!-- 差异查看弹窗 -->
    <NModal
      v-model:show="showDiffModal"
      preset="card"
      :title="`类变更差异 — ${diffClassName}`"
      class="max-w-90vw w-90%"
      :segmented="{ content: true, footer: 'soft' }"
      @after-leave="closeDiffModal"
    >
      <template #header-extra>
        <div class="flex items-center gap-4 text-12px text-gray">
          <span class="flex-y-center gap-1">
            <span class="inline-block h-3 w-3 rounded-2px bg-[#2ea04366]"></span>
            最新代码
          </span>
          <span class="flex-y-center gap-1">
            <span class="inline-block h-3 w-3 rounded-2px bg-[#f8514966]"></span>
            原始代码
          </span>
        </div>
      </template>

      <div v-if="isDiffLoading" class="py-12 text-center">
        <NSpin size="large" />
        <div class="mt-4 text-sm text-gray-300">正在获取类变更信息...</div>
      </div>

      <div v-else ref="diffContainerRef" class="diff-container min-h-400px overflow-auto"></div>

      <template #footer>
        <div class="flex items-center justify-end gap-12px">
          <NButton
            type="warning"
            :loading="isReverting && revertingClassName === diffClassName"
            @click="revertRetransform(diffClassName)"
          >
            <template #icon>
              <SvgIcon icon="mdi:undo" />
            </template>
            还原到原始代码
          </NButton>
          <NButton @click="showDiffModal = false">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="scss">
.jad-tab {
  padding: 0;
}

.diff-container {
  :deep(.cm-mergeView) {
    height: 100%;
    max-height: 60vh;
    overflow: auto;
  }

  :deep(.cm-editor) {
    font-size: 12px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  }
}
</style>
