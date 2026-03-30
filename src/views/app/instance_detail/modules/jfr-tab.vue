<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NCard, NInput, NInputNumber, NSelect, NStatistic } from 'naive-ui';
import { fetchJfrStartCommand, fetchJfrStopCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import SvgIcon from '@/components/custom/svg-icon.vue';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { JfrStartResponse } from '@/proto/command/result/JfrStartResponse';
import type { JfrStopResponse } from '@/proto/command/result/JfrStopResponse';

interface Props {
  instanceId: string;
}

const props = defineProps<Props>();

// JFR 录制配置
interface JFRConfig {
  name: string;
  duration: number;
  template: string;
  maxSize: number;
  maxAge: number;
  disk: boolean;
  dumpOnExit: boolean;
}

const jfrConfig = ref<JFRConfig>({
  name: '',
  duration: 60,
  template: 'default',
  maxSize: 100,
  maxAge: 3600,
  disk: true,
  dumpOnExit: false
});

// 录制记录
interface JFRRecording {
  id: number;
  recordingId: string;
  name: string;
  status: string;
  template: string;
  startTime: Date;
  duration: number;
  endTime?: Date;
}

const recordings = ref<JFRRecording[]>([]);
const showEventInfo = ref(false);

let recordingIdCounter = 1;

// 模板选项
const templateOptions = [
  { label: '默认配置', value: 'default' },
  { label: '性能分析', value: 'profile' },
  { label: '连续监控', value: 'continuous' },
  { label: '自定义', value: 'custom' }
];

// 快速操作模板
interface QuickAction {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  duration: number;
}

const quickActions: QuickAction[] = [
  {
    type: 'profile',
    name: '性能分析',
    description: 'CPU、内存、线程分析',
    icon: 'lucide:cpu',
    color: 'blue',
    duration: 60
  },
  {
    type: 'gc',
    name: 'GC分析',
    description: '垃圾回收详细分析',
    icon: 'lucide:trash-2',
    color: 'green',
    duration: 120
  },
  {
    type: 'allocation',
    name: '内存分配',
    description: '对象分配热点分析',
    icon: 'lucide:layers',
    color: 'purple',
    duration: 60
  },
  {
    type: 'io',
    name: 'I/O分析',
    description: '文件和网络I/O',
    icon: 'lucide:hard-drive',
    color: 'warning',
    duration: 90
  }
];

// 事件类型
interface EventType {
  name: string;
  description: string;
  icon: string;
  color: string;
}

const eventTypes: EventType[] = [
  { name: 'CPU', description: 'CPU使用率、上下文切换、线程状态', icon: 'lucide:cpu', color: 'blue' },
  { name: 'GC', description: '垃圾回收、暂停时间、堆统计', icon: 'lucide:trash-2', color: 'green' },
  { name: '内存', description: '对象分配、内存泄漏、堆外内存', icon: 'lucide:database', color: 'purple' },
  { name: 'I/O', description: '文件读写、网络传输、Socket操作', icon: 'lucide:hard-drive', color: 'warning' },
  { name: '锁与同步', description: '锁竞争、死锁、Monitor等待', icon: 'lucide:lock', color: 'error' },
  { name: '代码', description: '方法执行、编译、类加载', icon: 'lucide:code', color: 'info' }
];

// 统计数据
const stats = computed(() => {
  const activeCount = recordings.value.filter(r => r.status === 'RUNNING').length;
  const totalCount = recordings.value.length;
  return { activeCount, totalCount };
});

// JFR 状态
const jfrStatus = computed(() => {
  const running = recordings.value.some(r => r.status === 'RUNNING');
  return running ? '录制中' : '就绪';
});

// 开始快速录制
const startQuickRecording = (action: QuickAction) => {
  const name = `${action.name}-${new Date().toLocaleTimeString('zh-CN')}`;

  fetchJfrStartCommand({
    instanceId: props.instanceId,
    param: {
      name,
      duration: action.duration,
      template: action.type,
      maxSize: 100,
      maxAge: 3600,
      disk: true,
      dumpOnExit: false
    }
  });
};

// 开始自定义录制
const startCustomRecording = () => {
  if (!jfrConfig.value.name.trim()) {
    window.$message?.warning('请输入录制名称');
    return;
  }

  fetchJfrStartCommand({
    instanceId: props.instanceId,
    param: {
      name: jfrConfig.value.name,
      duration: jfrConfig.value.duration,
      template: jfrConfig.value.template,
      maxSize: jfrConfig.value.maxSize,
      maxAge: jfrConfig.value.maxAge,
      disk: jfrConfig.value.disk,
      dumpOnExit: jfrConfig.value.dumpOnExit
    }
  });
};

// 停止录制
const stopRecording = (recording: JFRRecording) => {
  fetchJfrStopCommand({
    instanceId: props.instanceId,
    param: {
      recordingId: recording.recordingId
    }
  });
};

// eventBus 回调 - JFR 启动
function handleJfrStart(response: CommandExecuteResponse<JfrStartResponse>) {
  const data = response.data as JfrStartResponse | undefined;
  if (!data || data.state === 0) {
    if (data?.message) window.$message?.error(data.message);
    return;
  }

  const recording: JFRRecording = {
    id: recordingIdCounter,
    recordingId: data.recordingId,
    name: jfrConfig.value.name || `录制-${recordingIdCounter}`,
    status: data.status || 'RUNNING',
    template: jfrConfig.value.template,
    startTime: new Date(),
    duration: jfrConfig.value.duration
  };

  recordingIdCounter += 1;
  recordings.value.unshift(recording);
  window.$message?.success(`${recording.name} 录制已开始`);
}

// eventBus 回调 - JFR 停止
function handleJfrStop(response: CommandExecuteResponse<JfrStopResponse>) {
  const data = response.data as JfrStopResponse | undefined;
  if (!data || data.state === 0) {
    if (data?.message) window.$message?.error(data.message);
    return;
  }

  const recording = recordings.value.find(r => r.recordingId === data.recordingId);
  if (recording) {
    recording.status = data.status || 'STOPPED';
    recording.endTime = new Date();
    window.$message?.info(`${recording.name} 已停止录制`);
  }
}

onMounted(() => {
  eventBus.on('command:jfr-start', handleJfrStart);
  eventBus.on('command:jfr-stop', handleJfrStop);
});

onUnmounted(() => {
  eventBus.off('command:jfr-start', handleJfrStart);
  eventBus.off('command:jfr-stop', handleJfrStop);
});

// 删除录制
const deleteRecording = (id: number) => {
  const index = recordings.value.findIndex(r => r.id === id);
  if (index !== -1) {
    const recording = recordings.value[index];
    recordings.value.splice(index, 1);
    window.$message?.success(`已删除录制: ${recording.name}`);
  }
};

// 清空所有录制
const clearRecordings = () => {
  recordings.value = [];
  window.$message?.success('已清空所有录制');
};

// 导出录制列表
const exportRecordings = () => {
  if (recordings.value.length === 0) {
    window.$message?.warning('暂无录制数据');
    return;
  }

  const data = JSON.stringify(recordings.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jfr-recordings-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.$message?.success('导出成功');
};

// 重置表单
const resetForm = () => {
  jfrConfig.value = {
    name: '',
    duration: 60,
    template: 'default',
    maxSize: 100,
    maxAge: 3600,
    disk: true,
    dumpOnExit: false
  };
};

// 切换事件信息显示
const toggleEventInfo = () => {
  showEventInfo.value = !showEventInfo.value;
};

// 获取状态图标
const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    RUNNING: 'lucide:play-circle',
    STOPPED: 'lucide:pause-circle',
    CLOSED: 'lucide:x-circle'
  };
  return icons[status] || 'lucide:circle';
};

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN');
};
</script>

