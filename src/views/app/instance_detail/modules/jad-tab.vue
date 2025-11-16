<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  instanceId: string;
}

defineProps<Props>();

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
const isLoading = ref(false);
const hasResult = ref(false);
const isEditMode = ref(false);
const hasUnsavedChanges = ref(false);
const editedCode = ref('');
const originalCode = ref('');

// 反编译历史
interface HistoryItem {
  className: string;
  methodName?: string;
  time: string;
}

const decompileHistory = ref<HistoryItem[]>([
  { className: 'com.example.service.UserService', time: '5分钟前' },
  { className: 'com.example.controller.OrderController', methodName: 'createOrder', time: '10分钟前' },
  { className: 'com.example.util.DateUtils', time: '15分钟前' }
]);

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

  // 模拟反编译过程
  setTimeout(() => {
    decompileClassName.value = formData.value.className;
    decompileResult.value = generateSampleCode(formData.value.className, formData.value.methodName);
    originalCode.value = decompileResult.value;
    isLoading.value = false;
    hasResult.value = true;

    // 添加到历史记录
    addToHistory(formData.value.className, formData.value.methodName);

    window.$message?.success('反编译成功');
  }, 1500);
}

// 生成示例代码
function generateSampleCode(className: string, methodName?: string): string {
  return `package com.example.service;

import com.example.model.User;
import com.example.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 用户服务类
 *
 * @author System
 * @version 1.0
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * 根据ID获取用户
     *
     * @param id 用户ID
     * @return 用户对象
     */
    public User getUserById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        Optional<User> userOptional = this.userRepository.findById(id);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // 记录日志
            this.logUserAccess(user);
            return user;
        } else {
            throw new UserNotFoundException("User not found with id: " + id);
        }
    }

    /**
     * 获取所有用户列表
     *
     * @return 用户列表
     */
    public List<User> getAllUsers() {
        return this.userRepository.findAll();
    }

    /**
     * 创建新用户
     *
     * @param user 用户对象
     * @return 保存后的用户对象
     */
    public User createUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        // 验证用户数据
        this.validateUser(user);

        // 保存用户
        User savedUser = this.userRepository.save(user);

        // 发送欢迎邮件
        this.sendWelcomeEmail(savedUser);

        return savedUser;
    }

    /**
     * 更新用户信息
     *
     * @param id 用户ID
     * @param user 用户对象
     * @return 更新后的用户对象
     */
    public User updateUser(Long id, User user) {
        User existingUser = this.getUserById(id);

        // 更新字段
        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());
        existingUser.setPhone(user.getPhone());

        return this.userRepository.save(existingUser);
    }

    /**
     * 删除用户
     *
     * @param id 用户ID
     */
    public void deleteUser(Long id) {
        User user = this.getUserById(id);
        this.userRepository.delete(user);

        // 记录删除日志
        this.logUserDeletion(user);
    }
}`;
}

// 加载示例
function loadSample() {
  formData.value.className = 'com.example.service.UserService';
  formData.value.methodName = 'getUserById';
  window.$message?.success('已加载示例');
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
    editedCode.value = decompileResult.value;
  }
}

// 保存代码更改
function saveCodeChanges() {
  if (!editedCode.value) {
    window.$message?.warning('代码内容为空');
    return;
  }

  decompileResult.value = editedCode.value;
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
        editedCode.value = '';
      }
    });
  } else {
    isEditMode.value = false;
    editedCode.value = '';
  }
}

// 监听代码更改
function onCodeChange() {
  hasUnsavedChanges.value = editedCode.value !== originalCode.value;
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
              <span class="text-xs text-gray-500">请输入完整的类路径</span>
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
              <span class="text-xs text-gray-500">留空则反编译整个类</span>
            </template>
          </NFormItem>
        </div>

        <!-- 高级选项 -->
        <div class="border-t-1 border-gray pt-4">
          <NButton text size="small" @click="showAdvanced = !showAdvanced">
            <template #icon>
              <SvgIcon :icon="showAdvanced ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
            </template>
            高级选项
          </NButton>

          <div v-show="showAdvanced" class="grid grid-cols-1 mt-3 gap-3 md:grid-cols-3">
            <NCheckbox v-model:checked="advancedOptions.showLineNumbers">显示行号</NCheckbox>
            <NCheckbox v-model:checked="advancedOptions.showComments">显示注释</NCheckbox>
            <NCheckbox v-model:checked="advancedOptions.beautifyCode">美化代码</NCheckbox>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-4 flex items-center gap-3">
          <NButton type="primary" attr-type="submit">
            <template #icon>
              <SvgIcon icon="mdi:play" />
            </template>
            开始反编译
          </NButton>
          <NButton @click="loadSample">
            <template #icon>
              <SvgIcon icon="mdi:file-code" />
            </template>
            加载示例
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
              <span class="text-xs">{{ item.className.split('.').pop() }}</span>
              <span v-if="item.methodName" class="text-xs text-gray-400">.{{ item.methodName }}</span>
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
      <NEmpty v-if="hotswapHistory.length === 0" description="暂无修改和热更新记录" class="py-8">
        <template #icon>
          <SvgIcon icon="mdi:file-clock" class="text-6xl text-gray-600" />
        </template>
      </NEmpty>

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
            <NTag v-if="decompileClassName" type="info" size="small">{{ decompileClassName }}</NTag>
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
            <NButton v-if="hasResult && !isEditMode" size="small" type="warning" @click="toggleEditMode">
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
          <SvgIcon icon="mdi:file-search" class="text-6xl text-gray-600" />
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
        <!-- 只读模式 -->
        <div v-if="!isEditMode" class="code-container">
          <NScrollbar>
            <pre class="code-content">{{ decompileResult }}</pre>
          </NScrollbar>
        </div>

        <!-- 编辑模式 -->
        <div v-else>
          <NInput
            v-model:value="editedCode"
            type="textarea"
            :rows="25"
            :autosize="false"
            placeholder="编辑代码..."
            class="code-editor"
            @input="onCodeChange"
          />
        </div>
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

.code-container {
  max-height: 600px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
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
