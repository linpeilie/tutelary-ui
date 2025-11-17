<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NCard, NInput, NInputNumber, NSelect, NStatistic } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  instanceId: string;
}

defineProps<Props>();

// Profiler 配置
interface ProfilerConfig {
  mode: 'cpu' | 'alloc' | 'lock' | 'wall';
  duration: number;
  interval: number;
  format: 'html' | 'svg' | 'jfr' | 'collapsed';
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
  mode: string;
  duration: number;
  interval: number;
  format: string;
  include: string;
  exclude: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  samples: number;
  hotMethods: HotMethod[];
}

interface HotMethod {
  name: string;
  percentage: number;
  samples: number;
}

const sessions = ref<ProfilerSession[]>([]);
const activeProfiling = ref(false);
const currentProgress = ref(0);
const elapsed = ref(0);
const showAdvanced = ref(false);
const showFlamegraph = ref(false);
const selectedSession = ref<ProfilerSession | null>(null);
const flamegraphSearch = ref('');

let sessionIdCounter = 1;
let progressInterval: number | null = null;

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
  const totalSamples = sessions.value.reduce((sum: number, s: ProfilerSession) => sum + s.samples, 0);
  const allHotMethods = sessions.value.flatMap((s: ProfilerSession) => s.hotMethods);
  const hotMethodsCount = new Set(allHotMethods.map((m: HotMethod) => m.name)).size;
  const avgCpu =
    totalSessions > 0
      ? Math.floor(
          sessions.value.reduce((sum: number, s: ProfilerSession) => sum + (s.hotMethods[0]?.percentage || 0), 0) /
            totalSessions
        )
      : 0;

  return { totalSessions, totalSamples, hotMethodsCount, avgCpu };
});

// 生成模拟热点数据
const generateMockHotMethods = (): HotMethod[] => {
  return [
    { name: 'com.example.service.UserService.getUserById', percentage: 35.5, samples: 3550 },
    { name: 'com.example.dao.UserDao.queryById', percentage: 28.3, samples: 2830 },
    { name: 'org.springframework.jdbc.core.JdbcTemplate.query', percentage: 22.1, samples: 2210 },
    { name: 'com.mysql.jdbc.PreparedStatement.executeQuery', percentage: 18.7, samples: 1870 },
    { name: 'com.example.util.JsonUtil.toJson', percentage: 12.4, samples: 1240 },
    { name: 'com.fasterxml.jackson.databind.ObjectMapper.writeValueAsString', percentage: 9.8, samples: 980 },
    { name: 'com.example.cache.RedisCache.get', percentage: 8.2, samples: 820 },
    { name: 'redis.clients.jedis.Jedis.get', percentage: 6.5, samples: 650 },
    { name: 'com.example.validation.UserValidator.validate', percentage: 4.3, samples: 430 },
    { name: 'java.util.regex.Pattern.matches', percentage: 3.1, samples: 310 }
  ];
};

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

// 查看火焰图
const viewFlamegraph = (session: ProfilerSession) => {
  selectedSession.value = session;
  showFlamegraph.value = true;
  flamegraphSearch.value = '';
};

// 停止采样
const stopProfiling = (session: ProfilerSession) => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  activeProfiling.value = false;
  session.endTime = new Date();
  session.totalDuration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
  session.hotMethods = generateMockHotMethods();

  sessions.value.unshift(session);

  // 显示火焰图
  viewFlamegraph(session);

  window.$message?.success(`采样完成，生成火焰图成功 (${session.samples.toLocaleString()} 采样)`);
};

// 开始采样
const startProfiling = () => {
  if (activeProfiling.value) {
    window.$message?.warning('已有采样任务正在进行');
    return;
  }

  activeProfiling.value = true;
  currentProgress.value = 0;
  elapsed.value = 0;

  const session: ProfilerSession = {
    id: sessionIdCounter,
    mode: profilerConfig.value.mode,
    duration: profilerConfig.value.duration,
    interval: profilerConfig.value.interval,
    format: profilerConfig.value.format,
    include: profilerConfig.value.include,
    exclude: profilerConfig.value.exclude,
    startTime: new Date(),
    samples: 0,
    hotMethods: []
  };

  sessionIdCounter += 1;

  // 模拟采样进度
  progressInterval = window.setInterval(() => {
    elapsed.value += 1;
    currentProgress.value = Math.min((elapsed.value / profilerConfig.value.duration) * 100, 100);

    // 模拟采样次数增加
    session.samples += Math.floor(Math.random() * 100) + 50;

    if (elapsed.value >= profilerConfig.value.duration) {
      stopProfiling(session);
    }
  }, 1000);

  window.$message?.success(`开始 ${getModeLabel(session.mode)} 采样，预计 ${session.duration} 秒`);
};

