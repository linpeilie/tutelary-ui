<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, shallowRef, watch } from 'vue';
import { syntaxTree } from '@codemirror/language';
import { java } from '@codemirror/lang-java';
import { linter, lintGutter, forceLinting, type Diagnostic } from '@codemirror/lint';
import { MergeView } from '@codemirror/merge';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import { Codemirror } from 'vue-codemirror';
import {
  fetchDecompileCommand,
  fetchRetransformCommand,
  fetchRetransformDetailCommand,
  fetchRetransformHistoryCommand,
  fetchRetransformRevertCommand
} from '@/service/api/instance';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { DecompileResponse } from '@/proto/command/result/DecompileResponse';
import type { RetransformDetailResponse } from '@/proto/command/result/RetransformDetailResponse';
import type { RetransformHistoryResponse } from '@/proto/command/result/RetransformHistoryResponse';
import type { RetransformResponse } from '@/proto/command/result/RetransformResponse';
import type { RetransformRevertResponse } from '@/proto/command/result/RetransformRevertResponse';
import eventbus from '@/utils/eventbus';

interface Props {
  instanceId: string;
  appName: string;
  launchAction?: DecompileLaunchAction | null;
}

interface DecompileLaunchAction {
  id: number;
  className: string;
  methodName?: string;
}

interface HistoryItem {
  appName: string;
  className: string;
  methodName: string;
  lastUsedAt: number;
}

interface HotswapRecord {
  className: string;
  updateTime: number;
  time: string;
}

interface ValidationIssue {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  from: number;
  to: number;
}

const props = defineProps<Props>();

const HISTORY_STORAGE_KEY = 'tutelary:jad:decompile-history:v1';
const MAX_HISTORY_PER_APP = 10;

const formData = reactive({
  className: '',
  methodName: ''
});

const decompileResult = shallowRef('');
const decompileClassName = shallowRef('');
const decompileMethod = shallowRef('');
const lastAppliedCode = shallowRef('');
const editSnapshotCode = shallowRef('');
const validatedCode = shallowRef('');
const hotSwapError = shallowRef('');
const requestError = shallowRef('');

const isLoading = shallowRef(false);
const hasResult = shallowRef(false);
const isEditMode = shallowRef(false);
const hasUnsavedChanges = shallowRef(false);
const isHotSwapping = shallowRef(false);
const isHistoryLoading = shallowRef(false);
const isValidationReady = shallowRef(false);
const handledLaunchActionId = shallowRef(0);

const validationIssues = ref<ValidationIssue[]>([]);
const decompileHistory = ref<HistoryItem[]>([]);
const hotswapHistory = ref<HotswapRecord[]>([]);
const editorView = shallowRef<EditorView | null>(null);

const trimmedClassName = computed(() => formData.className.trim());
const trimmedMethodName = computed(() => formData.methodName.trim());
const canDecompile = computed(() => Boolean(trimmedClassName.value) && !isLoading.value);
const isWholeClassResult = computed(() => !decompileMethod.value);
const hasPendingHotSwap = computed(() => hasResult.value && !isEditMode.value && decompileResult.value !== lastAppliedCode.value);
const canValidateCode = computed(() => hasPendingHotSwap.value && isWholeClassResult.value && !hasUnsavedChanges.value);
const canHotSwap = computed(() => canValidateCode.value && validatedCode.value === decompileResult.value && validationIssues.value.length === 0);
const visibleHistory = computed(() => decompileHistory.value.filter(item => item.appName === props.appName).slice(0, MAX_HISTORY_PER_APP));
const editorExtensions = computed(() => [java(), oneDark, lintGutter(), javaValidationLinter]);

const javaValidationLinter = linter(() => toDiagnostics(validationIssues.value), {
  delay: 0
});

watch(
  () => props.appName,
  () => {
    loadHistory();
  },
  { immediate: true }
);

watch(
  () => props.launchAction?.id,
  () => {
    launchDecompile(props.launchAction);
  }
);

