<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDataTable, NInput, NModal, NSelect, NSpace, NStatistic, NTag } from 'naive-ui';

interface OperationLog {
  id: number;
  timestamp: number;
  userId: number;
  username: string;
  userRole: string;
  operation: string;
  target: string;
  details: string;
  status: 'success' | 'failed';
  ip: string;
  duration: number;
  error?: string;
}

// 操作类型配置
const operationTypes: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  UPDATE_VMOPTION: { label: '修改VmOption', color: 'warning', icon: 'settings' },
  UPDATE_LOGGER: { label: '修改Logger级别', color: 'info', icon: 'bug' },
  TRACE_METHOD: { label: 'Trace方法', color: 'primary', icon: 'search' },
  WATCH_METHOD: { label: 'Watch方法', color: 'info', icon: 'eye' },
  MONITOR_METHOD: { label: 'Monitor方法', color: 'success', icon: 'activity' },
  SEARCH_CLASS: { label: '搜索类', color: 'info', icon: 'search' },
  SEARCH_METHOD: { label: '搜索方法', color: 'info', icon: 'list' },
  VIEW_CLASSLOADER: { label: '查看ClassLoader', color: 'default', icon: 'folder-tree' },
  TT_RECORD: { label: 'TT记录', color: 'info', icon: 'clock' },
  TT_REPLAY: { label: 'TT回放', color: 'primary', icon: 'play-circle' },
  PROFILER_START: { label: 'Profiler采样', color: 'error', icon: 'flame' },
  PROFILER_STOP: { label: 'Profiler停止', color: 'warning', icon: 'square' },
  OGNL_EXECUTE: { label: 'OGNL执行', color: 'warning', icon: 'terminal' },
  THREAD_INTERRUPT: { label: '中断线程', color: 'error', icon: 'ban' },
  JFR_START: { label: 'JFR启动', color: 'primary', icon: 'radio' },
  JFR_STOP: { label: 'JFR停止', color: 'warning', icon: 'square' },
  JFR_DOWNLOAD: { label: 'JFR下载', color: 'success', icon: 'download' },
  JFR_DELETE: { label: 'JFR删除', color: 'error', icon: 'trash-2' },
  STACK_CAPTURE: { label: 'Stack捕获', color: 'info', icon: 'layers' },
  FORCE_GC: { label: '强制GC', color: 'error', icon: 'trash-2' },
  DECOMPILE: { label: '反编译', color: 'warning', icon: 'code' },
  code_edit: { label: '代码编辑', color: 'warning', icon: 'edit-3' },
  hot_swap: { label: '热更新', color: 'info', icon: 'zap' },
  HEAP_DUMP: { label: 'HeapDump', color: 'primary', icon: 'archive' },
  MODIFY_STATIC_FIELD: { label: '修改静态字段', color: 'info', icon: 'file-code' },
  EXPORT_REPORT: { label: '导出报告', color: 'success', icon: 'download' }
};

// 筛选条件
const filters = ref({
  operation: '',
  userId: '',
  status: '',
  timeRange: 'today'
});

// 分页
const currentPage = ref(1);
const pageSize = ref(20);

// 详情模态框
const showDetailModal = ref(false);
const selectedLog = ref<OperationLog | null>(null);

// 操作日志数据
const operationLogs = ref<OperationLog[]>([]);