// 手动停止采样
const stopProfilingManually = () => {
  if (!activeProfiling.value || !progressInterval) {
    return;
  }

  const session: ProfilerSession = {
    id: sessionIdCounter - 1,
    mode: profilerConfig.value.mode,
    duration: elapsed.value,
    interval: profilerConfig.value.interval,
    format: profilerConfig.value.format,
    include: profilerConfig.value.include,
    exclude: profilerConfig.value.exclude,
    startTime: new Date(Date.now() - elapsed.value * 1000),
    samples: Math.floor(Math.random() * 5000) + 1000,
    hotMethods: []
  };

  stopProfiling(session);
};

// 加载示例数据
const loadSampleData = () => {
  const sampleSession: ProfilerSession = {
    id: sessionIdCounter,
    mode: 'cpu',
    duration: 60,
    interval: 10,
    format: 'html',
    include: 'com.example.*',
    exclude: 'java.*,sun.*',
    startTime: new Date(Date.now() - 300000),
    endTime: new Date(Date.now() - 240000),
    totalDuration: 60,
    samples: 6240,
    hotMethods: generateMockHotMethods()
  };

  sessionIdCounter += 1;
  sessions.value.unshift(sampleSession);
  window.$message?.success('已加载示例采样数据');
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
  showFlamegraph.value = false;
  selectedSession.value = null;
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

// 下载火焰图
const downloadFlamegraph = (session: ProfilerSession) => {
  window.$message?.success(`火焰图下载功能 (会话 #${session.id})`);
};

// 获取方法颜色类
const getMethodColor = (percentage: number) => {
  if (percentage > 20) return 'from-rose-500 to-orange-500';
  if (percentage > 5) return 'from-yellow-500 to-yellow-600';
  return 'from-blue-500 to-cyan-500';
};

// 搜索过滤火焰图
const filteredMethods = computed(() => {
  if (!selectedSession.value) return [];

  const query = flamegraphSearch.value.toLowerCase().trim();
  if (!query) return selectedSession.value.hotMethods;

  return selectedSession.value.hotMethods.filter((m: HotMethod) => m.name.toLowerCase().includes(query));
});

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
            <NSelect v-model:value="profilerConfig.mode" :options="modeOptions" />
            <p class="mt-4px text-12px text-gray">选择性能分析的目标</p>
          </div>

          <!-- 采样时长 -->
          <div>
            <label class="mb-8px block text-14px font-medium">
              采样时长 (秒)
              <span class="text-error">*</span>
            </label>
            <NInputNumber v-model:value="profilerConfig.duration" :min="10" :max="600" class="w-full" />
            <p class="mt-4px text-12px text-gray">10-600秒，建议60秒以上</p>
          </div>

          <!-- 采样间隔 -->
          <div>
            <label class="mb-8px block text-14px font-medium">采样间隔 (ms)</label>
            <NInputNumber v-model:value="profilerConfig.interval" :min="1" :max="100" class="w-full" />
            <p class="mt-4px text-12px text-gray">采样间隔，越小越精确但开销越大</p>
          </div>

          <!-- 输出格式 -->
          <div>
            <label class="mb-8px block text-14px font-medium">输出格式</label>
            <NSelect v-model:value="profilerConfig.format" :options="formatOptions" />
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
            <!-- 包含的包 -->
            <div>
              <label class="mb-8px block text-14px font-medium">
                包含的包
                <span class="ml-4px text-12px text-gray">(可选)</span>
              </label>
              <NInput v-model:value="profilerConfig.include" placeholder="例如: com.example.*" class="font-mono" />
            </div>

            <!-- 排除的包 -->
            <div>
              <label class="mb-8px block text-14px font-medium">
                排除的包
                <span class="ml-4px text-12px text-gray">(可选)</span>
              </label>
              <NInput v-model:value="profilerConfig.exclude" placeholder="例如: java.*,sun.*" class="font-mono" />
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
          <NButton v-if="activeProfiling" type="error" @click="stopProfilingManually">
            <template #icon>
              <SvgIcon icon="lucide:square" />
            </template>
            停止采样
          </NButton>
          <NButton @click="loadSampleData">
            <template #icon>
              <SvgIcon icon="lucide:file-code" />
            </template>
            加载示例
          </NButton>
          <NButton @click="resetForm">
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
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-16px">
          <div class="flex items-center gap-8px">
            <div class="h-12px w-12px animate-pulse rounded-full bg-error" />
            <span class="text-14px">正在采样...</span>
          </div>
          <div class="text-14px text-gray">
            进度:
            <span class="ml-4px text-error font-semibold">{{ Math.floor(currentProgress) }}%</span>
          </div>
          <div class="text-14px text-gray">
            已采样:
            <span class="ml-4px font-semibold">{{ elapsed }}</span>
            秒
          </div>
        </div>
        <!-- 进度条 -->
        <div class="h-8px w-256px overflow-hidden rounded-full bg-gray/20">
          <div
            class="h-full from-error to-warning bg-gradient-to-r transition-all duration-300"
            :style="{ width: currentProgress + '%' }"
          />
        </div>
      </div>
    </NCard>

    <!-- 采样统计 -->
    <div v-if="sessions.length > 0" class="grid grid-cols-1 gap-16px lg:grid-cols-4">
      <NCard size="small">
        <NStatistic label="总会话数" :value="stats.totalSessions">
          <template #prefix>
            <SvgIcon icon="lucide:activity" class="text-error" />
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">已完成的分析会话</div>
      </NCard>

      <NCard size="small">
        <NStatistic label="总采样次数" :value="stats.totalSamples">
          <template #prefix>
            <SvgIcon icon="lucide:zap" class="text-warning" />
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">累计采样点数量</div>
      </NCard>

      <NCard size="small">
        <NStatistic label="热点方法" :value="stats.hotMethodsCount">
          <template #prefix>
            <SvgIcon icon="lucide:flame" class="text-error" />
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">CPU占用超过5%的方法</div>
      </NCard>

      <NCard size="small">
        <NStatistic label="平均CPU" :value="stats.avgCpu">
          <template #prefix>
            <SvgIcon icon="lucide:cpu" class="text-info" />
          </template>
          <template #suffix>
            <span class="ml-4px text-14px">%</span>
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">采样期间平均占用</div>
      </NCard>
    </div>

    <!-- 火焰图展示 -->
    <NCard v-if="showFlamegraph && selectedSession" size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:flame" class="text-16px text-error" />
            <span class="font-semibold">火焰图</span>
            <span class="text-12px text-gray">
              (会话 #{{ selectedSession.id }}, {{ getModeLabel(selectedSession.mode) }} 模式,
              {{ selectedSession.samples.toLocaleString() }} 采样)
            </span>
          </div>
        </div>
      </template>

      <!-- 搜索框 -->
      <div class="mb-16px">
        <NInput v-model:value="flamegraphSearch" placeholder="搜索方法名...">
          <template #prefix>
            <SvgIcon icon="lucide:search" class="text-14px" />
          </template>
        </NInput>
      </div>

      <!-- 火焰图容器 -->
      <div class="overflow-x-auto rounded-8px bg-black/20 p-16px">
        <div v-if="filteredMethods.length === 0" class="py-32px text-center text-gray">
          <p class="text-14px">未找到匹配的方法</p>
        </div>
        <div v-else class="space-y-8px">
          <div v-for="method in filteredMethods" :key="method.name" class="group cursor-pointer">
            <div class="mb-4px flex-y-center gap-8px">
              <code class="flex-1 text-12px text-gray-400 font-mono">{{ method.name }}</code>
              <span class="text-12px text-error font-semibold">{{ method.percentage }}%</span>
              <span class="text-12px text-gray">({{ method.samples.toLocaleString() }} samples)</span>
            </div>
            <div class="h-32px w-full overflow-hidden rounded-4px bg-gray-800">
              <div
                class="h-full flex-y-center bg-gradient-to-r bg-gradient-to-r px-12px transition-all group-hover:opacity-80"
                :class="[getMethodColor(method.percentage)]"
                :style="{ width: (method.samples / selectedSession.samples) * 100 + '%' }"
              >
                <span class="truncate text-12px text-white font-semibold">
                  {{ method.name.split('.').pop() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图例 -->
      <div class="mt-16px flex-y-center gap-24px text-12px text-gray">
        <div class="flex-y-center gap-8px">
          <div class="h-16px w-16px rounded-4px from-rose-500 to-orange-500 bg-gradient-to-r" />
          <span>CPU密集型 (>20%)</span>
        </div>
        <div class="flex-y-center gap-8px">
          <div class="h-16px w-16px rounded-4px from-yellow-500 to-yellow-600 bg-gradient-to-r" />
          <span>中等占用 (5-20%)</span>
        </div>
        <div class="flex-y-center gap-8px">
          <div class="h-16px w-16px rounded-4px from-blue-500 to-cyan-500 bg-gradient-to-r" />
          <span>轻度占用 (&lt;5%)</span>
        </div>
      </div>
    </NCard>

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
                <span class="text-12px text-gray">{{ formatTime(session.startTime) }}</span>
              </div>
              <div class="text-12px text-gray space-y-4px">
                <div class="flex-y-center gap-16px">
                  <span>
                    采样时长:
                    <span class="text-white">{{ session.totalDuration }}s</span>
                  </span>
                  <span>
                    采样次数:
                    <span class="text-warning">{{ session.samples.toLocaleString() }}</span>
                  </span>
                  <span>
                    热点方法:
                    <span class="text-error">{{ session.hotMethods.length }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="flex-y-center gap-8px">
              <NButton size="small" type="error" @click="viewFlamegraph(session)">
                <template #icon>
                  <SvgIcon icon="lucide:flame" />
                </template>
              </NButton>
              <NButton size="small" @click="downloadFlamegraph(session)">
                <template #icon>
                  <SvgIcon icon="lucide:download" />
                </template>
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
