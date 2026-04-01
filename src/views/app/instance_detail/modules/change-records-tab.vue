<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NInput, NModal, NStatistic } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  instanceId: string;
}

defineProps<Props>();

// 变更记录类型
interface ChangeRecord {
  id: string | number;
  type: 'trace' | 'watch' | 'monitor' | 'timetunnel' | 'profiler' | 'jfr' | 'logger' | 'vmoption' | 'hotswap';
  category: 'enhanced' | 'config' | 'code';
  target: string;
  status: string;
  createTime: number;
  lastUpdateTime: number;
  executeCount?: number;
  originalValue?: string;
  currentValue?: string;
  canPause?: boolean;
  canReset?: boolean;
  canCancel?: boolean;
  canRevert?: boolean;
  config?: any;
  samples?: number;
  duration?: string;
  size?: string;
  affectedMethods?: number;
  reason?: string;
}

const records = ref<ChangeRecord[]>([]);
const activeFilter = ref<'all' | 'enhanced' | 'config' | 'code'>('all');
const searchTerm = ref('');
const showDetailModal = ref(false);
const selectedRecord = ref<ChangeRecord | null>(null);

// 类型配置
const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  trace: { icon: 'lucide:git-branch', color: 'info', label: 'Trace' },
  watch: { icon: 'lucide:eye', color: 'success', label: 'Watch' },
  monitor: { icon: 'lucide:bar-chart-2', color: 'purple', label: 'Monitor' },
  timetunnel: { icon: 'lucide:clock', color: 'indigo', label: 'TimeTunnel' },
  profiler: { icon: 'lucide:flame', color: 'error', label: 'Profiler' },
  jfr: { icon: 'lucide:radio', color: 'info', label: 'JFR' },
  logger: { icon: 'lucide:file-text', color: 'warning', label: 'Logger' },
  vmoption: { icon: 'lucide:settings', color: 'warning', label: 'VMOption' },
  hotswap: { icon: 'lucide:code', color: 'success', label: 'HotSwap' }
};

// 分类配置
const categoryConfig: Record<string, { color: string; label: string }> = {
  enhanced: { color: 'info', label: '增强任务' },
  config: { color: 'warning', label: '配置变更' },
  code: { color: 'success', label: '代码变更' }
};

// 状态配置
const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  running: { color: 'success', icon: 'lucide:play-circle', label: '运行中' },
  RUNNING: { color: 'success', icon: 'lucide:play-circle', label: '运行中' },
  paused: { color: 'warning', icon: 'lucide:pause-circle', label: '已暂停' },
  completed: { color: 'info', icon: 'lucide:check-circle', label: '已完成' },
  STOPPED: { color: 'default', icon: 'lucide:stop-circle', label: '已停止' },
  applied: { color: 'success', icon: 'lucide:check', label: '已应用' },
  success: { color: 'success', icon: 'lucide:check-circle', label: '成功' },
  failed: { color: 'error', icon: 'lucide:x-circle', label: '失败' }
};

// 统计数据
const stats = computed(() => {
  const total = records.value.length;
  const enhanced = records.value.filter((r: ChangeRecord) => r.category === 'enhanced').length;
  const config = records.value.filter((r: ChangeRecord) => r.category === 'config').length;
  const code = records.value.filter((r: ChangeRecord) => r.category === 'code').length;
  const active = records.value.filter(
    (r: ChangeRecord) => r.status === 'running' || r.status === 'RUNNING' || r.status === 'applied'
  ).length;

  return { total, enhanced, config, code, active };
});

// 过滤后的记录
const filteredRecords = computed(() => {
  let result = records.value;

  // 按分类过滤
  if (activeFilter.value !== 'all') {
    result = result.filter((r: ChangeRecord) => r.category === activeFilter.value);
  }

  // 按搜索关键词过滤
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase().trim();
    result = result.filter(
      (r: ChangeRecord) => r.target.toLowerCase().includes(term) || r.type.toLowerCase().includes(term)
    );
  }

  return result;
});