// 生成模拟数据
function generateMockLogs(): OperationLog[] {
  const now = Date.now();
  const users = [
    { id: 1, username: 'admin', role: 'admin' },
    { id: 2, username: 'operator1', role: 'operator' },
    { id: 3, username: 'dev1', role: 'developer' }
  ];
  const instances = ['prod-app-01', 'prod-app-02', 'test-app-01', 'dev-app-01'];
  const operations = Object.keys(operationTypes);

  const logs: OperationLog[] = [
    {
      id: 1,
      timestamp: now - 5 * 60 * 1000,
      userId: 1,
      username: 'admin',
      userRole: 'admin',
      operation: 'UPDATE_LOGGER',
      target: 'prod-app-01',
      details: '将 com.example.service.UserService 日志级别从 INFO 修改为 DEBUG',
      status: 'success',
      ip: '192.168.1.100',
      duration: 150
    },
    {
      id: 2,
      timestamp: now - 15 * 60 * 1000,
      userId: 2,
      username: 'operator1',
      userRole: 'operator',
      operation: 'TRACE_METHOD',
      target: 'prod-app-02',
      details: 'Trace方法: com.example.controller.OrderController.createOrder()',
      status: 'success',
      ip: '192.168.1.101',
      duration: 5000
    },
    {
      id: 3,
      timestamp: now - 30 * 60 * 1000,
      userId: 1,
      username: 'admin',
      userRole: 'admin',
      operation: 'UPDATE_VMOPTION',
      target: 'prod-app-01',
      details: '修改JVM参数: -Xmx4096m → -Xmx6144m',
      status: 'success',
      ip: '192.168.1.100',
      duration: 200
    },
    {
      id: 4,
      timestamp: now - 1 * 60 * 60 * 1000,
      userId: 3,
      username: 'dev1',
      userRole: 'developer',
      operation: 'STACK_CAPTURE',
      target: 'test-app-01',
      details: '捕获线程栈: http-nio-8080-exec-23 (RUNNABLE)',
      status: 'success',
      ip: '192.168.1.102',
      duration: 300
    },
    {
      id: 5,
      timestamp: now - 2 * 60 * 60 * 1000,
      userId: 1,
      username: 'admin',
      userRole: 'admin',
      operation: 'FORCE_GC',
      target: 'prod-app-02',
      details: '手动触发Full GC',
      status: 'success',
      ip: '192.168.1.100',
      duration: 2500
    },
    {
      id: 6,
      timestamp: now - 3 * 60 * 60 * 1000,
      userId: 2,
      username: 'operator1',
      userRole: 'operator',
      operation: 'DECOMPILE',
      target: 'prod-app-01',
      details: '反编译类: com.example.service.PaymentService',
      status: 'success',
      ip: '192.168.1.101',
      duration: 800
    },
    {
      id: 7,
      timestamp: now - 4 * 60 * 60 * 1000,
      userId: 1,
      username: 'admin',
      userRole: 'admin',
      operation: 'UPDATE_LOGGER',
      target: 'prod-app-02',
      details: '将 com.example.dao 包日志级别从 DEBUG 修改为 WARN',
      status: 'failed',
      ip: '192.168.1.100',
      duration: 100,
      error: '连接超时'
    },
    {
      id: 8,
      timestamp: now - 5 * 60 * 60 * 1000,
      userId: 3,
      username: 'dev1',
      userRole: 'developer',
      operation: 'TRACE_METHOD',
      target: 'dev-app-01',
      details: 'Trace方法: com.example.util.CacheUtil.get()',
      status: 'success',
      ip: '192.168.1.102',
      duration: 3000
    },
    {
      id: 9,
      timestamp: now - 6 * 60 * 60 * 1000,
      userId: 2,
      username: 'operator1',
      userRole: 'operator',
      operation: 'EXPORT_REPORT',
      target: 'prod-app-01',
      details: '导出JVM内存分析报告 (2024-01-15)',
      status: 'success',
      ip: '192.168.1.101',
      duration: 1200
    },
    {
      id: 10,
      timestamp: now - 1 * 24 * 60 * 60 * 1000,
      userId: 1,
      username: 'admin',
      userRole: 'admin',
      operation: 'UPDATE_VMOPTION',
      target: 'prod-app-02',
      details: '修改GC参数: -XX:+UseG1GC → -XX:+UseZGC',
      status: 'success',
      ip: '192.168.1.100',
      duration: 250
    },
    {
      id: 11,
      timestamp: now - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000,
      userId: 2,
      username: 'operator1',
      userRole: 'operator',
      operation: 'STACK_CAPTURE',
      target: 'prod-app-01',
      details: '批量捕获所有HTTP线程栈信息',
      status: 'success',
      ip: '192.168.1.101',
      duration: 5000
    },
    {
      id: 12,
      timestamp: now - 2 * 24 * 60 * 60 * 1000,
      userId: 1,
      username: 'admin',
      userRole: 'admin',
      operation: 'FORCE_GC',
      target: 'test-app-01',
      details: '手动触发Full GC',
      status: 'failed',
      ip: '192.168.1.100',
      duration: 100,
      error: '权限不足'
    },
    {
      id: 13,
      timestamp: now - 3 * 24 * 60 * 60 * 1000,
      userId: 3,
      username: 'dev1',
      userRole: 'developer',
      operation: 'TRACE_METHOD',
      target: 'dev-app-01',
      details: 'Trace方法: com.example.api.RestController.handleRequest()',
      status: 'success',
      ip: '192.168.1.102',
      duration: 4500
    },
    {
      id: 14,
      timestamp: now - 4 * 24 * 60 * 60 * 1000,
      userId: 1,
      username: 'admin',
      userRole: 'admin',
      operation: 'UPDATE_LOGGER',
      target: 'prod-app-01',
      details: '将根日志级别从 INFO 修改为 ERROR',
      status: 'success',
      ip: '192.168.1.100',
      duration: 120
    },
    {
      id: 15,
      timestamp: now - 5 * 24 * 60 * 60 * 1000,
      userId: 2,
      username: 'operator1',
      userRole: 'operator',
      operation: 'DECOMPILE',
      target: 'prod-app-02',
      details: '反编译类: com.example.security.AuthFilter',
      status: 'success',
      ip: '192.168.1.101',
      duration: 900
    }
  ];

  return logs;
}

