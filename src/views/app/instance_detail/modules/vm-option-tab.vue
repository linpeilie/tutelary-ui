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

// 统计数据
const stats = ref({
  total: 156,
  configured: 42,
  writable: 28,
  readonly: 114
});

// 选项分类
const categories = ref([
  { label: '全部', value: 'all', count: 156 },
  { label: '内存管理', value: 'memory', count: 32 },
  { label: '垃圾回收', value: 'gc', count: 28 },
  { label: '性能优化', value: 'performance', count: 24 },
  { label: '编译器', value: 'compiler', count: 18 },
  { label: '调试诊断', value: 'debug', count: 22 },
  { label: '其他', value: 'other', count: 32 }
]);

const activeCategory = ref('all');

// 搜索和筛选
const searchText = ref('');
const selectedOrigin = ref<string | null>(null);

const originOptions = [
  { label: '全部来源', value: null },
  { label: '默认', value: 'DEFAULT' },
  { label: 'VM创建', value: 'VM_CREATION' },
  { label: '命令行', value: 'COMMAND_LINE' },
  { label: '配置文件', value: 'CONFIG_FILE' },
  { label: '自适应', value: 'ERGONOMIC' },
  { label: '管理接口', value: 'MANAGEMENT' }
];

// VM 选项数据
interface VmOption {
  name: string;
  value: string;
  origin: string;
  type: string;
  writable: boolean;
  category: string;
}

const vmOptions = ref<VmOption[]>([
  {
    name: 'MaxHeapSize',
    value: '4294967296',
    origin: 'COMMAND_LINE',
    type: 'uintx',
    writable: false,
    category: 'memory'
  },
  {
    name: 'InitialHeapSize',
    value: '268435456',
    origin: 'ERGONOMIC',
    type: 'uintx',
    writable: false,
    category: 'memory'
  },
  { name: 'MinHeapSize', value: '8388608', origin: 'ERGONOMIC', type: 'uintx', writable: false, category: 'memory' },
  {
    name: 'MaxMetaspaceSize',
    value: '536870912',
    origin: 'COMMAND_LINE',
    type: 'uintx',
    writable: false,
    category: 'memory'
  },
  {
    name: 'MetaspaceSize',
    value: '268435456',
    origin: 'COMMAND_LINE',
    type: 'uintx',
    writable: false,
    category: 'memory'
  },
  {
    name: 'CompressedClassSpaceSize',
    value: '1073741824',
    origin: 'DEFAULT',
    type: 'uintx',
    writable: false,
    category: 'memory'
  },
  { name: 'UseG1GC', value: 'true', origin: 'COMMAND_LINE', type: 'bool', writable: false, category: 'gc' },
  { name: 'UseParallelGC', value: 'false', origin: 'DEFAULT', type: 'bool', writable: false, category: 'gc' },
  { name: 'UseConcMarkSweepGC', value: 'false', origin: 'DEFAULT', type: 'bool', writable: false, category: 'gc' },
  { name: 'MaxGCPauseMillis', value: '200', origin: 'COMMAND_LINE', type: 'uintx', writable: true, category: 'gc' },
  { name: 'GCTimeRatio', value: '99', origin: 'DEFAULT', type: 'uintx', writable: true, category: 'gc' },
  { name: 'ParallelGCThreads', value: '8', origin: 'COMMAND_LINE', type: 'uint', writable: false, category: 'gc' },
  { name: 'ConcGCThreads', value: '2', origin: 'COMMAND_LINE', type: 'uint', writable: false, category: 'gc' },
  {
    name: 'InitiatingHeapOccupancyPercent',
    value: '45',
    origin: 'COMMAND_LINE',
    type: 'uintx',
    writable: true,
    category: 'gc'
  },
  { name: 'G1HeapRegionSize', value: '2097152', origin: 'ERGONOMIC', type: 'uintx', writable: false, category: 'gc' },
  { name: 'G1ReservePercent', value: '10', origin: 'DEFAULT', type: 'uintx', writable: true, category: 'gc' },
  {
    name: 'HeapDumpOnOutOfMemoryError',
    value: 'true',
    origin: 'COMMAND_LINE',
    type: 'bool',
    writable: true,
    category: 'debug'
  },
  {
    name: 'HeapDumpPath',
    value: '/logs/heapdump.hprof',
    origin: 'COMMAND_LINE',
    type: 'ccstr',
    writable: true,
    category: 'debug'
  },
  { name: 'PrintGC', value: 'false', origin: 'DEFAULT', type: 'bool', writable: true, category: 'debug' },
  { name: 'PrintGCDetails', value: 'true', origin: 'COMMAND_LINE', type: 'bool', writable: true, category: 'debug' },
  { name: 'PrintGCDateStamps', value: 'true', origin: 'COMMAND_LINE', type: 'bool', writable: true, category: 'debug' },
  { name: 'PrintGCTimeStamps', value: 'true', origin: 'DEFAULT', type: 'bool', writable: true, category: 'debug' },
  {
    name: 'UseCompressedOops',
    value: 'true',
    origin: 'ERGONOMIC',
    type: 'bool',
    writable: false,
    category: 'performance'
  },
  {
    name: 'UseCompressedClassPointers',
    value: 'true',
    origin: 'ERGONOMIC',
    type: 'bool',
    writable: false,
    category: 'performance'
  },
  { name: 'TieredCompilation', value: 'true', origin: 'DEFAULT', type: 'bool', writable: false, category: 'compiler' },
  { name: 'TieredStopAtLevel', value: '4', origin: 'DEFAULT', type: 'intx', writable: false, category: 'compiler' },
  { name: 'CompileThreshold', value: '10000', origin: 'DEFAULT', type: 'intx', writable: true, category: 'compiler' },
  {
    name: 'CodeCacheSize',
    value: '251658240',
    origin: 'ERGONOMIC',
    type: 'uintx',
    writable: false,
    category: 'compiler'
  },
  {
    name: 'ReservedCodeCacheSize',
    value: '251658240',
    origin: 'DEFAULT',
    type: 'uintx',
    writable: false,
    category: 'compiler'
  },
  {
    name: 'InitialCodeCacheSize',
    value: '2555904',
    origin: 'DEFAULT',
    type: 'uintx',
    writable: false,
    category: 'compiler'
  },
  { name: 'ThreadStackSize', value: '1024', origin: 'DEFAULT', type: 'intx', writable: false, category: 'performance' },
  {
    name: 'VMThreadStackSize',
    value: '1024',
    origin: 'DEFAULT',
    type: 'uintx',
    writable: false,
    category: 'performance'
  },
  { name: 'SurvivorRatio', value: '8', origin: 'DEFAULT', type: 'uintx', writable: true, category: 'memory' },
  { name: 'NewRatio', value: '2', origin: 'DEFAULT', type: 'uintx', writable: true, category: 'memory' },
  { name: 'MaxDirectMemorySize', value: '0', origin: 'DEFAULT', type: 'uintx', writable: false, category: 'memory' },
  { name: 'StringTableSize', value: '60013', origin: 'DEFAULT', type: 'uintx', writable: false, category: 'other' },
  { name: 'SymbolTableSize', value: '20011', origin: 'DEFAULT', type: 'uintx', writable: false, category: 'other' },
  {
    name: 'UseStringDeduplication',
    value: 'false',
    origin: 'DEFAULT',
    type: 'bool',
    writable: true,
    category: 'performance'
  },
  { name: 'AlwaysPreTouch', value: 'false', origin: 'DEFAULT', type: 'bool', writable: false, category: 'performance' },
  {
    name: 'UseLargePagesIndividualAllocation',
    value: 'false',
    origin: 'DEFAULT',
    type: 'bool',
    writable: false,
    category: 'performance'
  }
]);