// 加载所有变更记录
const loadChangeRecords = () => {
  const recordMap = new Map<string, ChangeRecord>();

  // 生成示例数据
  const now = Date.now();

  // 1. Trace 记录
  const traceRecords = [
    {
      id: 1,
      type: 'trace' as const,
      category: 'enhanced' as const,
      target: 'com.example.service.UserService.getUserById',
      status: 'running',
      createTime: now - 3600000,
      lastUpdateTime: now - 1800000,
      executeCount: 156,
      canPause: true,
      canReset: true,
      canCancel: true,
      config: {
        condition: 'params[0] > 1000',
        skipJDKMethod: true,
        maxCapture: 200
      }
    },
    {
      id: 2,
      type: 'trace' as const,
      category: 'enhanced' as const,
      target: 'com.example.controller.OrderController.createOrder',
      status: 'paused',
      createTime: now - 7200000,
      lastUpdateTime: now - 3600000,
      executeCount: 89,
      canPause: true,
      canReset: true,
      canCancel: true,
      config: {
        condition: '',
        skipJDKMethod: false,
        maxCapture: 100
      }
    }
  ];

  // 2. Watch 记录
  const watchRecords = [
    {
      id: 1,
      type: 'watch' as const,
      category: 'enhanced' as const,
      target: 'com.example.dao.ProductDao.findProductById',
      status: 'running',
      createTime: now - 5400000,
      lastUpdateTime: now - 900000,
      executeCount: 234,
      canPause: true,
      canReset: true,
      canCancel: true
    }
  ];

  // 3. Monitor 记录
  const monitorRecords = [
    {
      id: 1,
      type: 'monitor' as const,
      category: 'enhanced' as const,
      target: 'com.example.service.PaymentService.processPayment',
      status: 'running',
      createTime: now - 1800000,
      lastUpdateTime: now - 300000,
      executeCount: 1542,
      canPause: true,
      canReset: true,
      canCancel: true
    },
    {
      id: 2,
      type: 'monitor' as const,
      category: 'enhanced' as const,
      target: 'com.example.cache.RedisCache.get',
      status: 'running',
      createTime: now - 900000,
      lastUpdateTime: now - 120000,
      executeCount: 8976,
      canPause: true,
      canReset: true,
      canCancel: true
    }
  ];

  // 4. TimeTunnel 记录
  const ttRecords = [
    {
      id: 1000,
      type: 'timetunnel' as const,
      category: 'enhanced' as const,
      target: 'Index 1000',
      status: 'completed',
      createTime: now - 600000,
      lastUpdateTime: now - 600000,
      executeCount: 1,
      canReset: true,
      canCancel: true
    },
    {
      id: 1001,
      type: 'timetunnel' as const,
      category: 'enhanced' as const,
      target: 'Index 1001',
      status: 'completed',
      createTime: now - 300000,
      lastUpdateTime: now - 300000,
      executeCount: 1,
      canReset: true,
      canCancel: true
    }
  ];

  // 5. Profiler 记录
  const profilerRecords = [
    {
      id: 1,
      type: 'profiler' as const,
      category: 'enhanced' as const,
      target: 'cpu - 60s',
      status: 'completed',
      createTime: now - 7200000,
      lastUpdateTime: now - 7140000,
      executeCount: 6234,
      canReset: true,
      canCancel: true,
      samples: 6234,
      duration: '60s'
    },
    {
      id: 2,
      type: 'profiler' as const,
      category: 'enhanced' as const,
      target: 'alloc - 30s',
      status: 'running',
      createTime: now - 1200000,
      lastUpdateTime: now - 600000,
      executeCount: 3456,
      canPause: true,
      canReset: true,
      canCancel: true,
      samples: 3456,
      duration: '30s'
    }
  ];

  // 6. JFR 记录
  const jfrRecords = [
    {
      id: 1,
      type: 'jfr' as const,
      category: 'enhanced' as const,
      target: 'Production Baseline',
      status: 'RUNNING',
      createTime: now - 10800000,
      lastUpdateTime: now - 5400000,
      canPause: true,
      canCancel: true,
      duration: '3h',
      size: '52MB'
    },
    {
      id: 2,
      type: 'jfr' as const,
      category: 'enhanced' as const,
      target: 'Performance Analysis',
      status: 'STOPPED',
      createTime: now - 14400000,
      lastUpdateTime: now - 10800000,
      canCancel: true,
      duration: '1h',
      size: '78MB'
    }
  ];

  // 7. Logger 级别变更
  const loggerChanges = [
    {
      id: 'logger_1',
      type: 'logger' as const,
      category: 'config' as const,
      target: 'com.example.service',
      status: 'applied',
      createTime: now - 5400000,
      lastUpdateTime: now - 5400000,
      originalValue: 'INFO',
      currentValue: 'DEBUG',
      canRevert: true
    },
    {
      id: 'logger_2',
      type: 'logger' as const,
      category: 'config' as const,
      target: 'org.springframework.web',
      status: 'applied',
      createTime: now - 3600000,
      lastUpdateTime: now - 3600000,
      originalValue: 'WARN',
      currentValue: 'INFO',
      canRevert: true
    },
    {
      id: 'logger_3',
      type: 'logger' as const,
      category: 'config' as const,
      target: 'com.example.dao',
      status: 'applied',
      createTime: now - 1800000,
      lastUpdateTime: now - 1800000,
      originalValue: 'ERROR',
      currentValue: 'DEBUG',
      canRevert: true
    }
  ];

  // 8. VM Option 变更
  const vmOptionChanges = [
    {
      id: 'vmoption_1',
      type: 'vmoption' as const,
      category: 'config' as const,
      target: 'MaxHeapSize',
      status: 'applied',
      createTime: now - 86400000,
      lastUpdateTime: now - 86400000,
      originalValue: '2048m',
      currentValue: '4096m',
      canRevert: true
    },
    {
      id: 'vmoption_2',
      type: 'vmoption' as const,
      category: 'config' as const,
      target: 'PrintGCDetails',
      status: 'applied',
      createTime: now - 43200000,
      lastUpdateTime: now - 43200000,
      originalValue: 'false',
      currentValue: 'true',
      canRevert: true
    }
  ];

  // 9. Hot Swap 记录
  const hotSwapRecords = [
    {
      id: 'hotswap_1',
      type: 'hotswap' as const,
      category: 'code' as const,
      target: 'com.example.controller.UserController',
      status: 'success',
      createTime: now - 7200000,
      lastUpdateTime: now - 7200000,
      canRevert: true,
      affectedMethods: 2
    },
    {
      id: 'hotswap_2',
      type: 'hotswap' as const,
      category: 'code' as const,
      target: 'com.example.service.OrderService',
      status: 'success',
      createTime: now - 3600000,
      lastUpdateTime: now - 3600000,
      canRevert: true,
      affectedMethods: 3
    },
    {
      id: 'hotswap_3',
      type: 'hotswap' as const,
      category: 'code' as const,
      target: 'com.example.util.StringHelper',
      status: 'failed',
      createTime: now - 1800000,
      lastUpdateTime: now - 1800000,
      canRevert: false,
      affectedMethods: 0,
      reason: 'Class version mismatch'
    }
  ];

  // 合并所有记录
  [
    ...traceRecords,
    ...watchRecords,
    ...monitorRecords,
    ...ttRecords,
    ...profilerRecords,
    ...jfrRecords,
    ...loggerChanges,
    ...vmOptionChanges,
    ...hotSwapRecords
  ].forEach(record => {
    const key = `${record.type}_${record.id}`;
    if (!recordMap.has(key) || recordMap.get(key)!.lastUpdateTime < record.lastUpdateTime) {
      recordMap.set(key, record);
    }
  });

  // 转换为数组并按时间排序
  records.value = Array.from(recordMap.values()).sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
};