function performDecompile() {
  if (!trimmedClassName.value) {
    return;
  }

  isLoading.value = true;
  hasResult.value = false;
  requestError.value = '';
  hotSwapError.value = '';
  resetValidationState();

  fetchDecompileCommand({
    instanceId: props.instanceId,
    param: {
      qualifiedClassName: trimmedClassName.value,
      methodName: trimmedMethodName.value
    }
  }).catch(error => {
    isLoading.value = false;
    requestError.value = getErrorMessage(error, '反编译请求发送失败');
  });
}

function launchDecompile(action?: DecompileLaunchAction | null) {
  if (!action || action.id === handledLaunchActionId.value) return;

  handledLaunchActionId.value = action.id;
  formData.className = action.className;
  formData.methodName = action.methodName || '';
  performDecompile();
}

function resetForm() {
  formData.className = '';
  formData.methodName = '';
}

function loadFromHistory(item: HistoryItem) {
  formData.className = item.className;
  formData.methodName = item.methodName;
}

function clearHistory() {
  window.$dialog?.warning({
    title: '确认操作',
    content: '确定要清空当前应用的反编译历史记录吗?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      decompileHistory.value = decompileHistory.value.filter(item => item.appName !== props.appName);
      persistHistory();
      window.$message?.success('历史记录已清空');
    }
  });
}

function toggleEditMode() {
  if (!hasResult.value || decompileMethod.value) return;

  isEditMode.value = true;
  editSnapshotCode.value = decompileResult.value;
  hasUnsavedChanges.value = false;
  hotSwapError.value = '';
}

function saveCodeChanges() {
  if (!decompileResult.value.trim()) {
    window.$message?.warning('代码内容为空');
    return;
  }

  hasUnsavedChanges.value = false;
  isEditMode.value = false;
  hotSwapError.value = '';

  if (decompileResult.value !== validatedCode.value) {
    resetValidationState();
  }
}

function cancelEdit() {
  const closeEdit = () => {
    isEditMode.value = false;
    hasUnsavedChanges.value = false;
    decompileResult.value = editSnapshotCode.value;
    resetValidationState();
  };

  if (!hasUnsavedChanges.value) {
    isEditMode.value = false;
    return;
  }

  window.$dialog?.warning({
    title: '确认操作',
    content: '有未保存的更改,确定要取消编辑吗?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: closeEdit
  });
}

function onCodeChange(value: string) {
  decompileResult.value = value;

  if (!isEditMode.value) return;

  hasUnsavedChanges.value = value !== editSnapshotCode.value;
  if (validatedCode.value && value !== validatedCode.value) {
    resetValidationState();
  }
}

function handleEditorReady(payload: { view: EditorView }) {
  editorView.value = payload.view;
}

function handleEditorChange(_value: string, viewUpdate: ViewUpdate) {
  editorView.value = viewUpdate.view;
}

function validateCode() {
  const view = editorView.value;
  if (!view) {
    window.$message?.warning('编辑器未就绪');
    return;
  }

  const issues = validateJavaSource(view.state);
  validationIssues.value = issues;
  isValidationReady.value = true;
  forceLinting(view);

  if (issues.length === 0) {
    validatedCode.value = decompileResult.value;
    hotSwapError.value = '';
    window.$message?.success('代码校验通过，可以执行热更新');
    return;
  }

  validatedCode.value = '';
}

function performHotSwap() {
  if (!decompileClassName.value || !canHotSwap.value) {
    return;
  }

  window.$dialog?.warning({
    title: '确认热更新',
    content: '确定要将修改后的代码热更新到运行中的JVM吗?\n\n注意:热更新可能会影响应用运行,请谨慎操作。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      isHotSwapping.value = true;
      hotSwapError.value = '';

      fetchRetransformCommand({
        instanceId: props.instanceId,
        param: {
          qualifiedClassName: decompileClassName.value,
          javaSource: decompileResult.value
        }
      }).catch(error => {
        isHotSwapping.value = false;
        hotSwapError.value = getErrorMessage(error, '热更新请求发送失败');
      });
    }
  });
}

