<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps, SelectOption } from 'naive-ui';
import { fetchLoggerInfoCommand, fetchUpdateLoggerLevelCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { LoggerInfoResponse } from '@/proto/command/result/LoggerInfoResponse';
import type { UpdateLoggerLevelResponse } from '@/proto/command/result/UpdateLoggerLevelResponse';

interface Props {
  instanceId: string;
}

interface LoggerRow {
  name: string;
  configuredLevel: string | null;
  effectiveLevel: string;
  additivity: boolean;
  appenders: string[];
  classLoaderHash: string;
}

const props = defineProps<Props>();

const searchText = ref('');
const selectedLevel = ref<string | null>(null);
const loading = ref(false);
const submitting = ref(false);
const loggers = ref<LoggerRow[]>([]);

const levelFilterOptions: SelectOption[] = [
  { label: 'TRACE', value: 'TRACE' },
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARN', value: 'WARN' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'OFF', value: 'OFF' }
];

const showEditModal = ref(false);
const editForm = ref({
  name: '',
  classLoaderHash: '',
  currentLevel: '',
  newLevel: ''
});

const levelOptions: SelectOption[] = [
  { label: 'TRACE - 最详细的日志', value: 'TRACE' },
  { label: 'DEBUG - 调试信息', value: 'DEBUG' },
  { label: 'INFO - 一般信息', value: 'INFO' },
  { label: 'WARN - 警告信息', value: 'WARN' },
  { label: 'ERROR - 错误信息', value: 'ERROR' },
  { label: 'OFF - 关闭日志', value: 'OFF' }
];

const filteredData = computed(() => {
  return loggers.value.filter((logger: LoggerRow) => {
    const matchSearch = !searchText.value || logger.name.toLowerCase().includes(searchText.value.toLowerCase());
    const matchLevel =
      !selectedLevel.value ||
      logger.effectiveLevel === selectedLevel.value ||
      logger.configuredLevel === selectedLevel.value;
    return matchSearch && matchLevel;
  });
});

const levelStats = computed(() => {
  return loggers.value.reduce(
    (stats, logger) => {
      const level = logger.effectiveLevel || 'INFO';
      stats.total += 1;

      if (level === 'ERROR') stats.error += 1;
      if (level === 'WARN') stats.warn += 1;
      if (level === 'INFO') stats.info += 1;
      if (level === 'DEBUG') stats.debug += 1;
      if (level === 'TRACE') stats.trace += 1;

      return stats;
    },
    {
      total: 0,
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      trace: 0
    }
  );
});

const getLevelTagType = (level: string) => {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    TRACE: 'info',
    DEBUG: 'info',
    INFO: 'success',
    WARN: 'warning',
    ERROR: 'error',
    OFF: 'default'
  };
  return map[level] || 'default';
};

const columns: DataTableColumns<LoggerRow> = [
  {
    title: 'Logger 名称',
    key: 'name',
    width: 350,
    ellipsis: {
      tooltip: true
    },
    render: (row: LoggerRow) => {
      return row.name;
    }
  },
  {
    title: '配置级别',
    key: 'configuredLevel',
    width: 120,
    render: (row: LoggerRow) => {
      if (row.configuredLevel) {
        return h(
          NTag,
          { type: getLevelTagType(row.configuredLevel), size: 'small' },
          { default: () => row.configuredLevel }
        );
      }
      return h('span', { class: 'text-gray-500 text-xs' }, '继承');
    }
  },
  {
    title: '有效级别',
    key: 'effectiveLevel',
    width: 120,
    render: (row: LoggerRow) => {
      return h(
        NTag,
        { type: getLevelTagType(row.effectiveLevel), size: 'small' },
        { default: () => row.effectiveLevel || '-' }
      );
    }
  },
  {
    title: 'Additivity',
    key: 'additivity',
    width: 100,
    align: 'center',
    render: (row: LoggerRow) => {
      return h(
        NTag,
        {
          type: row.additivity ? 'success' : 'default',
          size: 'small'
        },
        { default: () => (row.additivity ? 'true' : 'false') }
      );
    }
  },
  {
    title: 'Appenders',
    key: 'appenders',
    width: 200,
    render: (row: LoggerRow) => {
      if (row.appenders.length > 0) {
        return h(
          'div',
          { class: 'flex gap-1 flex-wrap' },
          row.appenders.map(app =>
            h('span', { class: 'px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-mono' }, app)
          )
        );
      }
      return h('span', { class: 'text-gray-500 text-xs' }, '-');
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center',
    render: (row: LoggerRow) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => handleEdit(row)
        },
        { default: () => '修改级别' }
      );
    }
  }
];