// 切换筛选器
const setFilter = (filter: 'all' | 'enhanced' | 'config' | 'code') => {
  activeFilter.value = filter;
};

// 刷新记录
const refreshRecords = () => {
  loadChangeRecords();
  window.$message?.success('已刷新变更记录');
};

// 清空所有记录
const clearAllRecords = () => {
  records.value = [];
  window.$message?.success('已清空所有变更记录');
};

// 暂停记录
const pauseRecord = (record: ChangeRecord) => {
  window.$message?.info(`暂停 ${record.target}`);
};

// 恢复记录
const resumeRecord = (record: ChangeRecord) => {
  window.$message?.info(`恢复 ${record.target}`);
};

// 重置记录
const resetRecord = (record: ChangeRecord) => {
  window.$message?.info(`重置 ${record.target}`);
};

// 取消记录
const cancelRecord = (record: ChangeRecord) => {
  const index = records.value.findIndex((r: ChangeRecord) => r.id === record.id && r.type === record.type);
  if (index !== -1) {
    records.value.splice(index, 1);
    window.$message?.success(`已取消 ${record.target}`);
  }
};

// 回滚记录
const revertRecord = (record: ChangeRecord) => {
  window.$message?.info(`回滚 ${record.target}`);
};

// 查看详情
const viewDetail = (record: ChangeRecord) => {
  selectedRecord.value = record;
  showDetailModal.value = true;
};