// 筛选后的日志
const filteredLogs = computed(() => {
  let result = [...operationLogs.value];

  // 操作类型筛选
  if (filters.value.operation) {
    result = result.filter(log => log.operation === filters.value.operation);
  }

  // 用户筛选
  if (filters.value.userId) {
    result = result.filter(log => log.userId.toString() === filters.value.userId);
  }

  // 状态筛选
  if (filters.value.status) {
    result = result.filter(log => log.status === filters.value.status);
  }

  // 时间范围筛选
  if (filters.value.timeRange) {
    const now = Date.now();
    let startTime;

    switch (filters.value.timeRange) {
      case 'today':
        startTime = new Date().setHours(0, 0, 0, 0);
        break;
      case 'week':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = 0;
    }

    result = result.filter(log => log.timestamp >= startTime);
  }

  return result;
});

// 统计数据
const statistics = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0);
  const todayLogs = filteredLogs.value.filter(log => log.timestamp >= today);

  const sensitiveOps = ['UPDATE_VMOPTION', 'UPDATE_LOGGER', 'FORCE_GC'];
  const sensitiveLogs = todayLogs.filter(log => sensitiveOps.includes(log.operation));

  const failedLogs = todayLogs.filter(log => log.status === 'failed');

  const activeUsers = new Set(todayLogs.map(log => log.userId)).size;

  return {
    todayOperations: todayLogs.length,
    sensitiveOperations: sensitiveLogs.length,
    failedOperations: failedLogs.length,
    activeUsers
  };
});

// 分页后的数据
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredLogs.value.slice(start, end);
});

// 格式化时间
function formatLogTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // 其他
  return `${date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
}

// 查看详情
function viewDetail(log: OperationLog) {
  selectedLog.value = log;
  showDetailModal.value = true;
}

// 关闭详情模态框
function closeDetailModal() {
  showDetailModal.value = false;
  selectedLog.value = null;
}

// 刷新数据
function handleRefresh() {
  operationLogs.value = generateMockLogs();
  window.$message?.success('刷新成功');
}

// 导出日志
function handleExport() {
  const headers = ['时间', '操作类型', '操作用户', '角色', '目标实例', '操作详情', '状态', 'IP地址', '耗时(ms)'];
  const rows = filteredLogs.value.map(log => [
    new Date(log.timestamp).toLocaleString('zh-CN'),
    operationTypes[log.operation]?.label || log.operation,
    log.username,
    log.userRole,
    log.target,
    log.details,
    log.status === 'success' ? '成功' : '失败',
    log.ip,
    log.duration.toString()
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `operation-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.$message?.success('导出成功');
}