const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 50,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
  onChange: (page: number) => {
    pagination.value.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
  },
  prefix: ({ startIndex, endIndex, itemCount }) => {
    return `显示 ${startIndex}-${endIndex} / 共 ${itemCount ?? 0} 条`;
  }
});

function mapLoggerInfo(response: LoggerInfoResponse) {
  loggers.value = (response.loggers || []).map(logger => ({
    name: logger.name,
    configuredLevel: logger.level || null,
    effectiveLevel: logger.effectiveLevel || logger.level || '-',
    additivity: logger.additivity,
    appenders: (logger.appenders || [])
      .map(appender => appender.name || appender.target || appender.file || appender.appenderRef.join(','))
      .filter(Boolean),
    classLoaderHash: logger.classLoaderHash
  }));
}

function createLoggerInfoCommand() {
  loading.value = true;

  fetchLoggerInfoCommand({
    instanceId: props.instanceId,
    param: {
      name: '',
      includeNoAppender: true,
      classLoaderHashCode: ''
    }
  }).catch(() => {
    loading.value = false;
  });
}

function handleLoggerInfo(response: CommandExecuteResponse<LoggerInfoResponse>) {
  loading.value = false;
  const data = response.data as LoggerInfoResponse | undefined;

  if (!data || data.state === 0) {
    if (data?.message) {
      window.$message?.error(data.message);
    }
    return;
  }

  mapLoggerInfo(data);
}

function handleLoggerLevelUpdate(response: CommandExecuteResponse<UpdateLoggerLevelResponse>) {
  submitting.value = false;
  const data = response.data as UpdateLoggerLevelResponse | undefined;

  if (!data || data.state === 0 || !data.success) {
    if (data?.message) {
      window.$message?.error(data.message);
    }
    return;
  }

  loggers.value = loggers.value.map(logger => {
    if (logger.name !== editForm.value.name || logger.classLoaderHash !== editForm.value.classLoaderHash) {
      return logger;
    }

    return {
      ...logger,
      configuredLevel: editForm.value.newLevel,
      effectiveLevel: editForm.value.newLevel
    };
  });

  showEditModal.value = false;
  editForm.value = {
    name: '',
    classLoaderHash: '',
    currentLevel: '',
    newLevel: ''
  };
  window.$message?.success('Logger 级别更新成功');
  createLoggerInfoCommand();
}

const handleEdit = (logger: LoggerRow) => {
  editForm.value = {
    name: logger.name,
    classLoaderHash: logger.classLoaderHash,
    currentLevel: logger.configuredLevel || logger.effectiveLevel,
    newLevel: logger.configuredLevel || logger.effectiveLevel
  };
  showEditModal.value = true;
};

const handleSubmitEdit = () => {
  if (!editForm.value.newLevel) {
    window.$message?.warning('请选择新级别');
    return;
  }

  submitting.value = true;

  fetchUpdateLoggerLevelCommand({
    instanceId: props.instanceId,
    param: {
      classLoaderHashCode: editForm.value.classLoaderHash,
      name: editForm.value.name,
      level: editForm.value.newLevel
    }
  }).catch(() => {
    submitting.value = false;
  });
};

const handleSetAllInfo = () => {
  window.$message?.info('批量修改日志级别后续补充，当前先保留页面样式');
};