// 关闭详情弹窗
const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedRecord.value = null;
};

// 获取详情信息
const getDetailInfo = (record: ChangeRecord) => {
  if (record.category === 'enhanced') {
    return `执行: ${record.executeCount || 0}次`;
  }
  if (record.category === 'config') {
    return `${record.originalValue || 'N/A'} → ${record.currentValue || 'N/A'}`;
  }
  if (record.category === 'code') {
    return record.status === 'success' ? '热更新成功' : '热更新失败';
  }
  return '';
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

// 挂载时加载数据
onMounted(() => {
  loadChangeRecords();
});
</script>

<template>
  <div class="h-full flex flex-col gap-16px">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 gap-16px md:grid-cols-5">
      <NCard size="small" class="id-card">
        <NStatistic label="总变更数" :value="stats.total">
          <template #prefix>
            <SvgIcon icon="lucide:database" class="text-purple" />
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">所有类型变更记录</div>
      </NCard>

      <NCard size="small" class="id-card">
        <NStatistic label="增强任务" :value="stats.enhanced">
          <template #prefix>
            <SvgIcon icon="lucide:zap" class="text-info" />
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">Trace/Watch/Monitor等</div>
      </NCard>

      <NCard size="small" class="id-card">
        <NStatistic label="配置变更" :value="stats.config">
          <template #prefix>
            <SvgIcon icon="lucide:settings" class="text-warning" />
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">Logger/VMOption等</div>
      </NCard>

      <NCard size="small" class="id-card">
        <NStatistic label="代码变更" :value="stats.code">
          <template #prefix>
            <SvgIcon icon="lucide:code" class="text-success" />
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">HotSwap热更新</div>
      </NCard>

      <NCard size="small" class="id-card">
        <NStatistic label="活跃变更" :value="stats.active">
          <template #prefix>
            <SvgIcon icon="lucide:activity" class="text-error" />
          </template>
        </NStatistic>
        <div class="mt-4px text-12px text-gray">运行中/已应用</div>
      </NCard>
    </div>

    <!-- 筛选和操作栏 -->
    <NCard size="small" class="id-card">
      <div class="flex flex-col gap-16px md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap items-center gap-8px">
          <NButton :type="activeFilter === 'all' ? 'primary' : 'default'" size="small" @click="setFilter('all')">
            全部变更
          </NButton>
          <NButton
            :type="activeFilter === 'enhanced' ? 'primary' : 'default'"
            size="small"
            @click="setFilter('enhanced')"
          >
            增强任务
          </NButton>
          <NButton :type="activeFilter === 'config' ? 'primary' : 'default'" size="small" @click="setFilter('config')">
            配置变更
          </NButton>
          <NButton :type="activeFilter === 'code' ? 'primary' : 'default'" size="small" @click="setFilter('code')">
            代码变更
          </NButton>
        </div>

        <div class="flex items-center gap-8px">
          <NInput v-model:value="searchTerm" placeholder="搜索目标、类型..." class="w-256px">
            <template #prefix>
              <SvgIcon icon="lucide:search" class="text-14px" />
            </template>
          </NInput>
          <NButton size="small" @click="refreshRecords">
            <template #icon>
              <SvgIcon icon="lucide:refresh-cw" />
            </template>
            刷新
          </NButton>
          <NButton size="small" type="error" @click="clearAllRecords">
            <template #icon>
              <SvgIcon icon="lucide:trash-2" />
            </template>
            清空全部
          </NButton>
        </div>
      </div>
    </NCard>

    <!-- 变更记录表格 -->
    <NCard size="small" class="id-card">
      <div v-if="filteredRecords.length === 0" class="py-48px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
        </div>
        <p class="text-14px">暂无变更记录</p>
        <p class="mt-4px text-12px">开始使用增强功能或修改配置后,记录将显示在这里</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray/20 bg-container/50">
            <tr>
              <th class="px-12px py-8px text-left text-12px text-gray font-semibold uppercase">类型</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-semibold uppercase">分类</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-semibold uppercase">目标</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-semibold uppercase">状态</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-semibold uppercase">创建时间</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-semibold uppercase">最后更新</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-semibold uppercase">详情</th>
              <th class="px-12px py-8px text-left text-12px text-gray font-semibold uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray/20">
            <tr
              v-for="record in filteredRecords"
              :key="`${record.type}_${record.id}`"
              class="transition hover:bg-container/30"
            >
              <td class="px-12px py-12px text-12px">
                <div class="flex-y-center gap-6px">
                  <SvgIcon
                    :icon="typeConfig[record.type]?.icon"
                    class="text-14px"
                    :class="[`text-${typeConfig[record.type]?.color}`]"
                  />
                  <span class="font-semibold">{{ typeConfig[record.type]?.label }}</span>
                </div>
              </td>
              <td class="px-12px py-12px text-12px">
                <span
                  class="rounded-4px px-8px py-4px text-12px font-medium"
                  :class="[
                    `bg-${categoryConfig[record.category]?.color}/20`,
                    `text-${categoryConfig[record.category]?.color}`
                  ]"
                >
                  {{ categoryConfig[record.category]?.label }}
                </span>
              </td>
              <td class="px-12px py-12px text-12px font-mono">{{ record.target }}</td>
              <td class="px-12px py-12px text-12px">
                <div class="flex-y-center gap-4px">
                  <SvgIcon
                    :icon="statusConfig[record.status]?.icon"
                    class="text-12px"
                    :class="[`text-${statusConfig[record.status]?.color}`]"
                  />
                  <span>{{ statusConfig[record.status]?.label }}</span>
                </div>
              </td>
              <td class="px-12px py-12px text-12px text-gray font-mono">{{ formatTime(record.createTime) }}</td>
              <td class="px-12px py-12px text-12px text-gray font-mono">{{ formatTime(record.lastUpdateTime) }}</td>
              <td class="px-12px py-12px text-12px text-gray">{{ getDetailInfo(record) }}</td>
              <td class="px-12px py-12px text-12px">
                <div class="flex-y-center gap-6px">
                  <NButton
                    v-if="record.canPause && record.status === 'running'"
                    size="tiny"
                    type="warning"
                    @click="pauseRecord(record)"
                  >
                    <template #icon>
                      <SvgIcon icon="lucide:pause" />
                    </template>
                    暂停
                  </NButton>
                  <NButton
                    v-if="record.canPause && record.status === 'paused'"
                    size="tiny"
                    type="success"
                    @click="resumeRecord(record)"
                  >
                    <template #icon>
                      <SvgIcon icon="lucide:play" />
                    </template>
                    恢复
                  </NButton>
                  <NButton v-if="record.canReset" size="tiny" @click="resetRecord(record)">
                    <template #icon>
                      <SvgIcon icon="lucide:rotate-ccw" />
                    </template>
                    重置
                  </NButton>
                  <NButton v-if="record.canRevert" size="tiny" type="warning" @click="revertRecord(record)">
                    <template #icon>
                      <SvgIcon icon="lucide:undo" />
                    </template>
                    回滚
                  </NButton>
                  <NButton size="tiny" type="info" @click="viewDetail(record)">
                    <template #icon>
                      <SvgIcon icon="lucide:eye" />
                    </template>
                    详情
                  </NButton>
                  <NButton v-if="record.canCancel" size="tiny" type="error" @click="cancelRecord(record)">
                    <template #icon>
                      <SvgIcon icon="lucide:x" />
                    </template>
                    取消
                  </NButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </NCard>

    <!-- 变更详情弹窗 -->
    <NModal
      v-model:show="showDetailModal"
      preset="card"
      title="变更记录详情"
      class="max-w-4xl w-90%"
      :segmented="{
        content: true,
        footer: 'soft'
      }"
    >
      <template #header-extra>
        <span class="text-12px text-gray">详细信息查看</span>
      </template>

      <div v-if="selectedRecord" class="space-y-16px">
        <!-- 基本信息 -->
        <div class="border border-gray/20 rounded-8px bg-container/50 p-16px">
          <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
            <SvgIcon icon="lucide:info" class="text-16px text-info" />
            基本信息
          </h4>
          <div class="text-12px space-y-10px">
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">记录类型:</span>
              <div class="flex-y-center gap-6px">
                <SvgIcon
                  :icon="typeConfig[selectedRecord.type]?.icon"
                  class="text-14px"
                  :class="[`text-${typeConfig[selectedRecord.type]?.color}`]"
                />
                <span class="font-semibold">{{ typeConfig[selectedRecord.type]?.label }}</span>
              </div>
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">变更分类:</span>
              <span
                class="rounded-4px px-8px py-4px text-12px font-medium"
                :class="[
                  `bg-${categoryConfig[selectedRecord.category]?.color}/20`,
                  `text-${categoryConfig[selectedRecord.category]?.color}`
                ]"
              >
                {{ categoryConfig[selectedRecord.category]?.label }}
              </span>
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">目标:</span>
              <code class="flex-1 rounded-4px bg-black/20 px-8px py-4px text-warning font-mono">
                {{ selectedRecord.target }}
              </code>
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">状态:</span>
              <div class="flex-y-center gap-4px">
                <SvgIcon
                  :icon="statusConfig[selectedRecord.status]?.icon"
                  class="text-12px"
                  :class="[`text-${statusConfig[selectedRecord.status]?.color}`]"
                />
                <span>{{ statusConfig[selectedRecord.status]?.label }}</span>
              </div>
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">创建时间:</span>
              <span class="text-gray-400">{{ formatTime(selectedRecord.createTime) }}</span>
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">最后更新:</span>
              <span class="text-gray-400">{{ formatTime(selectedRecord.lastUpdateTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 增强任务详情 -->
        <div
          v-if="selectedRecord.category === 'enhanced'"
          class="border border-info/30 rounded-8px bg-container/50 p-16px"
        >
          <h4 class="mb-12px flex-y-center gap-8px text-14px text-info font-semibold">
            <SvgIcon icon="lucide:zap" class="text-16px" />
            增强任务详情
          </h4>
          <div class="text-12px space-y-10px">
            <div v-if="selectedRecord.executeCount !== undefined" class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">执行次数:</span>
              <span class="text-info font-semibold">{{ selectedRecord.executeCount }}次</span>
            </div>
            <div v-if="selectedRecord.samples !== undefined" class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">采样数:</span>
              <span class="text-gray-400">{{ selectedRecord.samples }}</span>
            </div>
            <div v-if="selectedRecord.duration" class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">持续时间:</span>
              <span class="text-gray-400">{{ selectedRecord.duration }}</span>
            </div>
            <div v-if="selectedRecord.size" class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">数据大小:</span>
              <span class="text-gray-400">{{ selectedRecord.size }}</span>
            </div>
            <div v-if="selectedRecord.config" class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">配置信息:</span>
              <div class="flex-1 rounded-6px bg-black/20 p-12px">
                <pre class="text-11px text-gray-300 font-mono">{{
                  JSON.stringify(selectedRecord.config, null, 2)
                }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 配置变更详情 -->
        <div
          v-if="selectedRecord.category === 'config'"
          class="border border-warning/30 rounded-8px bg-container/50 p-16px"
        >
          <h4 class="mb-12px flex-y-center gap-8px text-14px text-warning font-semibold">
            <SvgIcon icon="lucide:settings" class="text-16px" />
            配置变更详情
          </h4>
          <div class="text-12px space-y-10px">
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">原始值:</span>
              <code class="flex-1 rounded-4px bg-black/20 px-8px py-4px text-gray-400 font-mono">
                {{ selectedRecord.originalValue || 'N/A' }}
              </code>
            </div>
            <div class="flex items-center justify-center py-4px">
              <SvgIcon icon="lucide:arrow-down" class="text-20px text-warning" />
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">当前值:</span>
              <code class="flex-1 rounded-4px bg-warning/10 px-8px py-4px text-warning font-mono">
                {{ selectedRecord.currentValue || 'N/A' }}
              </code>
            </div>
          </div>
        </div>

        <!-- 代码变更详情 -->
        <div
          v-if="selectedRecord.category === 'code'"
          class="border rounded-8px bg-container/50 p-16px"
          :class="[selectedRecord.status === 'success' ? 'border-success/30' : 'border-error/30']"
        >
          <h4
            class="mb-12px flex-y-center gap-8px text-14px font-semibold"
            :class="[selectedRecord.status === 'success' ? 'text-success' : 'text-error']"
          >
            <SvgIcon icon="lucide:code" class="text-16px" />
            代码变更详情
          </h4>
          <div class="text-12px space-y-10px">
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">变更状态:</span>
              <div class="flex-y-center gap-4px">
                <SvgIcon
                  :icon="statusConfig[selectedRecord.status]?.icon"
                  class="text-14px"
                  :class="[`text-${statusConfig[selectedRecord.status]?.color}`]"
                />
                <span :class="[selectedRecord.status === 'success' ? 'text-success' : 'text-error']">
                  {{ selectedRecord.status === 'success' ? '热更新成功' : '热更新失败' }}
                </span>
              </div>
            </div>
            <div v-if="selectedRecord.affectedMethods !== undefined" class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">影响方法数:</span>
              <span class="text-gray-400">{{ selectedRecord.affectedMethods }}个</span>
            </div>
            <div v-if="selectedRecord.reason" class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">失败原因:</span>
              <div class="flex-1 rounded-6px bg-error/10 p-12px">
                <div class="text-error">{{ selectedRecord.reason }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-12px">
          <NButton
            v-if="selectedRecord?.canPause && selectedRecord.status === 'running'"
            type="warning"
            @click="pauseRecord(selectedRecord)"
          >
            <template #icon>
              <SvgIcon icon="lucide:pause" />
            </template>
            暂停任务
          </NButton>
          <NButton
            v-if="selectedRecord?.canPause && selectedRecord.status === 'paused'"
            type="success"
            @click="resumeRecord(selectedRecord)"
          >
            <template #icon>
              <SvgIcon icon="lucide:play" />
            </template>
            恢复任务
          </NButton>
          <NButton v-if="selectedRecord?.canRevert" type="warning" @click="revertRecord(selectedRecord)">
            <template #icon>
              <SvgIcon icon="lucide:undo" />
            </template>
            回滚变更
          </NButton>
          <NButton @click="closeDetailModal">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped></style>