// 应用筛选
function applyFilters() {
  currentPage.value = 1;
}

// 用户选项
const userOptions = computed(() => {
  const users = new Map<number, { username: string; role: string }>();
  operationLogs.value.forEach(log => {
    if (!users.has(log.userId)) {
      users.set(log.userId, { username: log.username, role: log.userRole });
    }
  });

  return [
    { label: '全部用户', value: '' },
    ...Array.from(users.entries()).map(([id, user]) => ({
      label: `${user.username} (${user.role})`,
      value: id.toString()
    }))
  ];
});

// 操作类型选项
const operationOptions = [
  { label: '全部类型', value: '' },
  ...Object.entries(operationTypes).map(([key, value]) => ({
    label: value.label,
    value: key
  }))
];

// 状态选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' }
];

// 时间范围选项
const timeRangeOptions = [
  { label: '今天', value: 'today' },
  { label: '最近7天', value: 'week' },
  { label: '最近30天', value: 'month' },
  { label: '全部', value: 'all' }
];

// 表格列定义
const columns: DataTableColumns<OperationLog> = [
  {
    title: '时间',
    key: 'timestamp',
    width: 120,
    render(row) {
      return formatLogTime(row.timestamp);
    }
  },
  {
    title: '操作类型',
    key: 'operation',
    width: 140,
    render(row) {
      const opType = operationTypes[row.operation] || { label: row.operation, color: 'default' };
      return h(NTag, { type: opType.color as any, size: 'small' }, { default: () => opType.label });
    }
  },
  {
    title: '操作用户',
    key: 'username',
    width: 150,
    render(row) {
      return h('div', { class: 'flex flex-col' }, [
        h('div', { class: 'font-medium' }, row.username),
        h('div', { class: 'text-xs text-gray-400' }, row.userRole)
      ]);
    }
  },
  {
    title: '目标实例',
    key: 'target',
    width: 140,
    render(row) {
      return h('code', { class: 'px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs' }, row.target);
    }
  },
  {
    title: '操作详情',
    key: 'details',
    ellipsis: { tooltip: true },
    render(row) {
      return h('div', { class: 'flex flex-col gap-1' }, [
        h('div', { class: 'truncate' }, row.details),
        row.error
          ? h('div', { class: 'text-xs text-red-500' }, `错误: ${row.error}`)
          : null,
        h('div', { class: 'text-xs text-gray-400' }, `耗时: ${row.duration}ms | IP: ${row.ip}`)
      ]);
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.status === 'success' ? 'success' : 'error', size: 'small' },
        { default: () => (row.status === 'success' ? '成功' : '失败') }
      );
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center',
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          onClick: () => viewDetail(row)
        },
        { default: () => '查看详情' }
      );
    }
  }
];

onMounted(() => {
  operationLogs.value = generateMockLogs();
});
</script>

