<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NCard, NEmpty, NProgress, NTag } from 'naive-ui';
import { fetchEnhanceTaskListCommand } from '@/service/api/instance';
import eventbus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { EnhanceTaskRecord } from '@/proto/command/domain/EnhanceTaskRecord';
import type { EnhanceTaskListResponse } from '@/proto/command/result/EnhanceTaskListResponse';

interface Props {
  instanceId: string;
  commandCode: number;
  runningLabel?: string;
  recentLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  runningLabel: '进行中的任务',
  recentLabel: '最近完成'
});

const runningTasks = ref<EnhanceTaskRecord[]>([]);
const recentTasks = ref<EnhanceTaskRecord[]>([]);
const isLoading = ref(false);

const filteredRunning = computed(() => runningTasks.value.filter(t => t.commandCode === props.commandCode));
const filteredRecent = computed(() => recentTasks.value.filter(t => t.commandCode === props.commandCode));
const hasData = computed(() => filteredRunning.value.length > 0 || filteredRecent.value.length > 0);

function loadTaskList() {
  isLoading.value = true;
  fetchEnhanceTaskListCommand({
    instanceId: props.instanceId,
    param: {}
  }).catch(() => {
    isLoading.value = false;
  });
}

function handleTaskListResult(data: CommandExecuteResponse<EnhanceTaskListResponse>) {
  isLoading.value = false;
  const resp = data.data as EnhanceTaskListResponse | undefined;
  if (!resp || resp.state === 0) return;
  runningTasks.value = resp.runningTasks || [];
  recentTasks.value = resp.recentTasks || [];
}

function formatTaskTime(timestamp: number) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('zh-CN');
}

function taskProgress(task: EnhanceTaskRecord) {
  if (task.times === 0) return 0;
  return Math.round((task.currentTimes / task.times) * 100);
}

// 暴露方法供父组件调用
function refresh() {
  loadTaskList();
}

// 暴露 running tasks 以便父组件更新 currentTimes
function updateRunningTaskTimes(taskId: string, currentTimes: number) {
  const task = runningTasks.value.find(t => t.taskId === taskId);
  if (task) {
    task.currentTimes = currentTimes;
  }
}

defineExpose({ refresh, updateRunningTaskTimes, filteredRunning, filteredRecent });

onMounted(() => {
  eventbus.on('command:enhance-task-list', handleTaskListResult);
  loadTaskList();
});

onUnmounted(() => {
  eventbus.off('command:enhance-task-list', handleTaskListResult);
});
</script>

<template>
  <div v-if="hasData" class="grid grid-cols-1 mb-6 gap-16px lg:grid-cols-2">
    <!-- 进行中的任务 -->
    <NCard size="small" class="enhance-task-card">
      <div class="mb-12px flex items-center gap-8px">
        <div class="enhance-status-dot" />
        <span class="text-13px font-semibold">{{ runningLabel }}</span>
        <NTag size="small" type="success" :bordered="false">{{ filteredRunning.length }}</NTag>
      </div>

      <NEmpty
        v-if="filteredRunning.length === 0"
        description="当前没有进行中的任务"
        size="small"
        class="py-16px"
        :show-icon="false"
      />

      <div v-else class="space-y-8px">
        <div v-for="task in filteredRunning" :key="task.taskId" class="enhance-task-item enhance-task-item--running">
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <div class="truncate text-13px font-medium">
                {{ task.qualifiedClassName }}
              </div>
              <div class="mt-2px text-11px text-gray-400">
                {{ task.methodNames.join(', ') }}() · {{ formatTaskTime(task.createTime) }}
              </div>
            </div>
            <div v-if="task.times > 0" class="ml-12px flex flex-shrink-0 items-center gap-8px">
              <span class="text-12px font-mono">
                <span class="text-success font-semibold">{{ task.currentTimes }}</span>
                <span class="text-gray-500">/{{ task.times }}</span>
              </span>
            </div>
            <div v-else class="ml-12px flex flex-shrink-0 items-center gap-8px">
              <NTag size="tiny" type="success" :bordered="false">持续运行</NTag>
            </div>
          </div>
          <NProgress
            v-if="task.times > 0"
            type="line"
            :percentage="taskProgress(task)"
            :show-indicator="false"
            status="success"
            class="mt-6px"
            :height="3"
          />
        </div>
      </div>
    </NCard>

    <!-- 最近完成的任务 -->
    <NCard size="small" class="enhance-task-card">
      <div class="mb-12px flex items-center gap-8px">
        <div class="i-carbon-checkmark-filled text-14px text-gray-400" />
        <span class="text-13px font-semibold">{{ recentLabel }}</span>
        <NTag size="small" :bordered="false">{{ filteredRecent.length }}</NTag>
      </div>

      <NEmpty
        v-if="filteredRecent.length === 0"
        description="暂无最近完成的任务"
        size="small"
        class="py-16px"
        :show-icon="false"
      />

      <div v-else class="space-y-8px">
        <div v-for="task in filteredRecent" :key="task.taskId" class="enhance-task-item enhance-task-item--recent">
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <div class="truncate text-13px text-gray-300">
                {{ task.qualifiedClassName }}
              </div>
              <div class="mt-2px text-11px text-gray-500">
                {{ task.methodNames.join(', ') }}() · {{ formatTaskTime(task.createTime) }}
              </div>
            </div>
            <div class="ml-12px flex flex-shrink-0 items-center gap-8px">
              <NTag size="tiny" :bordered="false">
                {{ task.times > 0 ? `${task.currentTimes}/${task.times}` : `${task.currentTimes} 次` }}
              </NTag>
            </div>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.enhance-task-card {
  border-radius: 12px;
}

.enhance-status-dot {
  width: 8px;
  height: 8px;
  background-color: rgb(34, 197, 94);
  border-radius: 50%;
  animation: enhance-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes enhance-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.enhance-task-item {
  padding: 10px 12px;
  border-radius: 8px;
  border-left: 3px solid transparent;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
}

.enhance-task-item--running {
  border-left-color: rgb(34, 197, 94);
  background-color: rgba(34, 197, 94, 0.04);

  &:hover {
    background-color: rgba(34, 197, 94, 0.08);
  }
}

.enhance-task-item--recent {
  border-left-color: rgba(156, 163, 175, 0.4);
  background-color: rgba(255, 255, 255, 0.02);

  &:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }
}
</style>