function formatHistoryTime(updateTime: number) {
  return new Date(updateTime).toLocaleString('zh-CN', { hour12: false });
}

function formatRelativeTime(time: number) {
  const diff = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  return formatHistoryTime(time);
}

function loadRetransformHistory() {
  isHistoryLoading.value = true;
  fetchRetransformHistoryCommand({
    instanceId: props.instanceId,
    param: {}
  }).catch(error => {
    isHistoryLoading.value = false;
    hotSwapError.value = getErrorMessage(error, '获取热更新历史失败');
  });
}

function copyCode() {
  navigator.clipboard.writeText(decompileResult.value).then(() => {
    window.$message?.success('代码已复制到剪贴板');
  });
}

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

function handleDecompileResult(response: CommandExecuteResponse<DecompileResponse>) {
  const decompile = response.data as DecompileResponse | undefined;
  const source = decompile?.source === 'null' ? '' : decompile?.source || '';

  decompileResult.value = source;
  lastAppliedCode.value = source;
  editSnapshotCode.value = source;
  decompileClassName.value = decompile?.qualifiedClassName || trimmedClassName.value;
  decompileMethod.value = decompile?.methodName || trimmedMethodName.value;
  formData.className = decompileClassName.value;
  formData.methodName = decompileMethod.value;

  isLoading.value = false;
  hasResult.value = true;
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
  requestError.value = '';
  hotSwapError.value = '';
  resetValidationState();

  addToHistory(decompileClassName.value, decompileMethod.value);
}

function handleRetransformHistoryResult(response: CommandExecuteResponse<RetransformHistoryResponse>) {
  isHistoryLoading.value = false;
  const data = response.data as RetransformHistoryResponse | undefined;

  if (!data || data.state === 0) {
    hotSwapError.value = data?.message || '获取热更新历史失败';
    return;
  }

  hotswapHistory.value = (data.records || []).map(record => ({
    className: record.qualifiedClassName,
    updateTime: record.updateTime,
    time: formatHistoryTime(record.updateTime)
  }));
}

function handleRetransformResult(response: CommandExecuteResponse<RetransformResponse>) {
  isHotSwapping.value = false;
  const data = response.data as RetransformResponse | undefined;

  if (data && data.state !== 0) {
    lastAppliedCode.value = decompileResult.value;
    editSnapshotCode.value = decompileResult.value;
    validatedCode.value = '';
    hasUnsavedChanges.value = false;
    hotSwapError.value = '';
    loadRetransformHistory();
    window.$message?.success('热更新成功');
    return;
  }

  hotSwapError.value = data?.message || '热更新失败';
}

const showDiffModal = shallowRef(false);
const isDiffLoading = shallowRef(false);
const diffClassName = shallowRef('');
const diffContainerRef = ref<HTMLElement | null>(null);
let mergeViewInstance: MergeView | null = null;

function viewDiff(className: string) {
  diffClassName.value = className;
  isDiffLoading.value = true;
  showDiffModal.value = true;

  fetchRetransformDetailCommand({
    instanceId: props.instanceId,
    param: { qualifiedClassName: className }
  }).catch(error => {
    isDiffLoading.value = false;
    hotSwapError.value = getErrorMessage(error, '获取热更新详情失败');
  });
}

function handleRetransformDetailResult(response: CommandExecuteResponse<RetransformDetailResponse>) {
  isDiffLoading.value = false;
  const data = response.data as RetransformDetailResponse | undefined;

  if (!data || data.state === 0) {
    hotSwapError.value = data?.message || '获取热更新详情失败';
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

const isReverting = shallowRef(false);
const revertingClassName = shallowRef('');

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
      }).catch(error => {
        isReverting.value = false;
        revertingClassName.value = '';
        hotSwapError.value = getErrorMessage(error, '还原请求发送失败');
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
    closeDiffModal();
    loadRetransformHistory();
    return;
  }

  hotSwapError.value = data?.message || '还原失败';
}

