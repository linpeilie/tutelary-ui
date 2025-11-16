<script setup lang="ts">
import { computed, h, ref } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  NSelect,
  NTag
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';

// Props
interface Props {
  instanceId: string;
}

defineProps<Props>();

// 日志级别统计
const levelStats = ref({
  total: 68,
  error: 3,
  warn: 8,
  info: 42,
  debug: 12,
  trace: 3
});

// 搜索和筛选
const searchText = ref('');
const selectedLevel = ref<string | null>(null);

const levelFilterOptions = [
  { label: '全部级别', value: null },
  { label: 'TRACE', value: 'TRACE' },
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARN', value: 'WARN' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'OFF', value: 'OFF' }
];

// Logger 数据
interface Logger {
  name: string;
  configuredLevel: string | null;
  effectiveLevel: string;
  additivity: boolean;
  appenders: string[];
}

const loggers = ref<Logger[]>([
  { name: 'ROOT', configuredLevel: 'INFO', effectiveLevel: 'INFO', additivity: false, appenders: ['console', 'file'] },
  {
    name: 'com.example',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: ['file']
  },
  {
    name: 'com.example.controller',
    configuredLevel: 'DEBUG',
    effectiveLevel: 'DEBUG',
    additivity: true,
    appenders: []
  },
  {
    name: 'com.example.controller.UserController',
    configuredLevel: null,
    effectiveLevel: 'DEBUG',
    additivity: true,
    appenders: []
  },
  {
    name: 'com.example.controller.OrderController',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  {
    name: 'com.example.service',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  {
    name: 'com.example.service.UserService',
    configuredLevel: 'DEBUG',
    effectiveLevel: 'DEBUG',
    additivity: true,
    appenders: ['user-service']
  },
  {
    name: 'com.example.service.OrderService',
    configuredLevel: null,
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  {
    name: 'com.example.repository',
    configuredLevel: 'WARN',
    effectiveLevel: 'WARN',
    additivity: true,
    appenders: []
  },
  {
    name: 'com.example.repository.UserRepository',
    configuredLevel: null,
    effectiveLevel: 'WARN',
    additivity: true,
    appenders: []
  },
  { name: 'com.example.util', configuredLevel: 'ERROR', effectiveLevel: 'ERROR', additivity: true, appenders: [] },
  { name: 'com.example.config', configuredLevel: 'INFO', effectiveLevel: 'INFO', additivity: true, appenders: [] },
  {
    name: 'org.springframework',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  {
    name: 'org.springframework.boot',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  {
    name: 'org.springframework.web',
    configuredLevel: 'DEBUG',
    effectiveLevel: 'DEBUG',
    additivity: true,
    appenders: []
  },
  {
    name: 'org.springframework.security',
    configuredLevel: 'WARN',
    effectiveLevel: 'WARN',
    additivity: true,
    appenders: []
  },
  {
    name: 'org.springframework.data',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  {
    name: 'org.springframework.transaction',
    configuredLevel: 'DEBUG',
    effectiveLevel: 'DEBUG',
    additivity: true,
    appenders: []
  },
  { name: 'org.hibernate', configuredLevel: 'WARN', effectiveLevel: 'WARN', additivity: true, appenders: [] },
  {
    name: 'org.hibernate.SQL',
    configuredLevel: 'DEBUG',
    effectiveLevel: 'DEBUG',
    additivity: true,
    appenders: ['sql']
  },
  {
    name: 'org.hibernate.type',
    configuredLevel: 'TRACE',
    effectiveLevel: 'TRACE',
    additivity: true,
    appenders: []
  },
  {
    name: 'org.hibernate.cache',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  {
    name: 'org.apache.catalina',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  { name: 'org.apache.tomcat', configuredLevel: 'INFO', effectiveLevel: 'INFO', additivity: true, appenders: [] },
  { name: 'org.apache.coyote', configuredLevel: 'WARN', effectiveLevel: 'WARN', additivity: true, appenders: [] },
  { name: 'com.zaxxer.hikari', configuredLevel: 'INFO', effectiveLevel: 'INFO', additivity: true, appenders: [] },
  {
    name: 'com.zaxxer.hikari.pool',
    configuredLevel: 'DEBUG',
    effectiveLevel: 'DEBUG',
    additivity: true,
    appenders: []
  },
  {
    name: 'redis.clients.jedis',
    configuredLevel: 'WARN',
    effectiveLevel: 'WARN',
    additivity: true,
    appenders: []
  },
  { name: 'io.lettuce', configuredLevel: 'INFO', effectiveLevel: 'INFO', additivity: true, appenders: [] },
  { name: 'org.mybatis', configuredLevel: 'DEBUG', effectiveLevel: 'DEBUG', additivity: true, appenders: [] },
  {
    name: 'org.apache.ibatis',
    configuredLevel: 'TRACE',
    effectiveLevel: 'TRACE',
    additivity: true,
    appenders: []
  },
  { name: 'com.alibaba.druid', configuredLevel: 'INFO', effectiveLevel: 'INFO', additivity: true, appenders: [] },
  {
    name: 'com.netflix.discovery',
    configuredLevel: 'WARN',
    effectiveLevel: 'WARN',
    additivity: true,
    appenders: []
  },
  {
    name: 'com.netflix.eureka',
    configuredLevel: 'WARN',
    effectiveLevel: 'WARN',
    additivity: true,
    appenders: []
  },
  { name: 'org.apache.kafka', configuredLevel: 'INFO', effectiveLevel: 'INFO', additivity: true, appenders: [] },
  {
    name: 'org.apache.zookeeper',
    configuredLevel: 'ERROR',
    effectiveLevel: 'ERROR',
    additivity: true,
    appenders: []
  },
  { name: 'io.netty', configuredLevel: 'WARN', effectiveLevel: 'WARN', additivity: true, appenders: [] },
  {
    name: 'com.fasterxml.jackson',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: []
  },
  {
    name: 'org.quartz',
    configuredLevel: 'INFO',
    effectiveLevel: 'INFO',
    additivity: true,
    appenders: ['scheduler']
  },
  {
    name: 'springfox.documentation',
    configuredLevel: 'WARN',
    effectiveLevel: 'WARN',
    additivity: true,
    appenders: []
  }
]);

// 编辑模态框
const showEditModal = ref(false);
const editForm = ref({
  name: '',
  currentLevel: '',
  newLevel: ''
});

const levelOptions = [
  { label: 'TRACE - 最详细的日志', value: 'TRACE' },
  { label: 'DEBUG - 调试信息', value: 'DEBUG' },
  { label: 'INFO - 一般信息', value: 'INFO' },
  { label: 'WARN - 警告信息', value: 'WARN' },
  { label: 'ERROR - 错误信息', value: 'ERROR' },
  { label: 'OFF - 关闭日志', value: 'OFF' }
];

// 筛选后的数据
const filteredData = computed(() => {
  return loggers.value.filter((logger: Logger) => {
    const matchSearch = !searchText.value || logger.name.toLowerCase().includes(searchText.value.toLowerCase());
    const matchLevel =
      !selectedLevel.value ||
      logger.effectiveLevel === selectedLevel.value ||
      logger.configuredLevel === selectedLevel.value;
    return matchSearch && matchLevel;
  });
});

// 日志级别颜色映射
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

// 表格列配置
const columns: DataTableColumns<Logger> = [
  {
    title: 'Logger 名称',
    key: 'name',
    width: 350,
    ellipsis: {
      tooltip: true
    },
    render: (row: Logger) => {
      return row.name;
    }
  },
  {
    title: '配置级别',
    key: 'configuredLevel',
    width: 120,
    render: (row: Logger) => {
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
    render: (row: Logger) => {
      return h(
        NTag,
        { type: getLevelTagType(row.effectiveLevel), size: 'small' },
        { default: () => row.effectiveLevel }
      );
    }
  },
  {
    title: 'Additivity',
    key: 'additivity',
    width: 100,
    align: 'center',
    render: (row: Logger) => {
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
    render: (row: Logger) => {
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
    render: (row: Logger) => {
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

// 分页
const pagination = ref({
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
  prefix: (info: { startIndex: number; endIndex: number; itemCount: number }) => {
    return `显示 ${info.startIndex}-${info.endIndex} / 共 ${info.itemCount} 条`;
  }
});

// 处理编辑
const handleEdit = (logger: Logger) => {
  editForm.value = {
    name: logger.name,
    currentLevel: logger.effectiveLevel,
    newLevel: ''
  };
  showEditModal.value = true;
};

// 提交编辑
const handleSubmitEdit = () => {
  // 这里应该调用 API 提交修改
  console.log('提交修改:', editForm.value);
  showEditModal.value = false;
  // 重置表单
  editForm.value = {
    name: '',
    currentLevel: '',
    newLevel: ''
  };
};

// 快速操作
const handleSetAllInfo = () => {
  console.log('设置全部为 INFO');
};

const handleSetAllDebug = () => {
  console.log('设置全部为 DEBUG');
};

const handleSetAllWarn = () => {
  console.log('设置全部为 WARN');
};

const handleResetDefault = () => {
  console.log('恢复默认配置');
};

const handleExport = () => {
  console.log('导出配置');
};

// 刷新数据
const handleRefresh = () => {
  console.log('刷新 Logger 数据');
};
</script>

<template>
  <div class="logger-container">
    <!-- 日志级别统计 -->
    <NGrid :x-gap="16" :y-gap="16" :cols="6" class="mb-6">
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-blue-500/10">
              <div class="i-carbon-document text-20px text-blue-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">总Logger数</div>
              <div class="stat-value">{{ levelStats.total }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-red-500/10">
              <div class="i-carbon-warning-alt text-20px text-red-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">ERROR</div>
              <div class="stat-value text-red-500">{{ levelStats.error }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-yellow-500/10">
              <div class="i-carbon-warning text-20px text-yellow-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">WARN</div>
              <div class="stat-value text-yellow-500">{{ levelStats.warn }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-green-500/10">
              <div class="i-carbon-information text-20px text-green-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">INFO</div>
              <div class="stat-value text-green-500">{{ levelStats.info }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-cyan-500/10">
              <div class="i-carbon-debug text-20px text-cyan-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">DEBUG</div>
              <div class="stat-value text-cyan-500">{{ levelStats.debug }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-purple-500/10">
              <div class="i-carbon-code text-20px text-purple-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">TRACE</div>
              <div class="stat-value text-purple-500">{{ levelStats.trace }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 快速操作 -->
    <NCard class="quick-actions-card mb-6">
      <div class="quick-actions-header">
        <div class="i-carbon-flash text-16px text-orange-500" />
        <h4 class="quick-actions-title">快速操作</h4>
      </div>
      <div class="quick-actions-buttons">
        <NButton @click="handleSetAllInfo">
          <template #icon>
            <div class="i-carbon-volume-up" />
          </template>
          全部设为 INFO
        </NButton>
        <NButton @click="handleSetAllDebug">
          <template #icon>
            <div class="i-carbon-debug" />
          </template>
          全部设为 DEBUG
        </NButton>
        <NButton @click="handleSetAllWarn">
          <template #icon>
            <div class="i-carbon-warning" />
          </template>
          全部设为 WARN
        </NButton>
        <NButton @click="handleResetDefault">
          <template #icon>
            <div class="i-carbon-reset" />
          </template>
          恢复默认配置
        </NButton>
        <NButton type="primary" @click="handleExport">
          <template #icon>
            <div class="i-carbon-download" />
          </template>
          导出配置
        </NButton>
      </div>
    </NCard>

    <!-- Logger 列表 -->
    <NCard class="table-card">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <div class="i-carbon-list text-16px text-blue-500" />
            <span>Logger 列表</span>
          </div>
          <div class="table-actions">
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
                <div class="i-carbon-search text-14px" />
              </template>
            </NInput>

            <!-- 刷新 -->
            <NButton type="primary" @click="handleRefresh">
              <template #icon>
                <div class="i-carbon-renew" />
              </template>
              刷新
            </NButton>
          </div>
        </div>
      </template>

      <NDataTable
        :columns="columns"
        :data="filteredData"
        :pagination="pagination"
        :bordered="false"
        :single-line="false"
        class="logger-table"
      />
    </NCard>

    <!-- 编辑模态框 -->
    <NModal v-model:show="showEditModal" preset="card" title="修改日志级别" style="width: 600px">
      <NForm :model="editForm" label-placement="top">
        <NFormItem label="Logger 名称">
          <NInput :value="editForm.name" readonly />
        </NFormItem>
        <NFormItem label="当前级别">
          <div class="current-value">{{ editForm.currentLevel }}</div>
        </NFormItem>
        <NFormItem label="新级别" required>
          <NSelect v-model:value="editForm.newLevel" :options="levelOptions" placeholder="请选择级别" />
        </NFormItem>
        <div class="info-box">
          <div class="info-box-icon">
            <div class="i-carbon-information text-16px text-blue-400" />
          </div>
          <div class="info-box-content">
            <p class="info-box-title">日志级别说明:</p>
            <p class="info-box-text">级别从低到高: TRACE &lt; DEBUG &lt; INFO &lt; WARN &lt; ERROR &lt; OFF</p>
            <p class="info-box-text">设置为某级别后,该级别及以上级别的日志都会输出</p>
          </div>
        </div>
      </NForm>

      <template #footer>
        <div class="modal-footer">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" @click="handleSubmitEdit">确认修改</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.logger-container {
  padding: 16px;
}

.stat-card {
  border-radius: 12px;

  :deep(.n-card__content) {
    padding: 16px;
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.quick-actions-card {
  border-radius: 12px;

  :deep(.n-card__content) {
    padding: 20px;
  }
}

.quick-actions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.quick-actions-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color-1);
  margin: 0;
}

.quick-actions-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.table-card {
  border-radius: 12px;

  :deep(.n-card-header) {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--n-border-color);
  }

  :deep(.n-card__content) {
    padding: 0;
  }
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logger-table {
  :deep(.n-data-table-th) {
    font-size: 12px;
    font-weight: 500;
    background-color: var(--n-th-color);
  }

  :deep(.n-data-table-td) {
    font-size: 12px;
    font-family: 'Consolas', 'Monaco', monospace;
  }

  :deep(.n-data-table-tr:hover) {
    background-color: var(--n-td-color-hover);
  }
}

.current-value {
  padding: 8px 12px;
  background-color: var(--n-color-modal);
  border: 1px solid var(--n-border-color);
  border-radius: 3px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--n-text-color-1);
}

.info-box {
  display: flex;
  gap: 8px;
  padding: 12px;
  background-color: rgba(24, 160, 251, 0.1);
  border: 1px solid rgba(24, 160, 251, 0.2);
  border-radius: 8px;
}

.info-box-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.info-box-content {
  flex: 1;
}

.info-box-title {
  font-size: 12px;
  font-weight: 600;
  color: rgb(96, 196, 255);
  margin-bottom: 4px;
}

.info-box-text {
  font-size: 12px;
  color: rgb(96, 196, 255);
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