const handleSetAllDebug = () => {
  window.$message?.info('批量修改日志级别后续补充，当前先保留页面样式');
};

const handleSetAllWarn = () => {
  window.$message?.info('批量修改日志级别后续补充，当前先保留页面样式');
};

const handleResetDefault = () => {
  window.$message?.info('恢复默认配置能力后续补充，当前先保留页面样式');
};

const handleExport = () => {
  window.$message?.info('导出配置能力后续补充，当前先保留页面样式');
};

const handleRefresh = () => {
  createLoggerInfoCommand();
};

onMounted(() => {
  createLoggerInfoCommand();
  eventBus.on('command:logger-info', handleLoggerInfo);
  eventBus.on('command:logger-level-update', handleLoggerLevelUpdate);
});

onUnmounted(() => {
  eventBus.off('command:logger-info', handleLoggerInfo);
  eventBus.off('command:logger-level-update', handleLoggerLevelUpdate);
});
</script>

<template>
  <div class="logger-container">
    <!-- 日志级别统计 -->
    <NGrid :x-gap="16" :y-gap="16" :cols="6" class="mb-6">
      <NGridItem>
        <NCard class="id-card" size="small">
          <div class="id-stat-content">
            <div class="id-stat-icon bg-blue-500/10">
              <SvgIcon icon="lucide:file-text" class="text-20px text-blue-500" />
            </div>
            <div class="id-stat-info">
              <div class="id-stat-label">总Logger数</div>
              <NSkeleton v-if="loading && loggers.length === 0" text style="width: 60px; height: 24px" />
              <div v-else class="id-stat-value">{{ levelStats.total }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="id-card" size="small">
          <div class="id-stat-content">
            <div class="id-stat-icon bg-red-500/10">
              <SvgIcon icon="lucide:alert-triangle" class="text-20px text-red-500" />
            </div>
            <div class="id-stat-info">
              <div class="id-stat-label">ERROR</div>
              <NSkeleton v-if="loading && loggers.length === 0" text style="width: 40px; height: 24px" />
              <div v-else class="id-stat-value text-red-500">{{ levelStats.error }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="id-card" size="small">
          <div class="id-stat-content">
            <div class="id-stat-icon bg-yellow-500/10">
              <SvgIcon icon="lucide:alert-circle" class="text-20px text-yellow-500" />
            </div>
            <div class="id-stat-info">
              <div class="id-stat-label">WARN</div>
              <NSkeleton v-if="loading && loggers.length === 0" text style="width: 40px; height: 24px" />
              <div v-else class="id-stat-value text-yellow-500">{{ levelStats.warn }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="id-card" size="small">
          <div class="id-stat-content">
            <div class="id-stat-icon bg-green-500/10">
              <SvgIcon icon="lucide:info" class="text-20px text-green-500" />
            </div>
            <div class="id-stat-info">
              <div class="id-stat-label">INFO</div>
              <NSkeleton v-if="loading && loggers.length === 0" text style="width: 40px; height: 24px" />
              <div v-else class="id-stat-value text-green-500">{{ levelStats.info }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="id-card" size="small">
          <div class="id-stat-content">
            <div class="id-stat-icon bg-cyan-500/10">
              <SvgIcon icon="lucide:bug" class="text-20px text-cyan-500" />
            </div>
            <div class="id-stat-info">
              <div class="id-stat-label">DEBUG</div>
              <NSkeleton v-if="loading && loggers.length === 0" text style="width: 40px; height: 24px" />
              <div v-else class="id-stat-value text-cyan-500">{{ levelStats.debug }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="id-card" size="small">
          <div class="id-stat-content">
            <div class="id-stat-icon bg-purple-500/10">
              <SvgIcon icon="lucide:code" class="text-20px text-purple-500" />
            </div>
            <div class="id-stat-info">
              <div class="id-stat-label">TRACE</div>
              <NSkeleton v-if="loading && loggers.length === 0" text style="width: 40px; height: 24px" />
              <div v-else class="id-stat-value text-purple-500">{{ levelStats.trace }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 快速操作 -->
    <NCard class="id-card mb-6">
      <h4 class="id-card-title-lg">
        <SvgIcon icon="lucide:zap" class="text-16px text-orange-500" />
        快速操作
      </h4>
      <div class="quick-actions-buttons">
        <NButton @click="handleSetAllInfo">
          <template #icon>
            <SvgIcon icon="lucide:volume-2" />
          </template>
          全部设为 INFO
        </NButton>
        <NButton @click="handleSetAllDebug">
          <template #icon>
            <SvgIcon icon="lucide:bug" />
          </template>
          全部设为 DEBUG
        </NButton>
        <NButton @click="handleSetAllWarn">
          <template #icon>
            <SvgIcon icon="lucide:alert-circle" />
          </template>
          全部设为 WARN
        </NButton>
        <NButton @click="handleResetDefault">
          <template #icon>
            <SvgIcon icon="lucide:rotate-ccw" />
          </template>
          恢复默认配置
        </NButton>
        <NButton type="primary" @click="handleExport">
          <template #icon>
            <SvgIcon icon="lucide:download" />
          </template>
          导出配置
        </NButton>
      </div>
    </NCard>

    <!-- Logger 列表 -->
    <NCard class="id-table-card">
      <template #header>
        <div class="id-table-header">
          <div class="id-table-title">
            <SvgIcon icon="lucide:list" class="text-16px text-primary" />
            <span>Logger 列表</span>
          </div>
          <div class="id-table-actions">
            <!-- 级别筛选 -->
            <NSelect
              v-model:value="selectedLevel"
              :options="levelFilterOptions"
              placeholder="全部级别"
              clearable
              style="width: 140px"
            />

            <!-- 搜索 -->
            <NInput v-model:value="searchText" placeholder="搜索Logger名称..." clearable style="width: 240px">
              <template #prefix>
                <SvgIcon icon="lucide:search" class="text-14px" />
              </template>
            </NInput>

            <!-- 刷新 -->
            <NButton type="primary" :loading="loading" @click="handleRefresh">
              <template #icon>
                <SvgIcon icon="lucide:refresh-cw" />
              </template>
              刷新
            </NButton>
          </div>
        </div>
      </template>

      <NSkeleton v-if="loading && loggers.length === 0" text :repeat="8" round />
      <NDataTable
        v-else
        :columns="columns"
        :data="filteredData"
        :pagination="pagination"
        :bordered="false"
        :single-line="false"
        :loading="loading"
        class="id-mono-table"
      />
    </NCard>

    <!-- 编辑模态框 -->
    <NModal v-model:show="showEditModal" preset="card" title="修改日志级别" style="width: 600px">
      <NForm :model="editForm" label-placement="top">
        <NFormItem label="Logger 名称">
          <NInput :value="editForm.name" readonly />
        </NFormItem>
        <NFormItem label="当前级别">
          <div class="id-current-value">{{ editForm.currentLevel }}</div>
        </NFormItem>
        <NFormItem label="新级别" required>
          <NSelect v-model:value="editForm.newLevel" :options="levelOptions" placeholder="请选择级别" />
        </NFormItem>
        <div class="id-info-box">
          <div class="mt-2px flex-shrink-0">
            <SvgIcon icon="lucide:info" class="text-16px text-info" />
          </div>
          <div class="flex-1">
            <p class="id-info-box-title">日志级别说明:</p>
            <p class="id-info-box-text">级别从低到高: TRACE &lt; DEBUG &lt; INFO &lt; WARN &lt; ERROR &lt; OFF</p>
            <p class="id-info-box-text">设置为某级别后,该级别及以上级别的日志都会输出</p>
          </div>
        </div>
      </NForm>

      <template #footer>
        <div class="id-modal-footer">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="handleSubmitEdit">确认修改</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="scss">
.logger-container {
  padding: 0;
}

.quick-actions-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