function validateJavaSource(state: EditorState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const source = state.doc.toString();

  if (!source.trim()) {
    addIssue(issues, state, 0, 1, '代码内容为空');
    return issues;
  }

  addSyntaxIssues(issues, state);
  addBraceIssues(issues, state, source);
  addClassNameIssue(issues, state, source);

  return dedupeIssues(issues);
}

function addSyntaxIssues(issues: ValidationIssue[], state: EditorState) {
  const cursor = syntaxTree(state).cursor();

  do {
    if (cursor.type.isError) {
      addIssue(issues, state, cursor.from, Math.max(cursor.to, cursor.from + 1), 'Java 语法解析失败');
    }
  } while (cursor.next());
}

function addBraceIssues(issues: ValidationIssue[], state: EditorState, source: string) {
  const stack: Array<{ char: string; index: number }> = [];
  const pairs: Record<string, string> = {
    '}': '{',
    ']': '[',
    ')': '('
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{' || char === '[' || char === '(') {
      stack.push({ char, index });
      continue;
    }

    if (char !== '}' && char !== ']' && char !== ')') continue;

    const expected = pairs[char];
    const top = stack.pop();

    if (!top || top.char !== expected) {
      addIssue(issues, state, index, index + 1, `括号不匹配，发现多余的 ${char}`);
      return;
    }
  }

  const unclosed = stack.pop();
  if (unclosed) {
    addIssue(issues, state, unclosed.index, unclosed.index + 1, `括号未闭合：${unclosed.char}`);
  }
}

function addClassNameIssue(issues: ValidationIssue[], state: EditorState, source: string) {
  const simpleName = decompileClassName.value.split('.').pop();
  if (!simpleName) return;

  const escaped = simpleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const classLike = new RegExp(`\\b(class|interface|enum|record)\\s+${escaped}\\b`);

  if (!classLike.test(source)) {
    const line = state.doc.line(1);
    issues.push({
      line: 1,
      column: 1,
      from: line.from,
      to: Math.max(line.from + 1, line.to),
      severity: 'error',
      message: `源码中未找到与 ${decompileClassName.value} 匹配的类型声明`
    });
  }
}

function addIssue(issues: ValidationIssue[], state: EditorState, from: number, to: number, message: string) {
  const safeFrom = Math.min(Math.max(from, 0), state.doc.length);
  const safeTo = Math.min(Math.max(to, safeFrom + 1), state.doc.length);
  const line = state.doc.lineAt(safeFrom);

  issues.push({
    line: line.number,
    column: safeFrom - line.from + 1,
    from: safeFrom,
    to: Math.max(safeTo, Math.min(line.to, safeFrom + 1)),
    severity: 'error',
    message
  });
}

function dedupeIssues(issues: ValidationIssue[]) {
  const seen = new Set<string>();

  return issues.filter(issue => {
    const key = `${issue.line}:${issue.column}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toDiagnostics(issues: ValidationIssue[]): Diagnostic[] {
  if (!isValidationReady.value) return [];

  return issues.map(issue => ({
    from: issue.from,
    to: issue.to,
    severity: issue.severity,
    message: issue.message
  }));
}

function resetValidationState() {
  validationIssues.value = [];
  validatedCode.value = '';
  isValidationReady.value = false;

  if (editorView.value) {
    forceLinting(editorView.value);
  }
}

function loadHistory() {
  if (typeof sessionStorage === 'undefined') return;

  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    const records = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    decompileHistory.value = records.filter(isValidHistoryItem);
  } catch {
    decompileHistory.value = [];
  }
}

function addToHistory(className: string, methodName = '') {
  if (!className) return;

  const nextItem: HistoryItem = {
    appName: props.appName,
    className,
    methodName,
    lastUsedAt: Date.now()
  };

  const otherAppItems = decompileHistory.value.filter(item => item.appName !== props.appName);
  const currentAppItems = decompileHistory.value
    .filter(item => item.appName === props.appName)
    .filter(item => item.className !== className || item.methodName !== methodName);

  decompileHistory.value = [...otherAppItems, nextItem, ...currentAppItems].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  decompileHistory.value = [
    ...decompileHistory.value.filter(item => item.appName !== props.appName),
    ...decompileHistory.value.filter(item => item.appName === props.appName).slice(0, MAX_HISTORY_PER_APP)
  ];
  persistHistory();
}

function persistHistory() {
  if (typeof sessionStorage === 'undefined') return;

  sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(decompileHistory.value));
}

function isValidHistoryItem(item: HistoryItem) {
  return (
    item &&
    typeof item.appName === 'string' &&
    typeof item.className === 'string' &&
    typeof item.methodName === 'string' &&
    typeof item.lastUsedAt === 'number'
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

onMounted(() => {
  eventbus.on('command:decompile', handleDecompileResult);
  eventbus.on('command:retransform', handleRetransformResult);
  eventbus.on('command:retransform-history', handleRetransformHistoryResult);
  eventbus.on('command:retransform-detail', handleRetransformDetailResult);
  eventbus.on('command:retransform-revert', handleRetransformRevertResult);
  loadRetransformHistory();
  launchDecompile(props.launchAction);
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
    <NCard size="small" class="id-card jad-command-card">
      <NForm :model="formData" label-placement="top" @submit.prevent="performDecompile">
        <div class="jad-command-grid">
          <NFormItem label="类全限定名" required>
            <NInput
              v-model:value="formData.className"
              placeholder="com.example.service.UserService"
              clearable
              :disabled="isLoading"
            />
          </NFormItem>

          <NFormItem label="方法名称">
            <NInput v-model:value="formData.methodName" placeholder="留空则反编译整个类" clearable :disabled="isLoading" />
          </NFormItem>

          <div class="jad-command-actions">
            <NButton type="primary" attr-type="submit" :disabled="!canDecompile" :loading="isLoading">
              <template #icon>
                <SvgIcon icon="lucide:play" />
              </template>
              {{ isLoading ? '反编译中...' : '开始反编译' }}
            </NButton>
            <NButton :disabled="isLoading" @click="resetForm">
              <template #icon>
                <SvgIcon icon="lucide:rotate-ccw" />
              </template>
              重置
            </NButton>
          </div>
        </div>
      </NForm>
      <NAlert v-if="requestError" type="error" class="mt-12px" :show-icon="false">
        {{ requestError }}
      </NAlert>
    </NCard>

    <div class="jad-workspace">
      <NCard size="small" class="id-card jad-result-card">
        <template #header>
          <div class="jad-card-header">
            <div class="jad-title">
              <SvgIcon icon="lucide:file-code-2" class="text-16px text-success" />
              <span>反编译结果</span>
              <NTag v-if="decompileClassName" type="info" size="small" :bordered="false">
                {{ decompileClassName }}{{ decompileMethod ? '#' + decompileMethod : '' }}
              </NTag>
              <NTag v-if="isEditMode" type="warning" size="small" :bordered="false">编辑中</NTag>
              <NTag v-else-if="hasPendingHotSwap" type="warning" size="small" :bordered="false">待热更新</NTag>
              <NTag v-if="canHotSwap" type="success" size="small" :bordered="false">校验通过</NTag>
            </div>

            <div class="jad-toolbar">
              <NButton v-if="hasResult && !isEditMode && isWholeClassResult" size="small" @click="toggleEditMode">
                <template #icon>
                  <SvgIcon icon="lucide:pencil" />
                </template>
                编辑
              </NButton>
              <NButton v-if="isEditMode" size="small" type="success" @click="saveCodeChanges">
                <template #icon>
                  <SvgIcon icon="lucide:save" />
                </template>
                保存
              </NButton>
              <NButton v-if="isEditMode" size="small" @click="cancelEdit">
                <template #icon>
                  <SvgIcon icon="lucide:x" />
                </template>
                取消
              </NButton>
              <NButton v-if="canValidateCode" size="small" type="info" @click="validateCode">
                <template #icon>
                  <SvgIcon icon="lucide:check-circle" />
                </template>
                校验代码
              </NButton>
              <NButton
                v-if="hasPendingHotSwap && isWholeClassResult"
                size="small"
                type="warning"
                :disabled="!canHotSwap"
                :loading="isHotSwapping"
                @click="performHotSwap"
              >
                <template #icon>
                  <SvgIcon icon="lucide:zap" />
                </template>
                热更新
              </NButton>
              <NButton v-if="hasResult" size="small" @click="copyCode">
                <template #icon>
                  <SvgIcon icon="lucide:copy" />
                </template>
                复制
              </NButton>
              <NButton v-if="hasResult" size="small" @click="downloadCode">
                <template #icon>
                  <SvgIcon icon="lucide:download" />
                </template>
                下载
              </NButton>
            </div>
          </div>
        </template>

        <NEmpty v-if="!hasResult && !isLoading" description="输入类全限定名后开始反编译" class="py-56px">
          <template #icon>
            <SvgIcon icon="lucide:file-search" class="text-36px text-gray-500" />
          </template>
        </NEmpty>

        <div v-if="isLoading" class="py-20px">
          <NSkeleton text :repeat="14" round />
        </div>

        <div v-if="hasResult && !isLoading" class="jad-editor-shell">
          <NAlert v-if="hotSwapError" type="error" class="mb-12px" :show-icon="false">
            {{ hotSwapError }}
          </NAlert>
          <Codemirror
            class="jad-code-editor"
            :disabled="!isEditMode"
            :model-value="decompileResult"
            :extensions="editorExtensions"
            :style="{ height: '560px' }"
            @ready="handleEditorReady"
            @change="handleEditorChange"
            @update:model-value="onCodeChange"
          />
        </div>
      </NCard>

      <div class="jad-side-panel">
        <NCard v-if="visibleHistory.length > 0" size="small" class="id-card">
          <template #header>
            <div class="jad-card-header">
              <div class="jad-title">
                <SvgIcon icon="lucide:history" class="text-16px text-info" />
                <span>反编译历史</span>
              </div>
              <NButton size="tiny" text type="error" @click="clearHistory">
                <template #icon>
                  <SvgIcon icon="lucide:trash-2" />
                </template>
                清空
              </NButton>
            </div>
          </template>

          <div class="jad-history-list">
            <NTooltip v-for="item in visibleHistory" :key="`${item.appName}:${item.className}:${item.methodName}`">
              <template #trigger>
                <button class="jad-history-item" type="button" @click="loadFromHistory(item)">
                  <span class="jad-history-name">
                    {{ item.className.split('.').pop() }}
                    <span v-if="item.methodName">#{{ item.methodName }}</span>
                  </span>
                  <span class="jad-history-time">{{ formatRelativeTime(item.lastUsedAt) }}</span>
                </button>
              </template>
              <div class="space-y-4px text-12px">
                <div>类：{{ item.className }}</div>
                <div>方法：{{ item.methodName || '全部类' }}</div>
                <div>最近使用：{{ formatHistoryTime(item.lastUsedAt) }}</div>
              </div>
            </NTooltip>
          </div>
        </NCard>

        <NCard size="small" class="id-card">
          <template #header>
            <div class="jad-card-header">
              <div class="jad-title">
                <SvgIcon icon="lucide:git-commit" class="text-16px text-success" />
                <span>生效中的热更新</span>
              </div>
              <NTag size="small" :bordered="false">{{ hotswapHistory.length }}</NTag>
            </div>
          </template>

          <div v-if="isHistoryLoading" class="py-16px">
            <NSkeleton text :repeat="3" round />
          </div>
          <NEmpty
            v-else-if="hotswapHistory.length === 0"
            description="当前没有仍在生效中的热更新类"
            size="small"
            :show-icon="false"
            class="py-24px"
          />
          <div v-else class="jad-hotswap-list">
            <div v-for="record in hotswapHistory" :key="record.className" class="jad-hotswap-item">
              <div class="min-w-0">
                <div class="truncate text-13px font-600">{{ record.className }}</div>
                <div class="mt-4px text-12px text-gray-500">{{ record.time }}</div>
              </div>
              <div class="jad-hotswap-actions">
                <NButton size="tiny" quaternary type="info" @click="viewDiff(record.className)">
                  <template #icon>
                    <SvgIcon icon="lucide:file-diff" />
                  </template>
                </NButton>
                <NButton
                  size="tiny"
                  quaternary
                  type="warning"
                  :loading="isReverting && revertingClassName === record.className"
                  @click="revertRetransform(record.className)"
                >
                  <template #icon>
                    <SvgIcon icon="lucide:undo-2" />
                  </template>
                </NButton>
              </div>
            </div>
          </div>
        </NCard>
      </div>
    </div>

    <NModal
      v-model:show="showDiffModal"
      preset="card"
      :title="`类变更差异 - ${diffClassName}`"
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
              <SvgIcon icon="lucide:undo-2" />
            </template>
            还原到原始代码
          </NButton>
          <NButton @click="showDiffModal = false">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.jad-tab {
  padding: 0;
}

.jad-command-card {
  margin-bottom: 16px;
}

.jad-command-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(220px, 320px) auto;
  gap: 12px;
  align-items: flex-start;
}

.jad-command-actions {
  display: flex;
  gap: 8px;
  padding-top: 30px;
  white-space: nowrap;
}

.jad-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: flex-start;
}

.jad-result-card {
  min-width: 0;
}

.jad-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.jad-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.jad-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.jad-editor-shell {
  min-width: 0;
}

.jad-code-editor {
  overflow: hidden;
  border: 1px solid rgba(128, 128, 128, 0.18);
  border-radius: 6px;
}

.jad-code-editor :deep(.cm-editor) {
  height: 560px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
}

.jad-code-editor :deep(.cm-scroller) {
  overflow: auto;
}

.jad-code-editor :deep(.cm-line:has(.cm-lintRange-error)) {
  background: rgba(208, 48, 80, 0.16);
}

.jad-side-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
}

.jad-history-list,
.jad-issue-list,
.jad-hotswap-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.jad-history-item,
.jad-issue-item {
  width: 100%;
  border: 1px solid rgba(128, 128, 128, 0.18);
  border-radius: 6px;
  background: transparent;
  padding: 8px 10px;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.jad-history-item:hover,
.jad-issue-item:hover {
  border-color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.06);
}

.jad-history-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
}

.jad-history-time {
  margin-top: 4px;
  display: block;
  font-size: 12px;
  color: rgba(107, 114, 128, 0.95);
}

.jad-issue-item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px;
  color: rgb(var(--error-color));
  font-size: 12px;
}

.jad-issue-location {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-weight: 600;
}

.jad-hotswap-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  border: 1px solid rgba(128, 128, 128, 0.18);
  border-radius: 6px;
  padding: 10px;
}

.jad-hotswap-actions {
  display: flex;
  gap: 4px;
}

.diff-container {
  :deep(.cm-mergeView) {
    height: 100%;
    max-height: 60vh;
    overflow: auto;
  }

  :deep(.cm-editor) {
    font-family: Consolas, Monaco, 'Courier New', monospace;
    font-size: 12px;
  }
}

@media (max-width: 1180px) {
  .jad-command-grid,
  .jad-workspace {
    grid-template-columns: 1fr;
  }

  .jad-command-actions {
    padding-top: 0;
  }
}
</style>