// 编辑模态框
const showEditModal = ref(false);
const editForm = ref({
  name: '',
  currentValue: '',
  newValue: ''
});

// 筛选后的数据
const filteredData = computed(() => {
  return vmOptions.value.filter((option: VmOption) => {
    const matchCategory = activeCategory.value === 'all' || option.category === activeCategory.value;
    const matchSearch = !searchText.value || option.name.toLowerCase().includes(searchText.value.toLowerCase());
    const matchOrigin = !selectedOrigin.value || option.origin === selectedOrigin.value;
    return matchCategory && matchSearch && matchOrigin;
  });
});

// 来源标签颜色映射
const getOriginTagType = (origin: string) => {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    DEFAULT: 'default',
    VM_CREATION: 'info',
    COMMAND_LINE: 'success',
    CONFIG_FILE: 'warning',
    ERGONOMIC: 'info',
    MANAGEMENT: 'warning'
  };
  return map[origin] || 'default';
};

// 类型标签颜色映射
const getTypeTagType = (type: string) => {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    bool: 'info',
    intx: 'success',
    uintx: 'warning',
    uint: 'info',
    ccstr: 'warning'
  };
  return map[type] || 'default';
};

// 表格列配置
const columns: DataTableColumns<VmOption> = [
  {
    title: '名称',
    key: 'name',
    width: 250,
    ellipsis: {
      tooltip: true
    },
    render: (row: VmOption) => {
      return row.name;
    }
  },
  {
    title: '值',
    key: 'value',
    width: 300,
    ellipsis: {
      tooltip: true
    },
    render: (row: VmOption) => {
      return row.value;
    }
  },
  {
    title: '来源',
    key: 'origin',
    width: 150,
    render: (row: VmOption) => {
      return h(NTag, { type: getOriginTagType(row.origin), size: 'small' }, { default: () => row.origin });
    }
  },
  {
    title: '类型',
    key: 'type',
    width: 120,
    render: (row: VmOption) => {
      return h(NTag, { type: getTypeTagType(row.type), size: 'small' }, { default: () => row.type });
    }
  },
  {
    title: '可写',
    key: 'writable',
    width: 100,
    align: 'center',
    render: (row: VmOption) => {
      return h(
        NTag,
        {
          type: row.writable ? 'success' : 'default',
          size: 'small'
        },
        { default: () => (row.writable ? '是' : '否') }
      );
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center',
    render: (row: VmOption) => {
      return h(
        NButton,
        {
          size: 'small',
          type: row.writable ? 'primary' : 'default',
          disabled: !row.writable,
          onClick: () => handleEdit(row)
        },
        { default: () => (row.writable ? '修改' : '只读') }
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

// 处理分类切换
const handleCategoryChange = (category: string) => {
  activeCategory.value = category;
};

// 处理编辑
const handleEdit = (option: VmOption) => {
  editForm.value = {
    name: option.name,
    currentValue: option.value,
    newValue: ''
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
    currentValue: '',
    newValue: ''
  };
};

// 刷新数据
const handleRefresh = () => {
  // 这里应该调用 API 刷新数据
  console.log('刷新 VM 选项数据');
};

// 导出数据
const handleExport = () => {
  // 这里应该实现导出功能
  console.log('导出 VM 选项数据');
};
</script>

<template>
  <div class="vm-option-container">
    <!-- 统计概览 -->
    <NGrid :x-gap="16" :y-gap="16" :cols="4" class="mb-6">
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-blue-500/10">
              <div class="i-carbon-settings text-20px text-blue-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">总选项数</div>
              <div class="stat-value">{{ stats.total }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-green-500/10">
              <div class="i-carbon-checkmark-outline text-20px text-green-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">已设置</div>
              <div class="stat-value text-green-500">{{ stats.configured }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-purple-500/10">
              <div class="i-carbon-tool-kit text-20px text-purple-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">可修改</div>
              <div class="stat-value text-purple-500">{{ stats.writable }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bg-orange-500/10">
              <div class="i-carbon-locked text-20px text-orange-500" />
            </div>
            <div class="stat-info">
              <div class="stat-label">只读</div>
              <div class="stat-value text-orange-500">{{ stats.readonly }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 分类标签 -->
    <NCard class="category-card mb-6">
      <div class="category-header">
        <div class="i-carbon-filter text-16px text-blue-500" />
        <h4 class="category-title">选项分类</h4>
      </div>
      <div class="category-buttons">
        <NButton
          v-for="cat in categories"
          :key="cat.value"
          :type="activeCategory === cat.value ? 'primary' : 'default'"
          size="small"
          @click="handleCategoryChange(cat.value)"
        >
          {{ cat.label }} ({{ cat.count }})
        </NButton>
      </div>
    </NCard>

    <!-- VM 选项列表 -->
    <NCard class="table-card">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <div class="i-carbon-list text-16px text-blue-500" />
            <span>VM 选项列表</span>
          </div>
          <div class="table-actions">
            <!-- 搜索 -->
            <NInput v-model:value="searchText" placeholder="搜索选项名称..." clearable style="width: 240px">
              <template #prefix>
                <div class="i-carbon-search text-14px" />
              </template>
            </NInput>

            <!-- 来源筛选 -->
            <NSelect
              v-model:value="selectedOrigin"
              :options="originOptions"
              placeholder="全部来源"
              clearable
              style="width: 160px"
            />

            <!-- 导出 -->
            <NButton @click="handleExport">
              <template #icon>
                <div class="i-carbon-download" />
              </template>
              导出
            </NButton>

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
        class="vm-option-table"
      />
    </NCard>

    <!-- 编辑模态框 -->
    <NModal v-model:show="showEditModal" preset="card" title="修改 VM 选项" style="width: 600px">
      <NForm :model="editForm" label-placement="top">
        <NFormItem label="选项名称">
          <NInput :value="editForm.name" readonly />
        </NFormItem>
        <NFormItem label="当前值">
          <div class="current-value">{{ editForm.currentValue }}</div>
        </NFormItem>
        <NFormItem label="新值" required>
          <NInput v-model:value="editForm.newValue" placeholder="输入新值" />
          <template #feedback>
            <span class="text-xs text-gray-500">请谨慎修改,错误的值可能影响 JVM 运行</span>
          </template>
        </NFormItem>
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
.vm-option-container {
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

.category-card {
  border-radius: 12px;

  :deep(.n-card__content) {
    padding: 20px;
  }
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color-1);
  margin: 0;
}

.category-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.vm-option-table {
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