<template>
  <div class="h-full flex flex-col gap-16px">
    <!-- 状态卡片 -->
    <div class="grid grid-cols-1 gap-16px lg:grid-cols-3">
      <NCard size="small">
        <NStatistic label="JFR状态" :value="jfrStatus">
          <template #prefix>
            <SvgIcon icon="lucide:radio" class="text-info" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="活动录制" :value="stats.activeCount">
          <template #prefix>
            <SvgIcon icon="lucide:play-circle" class="text-success" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small">
        <NStatistic label="总录制次数" :value="stats.totalCount">
          <template #prefix>
            <SvgIcon icon="lucide:database" class="text-purple" />
          </template>
        </NStatistic>
      </NCard>
    </div>

    <!-- 快速操作 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center gap-8px">
          <SvgIcon icon="lucide:zap" class="text-16px text-info" />
          <span class="font-semibold">快速操作</span>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-16px lg:grid-cols-4 md:grid-cols-2">
        <div
          v-for="action in quickActions"
          :key="action.type"
          class="group cursor-pointer border rounded-8px p-16px transition hover:border-blue/50"
          :class="[`border-${action.color}/30`, `bg-gradient-to-br from-${action.color}/10 to-${action.color}/5`]"
          @click="startQuickRecording(action)"
        >
          <div class="flex items-start gap-12px">
            <div
              class="h-40px w-40px flex flex-shrink-0 items-center justify-center rounded-8px transition group-hover:opacity-80"
              :class="[`bg-${action.color}/20`]"
            >
              <SvgIcon :icon="action.icon" class="text-20px" :class="[`text-${action.color}`]" />
            </div>
            <div class="flex-1">
              <div class="mb-4px text-14px font-semibold">{{ action.name }}</div>
              <div class="text-12px text-gray">{{ action.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 自定义录制配置 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center gap-8px">
          <SvgIcon icon="lucide:settings" class="text-16px text-info" />
          <span class="font-semibold">自定义录制配置</span>
        </div>
      </template>

      <div class="space-y-16px">
        <div class="grid grid-cols-1 gap-16px md:grid-cols-3">
          <div>
            <label class="mb-8px block text-14px font-medium">
              录制名称
              <span class="text-error">*</span>
            </label>
            <NInput v-model:value="jfrConfig.name" placeholder="例如: my-recording" />
          </div>
          <div>
            <label class="mb-8px block text-14px font-medium">
              持续时间 (秒)
              <span class="text-error">*</span>
            </label>
            <NInputNumber v-model:value="jfrConfig.duration" :min="1" placeholder="例如: 60" class="w-full" />
          </div>
          <div>
            <label class="mb-8px block text-14px font-medium">配置模板</label>
            <NSelect v-model:value="jfrConfig.template" :options="templateOptions" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-16px md:grid-cols-2">
          <div>
            <label class="mb-8px block text-14px font-medium">最大文件大小 (MB)</label>
            <NInputNumber v-model:value="jfrConfig.maxSize" :min="1" placeholder="例如: 100" class="w-full" />
          </div>
          <div>
            <label class="mb-8px block text-14px font-medium">最大年龄 (秒)</label>
            <NInputNumber v-model:value="jfrConfig.maxAge" :min="1" placeholder="例如: 3600" class="w-full" />
          </div>
        </div>

        <div class="flex-y-center gap-24px">
          <label class="flex-y-center cursor-pointer gap-8px">
            <input v-model="jfrConfig.disk" type="checkbox" class="h-16px w-16px cursor-pointer rounded" />
            <span class="text-14px text-gray">写入磁盘</span>
          </label>
          <label class="flex-y-center cursor-pointer gap-8px">
            <input v-model="jfrConfig.dumpOnExit" type="checkbox" class="h-16px w-16px cursor-pointer rounded" />
            <span class="text-14px text-gray">退出时转储</span>
          </label>
        </div>

        <div class="flex-y-center gap-12px">
          <NButton type="info" @click="startCustomRecording">
            <template #icon>
              <SvgIcon icon="lucide:play" />
            </template>
            开始录制
          </NButton>
          <NButton @click="resetForm">重置</NButton>
        </div>
      </div>
    </NCard>

    <!-- 录制列表 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:list" class="text-16px text-info" />
            <span class="font-semibold">录制列表</span>
            <span v-if="recordings.length > 0" class="text-12px text-gray">({{ recordings.length }} 个录制)</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NButton size="small" @click="exportRecordings">
              <template #icon>
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="clearRecordings">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="recordings.length === 0" class="py-48px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
        </div>
        <p class="text-14px">暂无活动录制</p>
        <p class="mt-4px text-12px">使用上方快速操作或自定义配置开始录制</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray/20 bg-container/50">
            <tr>
              <th class="px-12px py-8px text-left text-12px text-gray font-medium">ID</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-medium">名称</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-medium">状态</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-medium">配置</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-medium">开始时间</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-medium">持续时间</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-medium">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray/20">
            <tr v-for="recording in recordings" :key="recording.id" class="transition hover:bg-container/30">
              <td class="px-12px py-12px text-12px font-mono">{{ recording.id }}</td>
              <td class="px-12px py-12px text-12px font-semibold">{{ recording.name }}</td>
              <td class="px-12px py-12px text-12px">
                <div class="flex-y-center gap-4px">
                  <SvgIcon :icon="getStatusIcon(recording.status)" class="text-12px" />
                  <span>{{ recording.status }}</span>
                </div>
              </td>
              <td class="px-12px py-12px text-12px text-gray">{{ recording.template }}</td>
              <td class="px-12px py-12px text-12px text-gray font-mono">{{ formatTime(recording.startTime) }}</td>
              <td class="px-12px py-12px text-12px text-gray">{{ recording.duration }}s</td>
              <td class="px-12px py-12px text-12px">
                <div class="flex-y-center gap-8px">
                  <NButton
                    v-if="recording.status === 'RUNNING'"
                    size="tiny"
                    type="warning"
                    @click="stopRecording(recording)"
                  >
                    <template #icon>
                      <SvgIcon icon="lucide:square" />
                    </template>
                    停止
                  </NButton>
                  <NButton size="tiny" type="error" @click="deleteRecording(recording.id)">
                    <template #icon>
                      <SvgIcon icon="lucide:trash-2" />
                    </template>
                    删除
                  </NButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </NCard>

    <!-- 事件类型说明 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:info" class="text-16px text-info" />
            <span class="font-semibold">JFR 事件类型说明</span>
          </div>
          <NButton text @click="toggleEventInfo">
            <template #icon>
              <SvgIcon :icon="showEventInfo ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
            </template>
            {{ showEventInfo ? '收起' : '展开' }}
          </NButton>
        </div>
      </template>

      <div v-if="showEventInfo" class="grid grid-cols-1 gap-16px lg:grid-cols-3 md:grid-cols-2">
        <div
          v-for="event in eventTypes"
          :key="event.name"
          class="border border-gray/20 rounded-8px bg-container/30 p-16px"
        >
          <div class="mb-8px flex-y-center gap-8px">
            <SvgIcon :icon="event.icon" class="text-16px" :class="[`text-${event.color}`]" />
            <div class="text-14px font-semibold">{{ event.name }}</div>
          </div>
          <div class="text-12px text-gray">{{ event.description }}</div>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
