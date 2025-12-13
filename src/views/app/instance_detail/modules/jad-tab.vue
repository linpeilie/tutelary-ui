<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
// 引入组件
import { Codemirror } from 'vue-codemirror';
// 引入JavaScript语言支持
import { java } from '@codemirror/lang-java';
// 引入One Dark主题
import { oneDark } from '@codemirror/theme-one-dark';
import { fetchDecompileCommand } from '@/service/api/instance';
import eventbus from '@/utils/eventbus';
import type { DecompileResponse } from '@/proto/command/result/DecompileResponse';

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
  operation: string;
  time: string;
  status: 'success' | 'failed';
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

// 执行热更新
function performHotSwap() {
  window.$dialog?.warning({
    title: '确认热更新',
    content: '确定要将修改后的代码热更新到运行中的JVM吗?\n\n注意:热更新可能会影响应用运行,请谨慎操作。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      const loadingMessage = window.$message?.loading('正在执行热更新...', { duration: 0 });

      setTimeout(() => {
        loadingMessage?.destroy();

        // 添加到热更新历史
        hotswapHistory.value.unshift({
          className: decompileClassName.value,
          operation: '代码热更新',
          time: '刚刚',
          status: 'success'
        });

        window.$message?.success('热更新成功');
      }, 2000);
    }
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

// 清空热更新历史
function clearHotswapHistory() {
  window.$dialog?.warning({
    title: '确认操作',
    content: '确定要清空热更新历史记录吗?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      hotswapHistory.value = [];
      window.$message?.success('热更新历史已清空');
    }
  });
}

onMounted(() => {
  eventbus.on('command:decompile', data => {
    console.log('data', data);
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
  });
});

onUnmounted(() => {
  eventbus.off('command:decompile');
});
</script>

<template>
  <div class="jad-tab">
    <!-- 反编译表单 -->
    <NCard size="small" class="card mb-6">
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
    <NCard size="small" class="card mb-6">
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

    <!-- 修改与热更新历史 -->
    <NCard size="small" class="card mb-6">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SvgIcon icon="mdi:git-commit" class="h-4 w-4 text-orange-500" />
          <h4 class="text-sm font-semibold">修改与热更新历史</h4>
          <NTag size="small" :bordered="false">{{ hotswapHistory.length }} 条记录</NTag>
        </div>
        <NButton size="small" text type="error" @click="clearHotswapHistory">
          <template #icon>
            <SvgIcon icon="mdi:delete" class="h-3 w-3" />
          </template>
          清空历史
        </NButton>
      </div>

      <!-- 空状态 -->
      <NEmpty
        v-if="hotswapHistory.length === 0"
        description="暂无修改和热更新记录"
        class="py-8"
        size="small"
        :show-icon="false"
      />

      <!-- 历史记录列表 -->
      <div v-else class="space-y-3">
        <div
          v-for="(record, index) in hotswapHistory"
          :key="index"
          class="history-record flex items-center justify-between border-1 border-gray rounded-lg p-3"
        >
          <div class="flex items-center gap-3">
            <SvgIcon
              :icon="record.status === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'"
              :class="record.status === 'success' ? 'text-success' : 'text-error'"
              class="h-5 w-5"
            />
            <div>
              <div class="text-sm font-medium">{{ record.className }}</div>
              <div class="text-xs text-gray-400">{{ record.operation }} · {{ record.time }}</div>
            </div>
          </div>
          <NTag :type="record.status === 'success' ? 'success' : 'error'" size="small">
            {{ record.status === 'success' ? '成功' : '失败' }}
          </NTag>
        </div>
      </div>
    </NCard>

    <!-- 反编译结果 -->
    <NCard size="small" class="card">
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
      <div v-if="isLoading" class="py-12 text-center">
        <NSpin size="large" />
        <div class="mt-4 text-sm text-gray-300 font-semibold">正在反编译...</div>
        <div class="text-xs text-gray-500">请稍候</div>
      </div>

      <!-- 代码展示区 -->
      <div v-if="hasResult && !isLoading">
        <Codemirror
          :disabled="!isEditMode"
          :model-value="decompileResult"
          :extensions="[java(), oneDark]"
          :style="{ height: 'auto' }"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.jad-tab {
  padding: 0;
}

.card {
  border-radius: 12px;
}

.history-record {
  transition: all 0.2s;

  &:hover {
    background-color: rgba(var(--n-color-target-rgb), 0.3);
  }
}

.code-content {
  padding: 24px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  color: var(--n-text-color);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

:deep(.code-editor) {
  .n-input__textarea-el {
    font-size: 12px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    line-height: 1.6;
    background-color: rgba(0, 0, 0, 0.2);
  }
}
</style>
