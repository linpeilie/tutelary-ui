<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NCard, NInput, NInputNumber, NModal, NSelect, NStatistic } from 'naive-ui';
import { fetchProfilerStartCommand, fetchProfilerStopCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import SvgIcon from '@/components/custom/svg-icon.vue';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { ProfilerStartResponse } from '@/proto/command/result/ProfilerStartResponse';
import type { ProfilerStopResponse } from '@/proto/command/result/ProfilerStopResponse';

interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

// Profiler 配置
interface ProfilerConfig {
  mode: string;
  duration: number;
  interval: number;
  format: string;
  include: string;
  exclude: string;
}

const profilerConfig = ref<ProfilerConfig>({
  mode: 'cpu',
  duration: 60,
  interval: 10,
  format: 'html',
  include: '',
  exclude: ''
});

// 采样会话
interface ProfilerSession {
  id: number;
  sessionId: string;
  mode: string;
  duration: number;
  format: string;
  startTime: Date;
  endTime?: Date;
  status: string;
  resultData?: string;
}

const sessions = ref<ProfilerSession[]>([]);
const activeProfiling = ref(false);
const activeSessionId = ref('');
const showAdvanced = ref(false);

let sessionIdCounter = 1;

// 采样模式选项
const modeOptions = [
  { label: 'CPU 采样', value: 'cpu' },
  { label: '内存分配', value: 'alloc' },
  { label: '锁竞争', value: 'lock' },
  { label: 'Wall-Clock', value: 'wall' }
];

// 输出格式选项
const formatOptions = [
  { label: 'HTML (交互式火焰图)', value: 'html' },
  { label: 'SVG (静态火焰图)', value: 'svg' },
  { label: 'JFR (Java Flight Recorder)', value: 'jfr' },
  { label: 'Collapsed Stacks', value: 'collapsed' }
];

// 统计数据
const stats = computed(() => {
  const totalSessions = sessions.value.length;
  const running = sessions.value.filter(s => s.status === 'RUNNING').length;
  const completed = sessions.value.filter(s => s.status === 'STOPPED').length;
  return { totalSessions, running, completed };
});

// 获取模式标签
const getModeLabel = (mode: string) => {
  const labels: Record<string, string> = {
    cpu: 'CPU采样',
    alloc: '内存分配',
    lock: '锁竞争',
    wall: 'Wall-Clock'
  };
  return labels[mode] || mode;
};

// 开始采样
const startProfiling = () => {
  if (activeProfiling.value) {
    window.$message?.warning('已有采样任务正在进行');
    return;
  }

  activeProfiling.value = true;

  fetchProfilerStartCommand({
    instanceId: props.instanceId,
    param: {
      mode: profilerConfig.value.mode,
      duration: profilerConfig.value.duration,
      interval: profilerConfig.value.interval,
      format: profilerConfig.value.format,
      include: profilerConfig.value.include,
      exclude: profilerConfig.value.exclude
    }
  }).catch(() => {
    activeProfiling.value = false;
  });
};

// 手动停止采样
const stopProfiling = () => {
  if (!activeProfiling.value || !activeSessionId.value) return;

  fetchProfilerStopCommand({
    instanceId: props.instanceId,
    param: {
      sessionId: activeSessionId.value
    }
  });
};

// eventBus 回调 - 启动成功
function handleProfilerStart(response: CommandExecuteResponse<ProfilerStartResponse>) {
  const data = response.data as ProfilerStartResponse | undefined;
  if (!data || data.state === 0) {
    if (data?.message) window.$message?.error(data.message);
    activeProfiling.value = false;
    return;
  }

  activeSessionId.value = data.sessionId;
  const session: ProfilerSession = {
    id: sessionIdCounter,
    sessionId: data.sessionId,
    mode: profilerConfig.value.mode,
    duration: profilerConfig.value.duration,
    format: profilerConfig.value.format,
    startTime: new Date(),
    status: data.status || 'RUNNING'
  };

  sessionIdCounter += 1;
  sessions.value.unshift(session);
  window.$message?.success(`开始 ${getModeLabel(session.mode)} 采样`);
}

// eventBus 回调 - 停止完成
function handleProfilerStop(response: CommandExecuteResponse<ProfilerStopResponse>) {
  const data = response.data as ProfilerStopResponse | undefined;
  if (!data || data.state === 0) {
    if (data?.message) window.$message?.error(data.message);
    return;
  }

  activeProfiling.value = false;
  activeSessionId.value = '';

  const session = sessions.value.find(s => s.sessionId === data.sessionId);
  if (session) {
    session.status = data.status || 'STOPPED';
    session.endTime = new Date();
    session.resultData = data.resultData;
  }

  window.$message?.success('采样完成');
}

onMounted(() => {
  eventBus.on('command:profiler-start', handleProfilerStart);
  eventBus.on('command:profiler-stop', handleProfilerStop);
});

onUnmounted(() => {
  eventBus.off('command:profiler-start', handleProfilerStart);
  eventBus.off('command:profiler-stop', handleProfilerStop);
});

// 结果查看
const showResultModal = ref(false);
const selectedSession = ref<ProfilerSession | null>(null);

const viewResult = (session: ProfilerSession) => {
  selectedSession.value = session;
  showResultModal.value = true;
};

const downloadResult = (session: ProfilerSession) => {
  if (!session.resultData) return;

  const mimeTypes: Record<string, string> = {
    html: 'text/html',
    svg: 'image/svg+xml'
  };
  const extensions: Record<string, string> = {
    html: 'html',
    svg: 'svg'
  };

  const mime = mimeTypes[session.format] || 'application/octet-stream';
  const ext = extensions[session.format] || session.format;
  const blob = new Blob([session.resultData], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `profiler-${session.mode}-${session.sessionId}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

// 重置表单
const resetForm = () => {
  profilerConfig.value = {
    mode: 'cpu',
    duration: 60,
    interval: 10,
    format: 'html',
    include: '',
    exclude: ''
  };
};

// 清空会话
const clearSessions = () => {
  sessions.value = [];
  window.$message?.success('已清空所有会话');
};

// 导出会话
const exportSessions = () => {
  if (sessions.value.length === 0) {
    window.$message?.warning('暂无会话数据');
    return;
  }

  const data = JSON.stringify(sessions.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `profiler-sessions-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.$message?.success('导出成功');
};

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN');
};
</script>

<template>
  <div class="h-full flex flex-col gap-16px">
    <!-- Profiler 配置表单 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center gap-8px">
          <SvgIcon icon="lucide:flame" class="text-16px text-error" />
          <span class="font-semibold">性能分析配置 (Profiler)</span>
        </div>
      </template>

      <div class="space-y-16px">
        <div class="grid grid-cols-1 gap-16px md:grid-cols-2">
          <!-- 采样模式 -->
          <div>
            <label class="mb-8px block text-14px font-medium">
              采样模式
              <span class="text-error">*</span>
            </label>
            <NSelect v-model:value="profilerConfig.mode" :options="modeOptions" :disabled="activeProfiling" />
            <p class="mt-4px text-12px text-gray">选择性能分析的目标</p>
          </div>

          <!-- 采样时长 -->
          <div>
            <label class="mb-8px block text-14px font-medium">
              采样时长 (秒)
              <span class="text-error">*</span>
            </label>
            <NInputNumber
              v-model:value="profilerConfig.duration"
              :min="10"
              :max="600"
              class="w-full"
              :disabled="activeProfiling"
            />
            <p class="mt-4px text-12px text-gray">10-600秒，建议60秒以上</p>
          </div>

          <!-- 采样间隔 -->
          <div>
            <label class="mb-8px block text-14px font-medium">采样间隔 (ms)</label>
            <NInputNumber
              v-model:value="profilerConfig.interval"
              :min="1"
              :max="100"
              class="w-full"
              :disabled="activeProfiling"
            />
            <p class="mt-4px text-12px text-gray">采样间隔，越小越精确但开销越大</p>
          </div>

          <!-- 输出格式 -->
          <div>
            <label class="mb-8px block text-14px font-medium">输出格式</label>
            <NSelect v-model:value="profilerConfig.format" :options="formatOptions" :disabled="activeProfiling" />
          </div>
        </div>

        <!-- 高级选项 -->
        <div class="border-t border-gray/20 pt-16px">
          <div class="mb-12px flex-y-center cursor-pointer gap-8px" @click="showAdvanced = !showAdvanced">
            <SvgIcon
              :icon="showAdvanced ? 'lucide:chevron-down' : 'lucide:chevron-right'"
              class="text-14px text-gray"
            />
            <span class="text-14px text-gray font-medium">高级选项</span>
          </div>
          <div v-if="showAdvanced" class="grid grid-cols-1 gap-16px md:grid-cols-2">
            <div>
              <label class="mb-8px block text-14px font-medium">
                包含的包
                <span class="ml-4px text-12px text-gray">(可选)</span>
              </label>
              <NInput
                v-model:value="profilerConfig.include"
                placeholder="例如: com.example.*"
                class="font-mono"
                :disabled="activeProfiling"
              />
            </div>
            <div>
              <label class="mb-8px block text-14px font-medium">
                排除的包
                <span class="ml-4px text-12px text-gray">(可选)</span>
              </label>
              <NInput
                v-model:value="profilerConfig.exclude"
                placeholder="例如: java.*,sun.*"
                class="font-mono"
                :disabled="activeProfiling"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex-y-center gap-12px pt-8px">
          <NButton type="error" :disabled="activeProfiling" @click="startProfiling">
            <template #icon>
              <SvgIcon icon="lucide:play" />
            </template>
            开始采样
          </NButton>
          <NButton v-if="activeProfiling" type="error" @click="stopProfiling">
            <template #icon>
              <SvgIcon icon="lucide:square" />
            </template>
            停止采样
          </NButton>
          <NButton :disabled="activeProfiling" @click="resetForm">
            <template #icon>
              <SvgIcon icon="lucide:rotate-ccw" />
            </template>
            重置
          </NButton>
        </div>
      </div>
    </NCard>

    <!-- 采样状态 -->
    <NCard v-if="activeProfiling" size="small" class="border-error/30 bg-error/5">
      <div class="flex items-center gap-16px">
        <div class="flex items-center gap-8px">
          <div class="h-12px w-12px animate-pulse rounded-full bg-error" />
          <span class="text-14px">正在采样...</span>
        </div>
        <div class="text-14px text-gray">
          模式:
          <span class="ml-4px text-error font-semibold">{{ getModeLabel(profilerConfig.mode) }}</span>
        </div>
        <div class="text-14px text-gray">
          预计时长:
          <span class="ml-4px font-semibold">{{ profilerConfig.duration }}</span>
          秒
        </div>
      </div>
    </NCard>

    <!-- 采样统计 -->
    <div v-if="sessions.length > 0" class="grid grid-cols-1 gap-16px lg:grid-cols-3">
      <NCard size="small">
        <NStatistic label="总会话数" :value="stats.totalSessions">
          <template #prefix>
            <SvgIcon icon="lucide:activity" class="text-error" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="运行中" :value="stats.running">
          <template #prefix>
            <SvgIcon icon="lucide:play-circle" class="text-success" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="已完成" :value="stats.completed">
          <template #prefix>
            <SvgIcon icon="lucide:check-circle" class="text-info" />
          </template>
        </NStatistic>
      </NCard>
    </div>

    <!-- 会话历史 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:list" class="text-16px text-error" />
            <span class="font-semibold">分析会话</span>
            <span v-if="sessions.length > 0" class="text-12px text-gray">({{ sessions.length }} 个会话)</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NButton size="small" @click="exportSessions">
              <template #icon>
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="clearSessions">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="sessions.length === 0" class="py-48px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
        </div>
        <p class="text-14px">暂无分析会话</p>
        <p class="mt-4px text-12px">填写配置并点击"开始采样"</p>
      </div>

      <div v-else class="space-y-12px">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="border border-gray/20 rounded-8px bg-container/50 p-16px transition hover:border-error/50"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-8px flex-y-center gap-8px">
                <span class="text-12px text-gray font-mono">#{{ session.id }}</span>
                <span class="rounded-4px bg-error/20 px-8px py-4px text-12px text-error font-semibold">
                  {{ getModeLabel(session.mode) }}
                </span>
                <span
                  class="rounded-4px px-8px py-4px text-12px"
                  :class="session.status === 'RUNNING' ? 'bg-success/20 text-success' : 'bg-info/20 text-info'"
                >
                  {{ session.status }}
                </span>
                <span class="text-12px text-gray">{{ formatTime(session.startTime) }}</span>
              </div>
              <div class="text-12px text-gray space-y-4px">
                <div class="flex-y-center gap-16px">
                  <span>
                    SessionId:
                    <span class="font-mono">{{ session.sessionId }}</span>
                  </span>
                  <span>
                    时长:
                    <span class="text-white">{{ session.duration }}s</span>
                  </span>
                  <span>
                    格式:
                    <span>{{ session.format }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="session.status === 'STOPPED' && session.resultData" class="flex-y-center gap-8px">
              <NButton size="small" type="info" @click="viewResult(session)">
                <template #icon>
                  <SvgIcon icon="lucide:eye" />
                </template>
                查看
              </NButton>
              <NButton size="small" type="success" @click="downloadResult(session)">
                <template #icon>
                  <SvgIcon icon="lucide:download" />
                </template>
                下载
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 结果渲染 Modal -->
    <NModal
      v-model:show="showResultModal"
      preset="card"
      :title="`采样结果 - ${selectedSession ? getModeLabel(selectedSession.mode) : ''}`"
      style="width: 95vw; height: 90vh"
      :body-style="{ padding: 0, height: 'calc(90vh - 60px)' }"
    >
      <template #header-extra>
        <NButton
          v-if="selectedSession"
          size="small"
          type="success"
          class="mr-8px"
          @click="downloadResult(selectedSession)"
        >
          <template #icon>
            <SvgIcon icon="lucide:download" />
          </template>
          下载
        </NButton>
      </template>
      <iframe
        v-if="selectedSession?.resultData"
        :srcdoc="selectedSession.resultData"
        sandbox="allow-scripts allow-same-origin"
        class="size-full border-none"
      />
    </NModal>
  </div>
</template>

<style scoped></style>