<template>
  <div class="h-full flex flex-col gap-4 p-6">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card-wrapper rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
        <NStatistic label="今日操作" :value="statistics.todayOperations">
          <template #prefix>
            <div class="i-carbon-activity text-blue-500 text-xl" />
          </template>
        </NStatistic>
      </div>

      <div class="card-wrapper rounded-xl p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
        <NStatistic label="敏感操作" :value="statistics.sensitiveOperations">
          <template #prefix>
            <div class="i-carbon-warning text-yellow-500 text-xl" />
          </template>
        </NStatistic>
      </div>

      <div class="card-wrapper rounded-xl p-4 bg-gradient-to-br from-red-500/10 to-red-600/5">
        <NStatistic label="失败操作" :value="statistics.failedOperations">
          <template #prefix>
            <div class="i-carbon-close-filled text-red-500 text-xl" />
          </template>
        </NStatistic>
      </div>

      <div class="card-wrapper rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-green-600/5">
        <NStatistic label="活跃用户" :value="statistics.activeUsers">
          <template #prefix>
            <div class="i-carbon-user-multiple text-green-500 text-xl" />
          </template>
        </NStatistic>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="card-wrapper rounded-xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">操作类型</div>
          <NSelect v-model:value="filters.operation" :options="operationOptions" @update:value="applyFilters" />
        </div>

        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">操作用户</div>
          <NSelect v-model:value="filters.userId" :options="userOptions" @update:value="applyFilters" />
        </div>

        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">操作状态</div>
          <NSelect v-model:value="filters.status" :options="statusOptions" @update:value="applyFilters" />
        </div>

        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">时间范围</div>
          <NSelect v-model:value="filters.timeRange" :options="timeRangeOptions" @update:value="applyFilters" />
        </div>

        <div class="flex items-end gap-2">
          <NButton type="primary" class="flex-1" @click="applyFilters">
            <template #icon>
              <div class="i-carbon-filter" />
            </template>
            筛选
          </NButton>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-2">
      <NButton @click="handleRefresh">
        <template #icon>
          <div class="i-carbon-renew" />
        </template>
        刷新
      </NButton>
      <NButton type="success" @click="handleExport">
        <template #icon>
          <div class="i-carbon-download" />
        </template>
        导出日志
      </NButton>
    </div>

    <!-- 操作记录表格 -->
    <div class="card-wrapper rounded-xl flex-1 overflow-hidden">
      <NDataTable
        :columns="columns"
        :data="paginatedLogs"
        :pagination="{
          page: currentPage,
          pageSize: pageSize,
          itemCount: filteredLogs.length,
          showSizePicker: true,
          pageSizes: [10, 20, 50, 100],
          onUpdatePage: (page: number) => {
            currentPage = page;
          },
          onUpdatePageSize: (size: number) => {
            pageSize = size;
            currentPage = 1;
          }
        }"
        :scroll-x="1200"
        striped
      />
    </div>

    <!-- 详情模态框 -->
    <NModal
      v-model:show="showDetailModal"
      preset="card"
      title="操作详情"
      :style="{ width: '600px' }"
      :segmented="{ content: true, footer: 'soft' }"
    >
      <div v-if="selectedLog" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">操作时间</div>
            <div class="font-medium">{{ new Date(selectedLog.timestamp).toLocaleString('zh-CN') }}</div>
          </div>

          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">操作类型</div>
            <NTag :type="operationTypes[selectedLog.operation]?.color as any" size="small">
              {{ operationTypes[selectedLog.operation]?.label || selectedLog.operation }}
            </NTag>
          </div>

          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">操作用户</div>
            <div class="font-medium">{{ selectedLog.username }}</div>
          </div>

          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">用户角色</div>
            <div class="font-medium">{{ selectedLog.userRole }}</div>
          </div>

          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">目标实例</div>
            <code class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{{ selectedLog.target }}</code>
          </div>

          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">状态</div>
            <NTag :type="selectedLog.status === 'success' ? 'success' : 'error'" size="small">
              {{ selectedLog.status === 'success' ? '成功' : '失败' }}
            </NTag>
          </div>

          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">IP地址</div>
            <div class="font-medium">{{ selectedLog.ip }}</div>
          </div>

          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">耗时</div>
            <div class="font-medium">{{ selectedLog.duration }}ms</div>
          </div>
        </div>

        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">操作详情</div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">{{ selectedLog.details }}</div>
        </div>

        <div v-if="selectedLog.error">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">错误信息</div>
          <div class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-sm">
            {{ selectedLog.error }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <NButton @click="closeDetailModal">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.card-wrapper {
  background-color: var(--n-color);
  border: 1px solid var(--n-border-color);
}

:deep(.n-statistic .n-statistic-value__prefix) {
  margin-right: 12px;
}
</style>
