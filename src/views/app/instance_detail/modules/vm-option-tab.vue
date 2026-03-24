<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps, SelectOption } from 'naive-ui';
import { fetchSetVmOptionCommand, fetchVmOptionCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { SetVmOptionResponse } from '@/proto/command/result/SetVmOptionResponse';
import type { VmOptionResponse } from '@/proto/command/result/VmOptionResponse';

type OriginValue = string | null;

type VmOptionType = 'bool' | 'number' | 'string';

interface Props {
  instanceId: string;
}

interface VmOptionRow {
  name: string;
  value: string;
  origin: string;
  type: VmOptionType;
  writable: boolean;
}

const props = defineProps<Props>();

const searchText = ref('');
const selectedOrigin = ref<OriginValue>(null);
const vmOptions = ref<VmOptionRow[]>([]);
const loading = ref(false);
const submitting = ref(false);

const originOptions: SelectOption[] = [
  { label: '默认', value: 'DEFAULT' },
  { label: 'VM创建', value: 'VM_CREATION' },
  { label: '命令行', value: 'COMMAND_LINE' },
  { label: '配置文件', value: 'CONFIG_FILE' },
  { label: '自适应', value: 'ERGONOMIC' },
  { label: '管理接口', value: 'MANAGEMENT' }
];

const showEditModal = ref(false);
const editForm = ref({
  name: '',
  currentValue: '',
  newValue: ''
});

const filteredData = computed(() => {
  return vmOptions.value.filter((option: VmOptionRow) => {
    const matchSearch = !searchText.value || option.name.toLowerCase().includes(searchText.value.toLowerCase());
    const matchOrigin = !selectedOrigin.value || option.origin === selectedOrigin.value;
    return matchSearch && matchOrigin;
  });
});

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

const getTypeTagType = (type: VmOptionType) => {
  const map: Record<VmOptionType, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    bool: 'info',
    number: 'success',
    string: 'warning'
  };
  return map[type];
};

const columns: DataTableColumns<VmOptionRow> = [
  {
    title: '名称',
    key: 'name',
    width: 250,
    ellipsis: {
      tooltip: true
    },
    render: (row: VmOptionRow) => {
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
    render: (row: VmOptionRow) => {
      return row.value;
    }
  },
  {
    title: '来源',
    key: 'origin',
    width: 150,
    render: (row: VmOptionRow) => {
      return h(NTag, { type: getOriginTagType(row.origin), size: 'small' }, { default: () => row.origin || '-' });
    }
  },
  {
    title: '类型',
    key: 'type',
    width: 120,
    render: (row: VmOptionRow) => {
      return h(NTag, { type: getTypeTagType(row.type), size: 'small' }, { default: () => row.type });
    }
  },
  {
    title: '可写',
    key: 'writable',
    width: 100,
    align: 'center',
    render: (row: VmOptionRow) => {
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
    render: (row: VmOptionRow) => {
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

function detectVmOptionType(value: string): VmOptionType {
  if (/^(true|false)$/i.test(value)) {
    return 'bool';
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return 'number';
  }

  return 'string';
}

function mapVmOptionResponse(response: VmOptionResponse) {
  vmOptions.value = (response.options || []).map(option => ({
    name: option.name,
    value: option.value,
    origin: option.origin,
    type: detectVmOptionType(option.value),
    writable: option.writeable
  }));
}

function createVmOptionCommand() {
  loading.value = true;

  fetchVmOptionCommand({
    instanceId: props.instanceId,
    param: {}
  }).catch(() => {
    loading.value = false;
  });
}

function handleVmOption(response: CommandExecuteResponse<VmOptionResponse>) {
  loading.value = false;
  const data = response.data as VmOptionResponse | undefined;

  if (!data || data.state === 0) {
    if (data?.message) {
      window.$message?.error(data.message);
    }
    return;
  }

  mapVmOptionResponse(data);
}

function handleVmOptionSet(response: CommandExecuteResponse<SetVmOptionResponse>) {
  submitting.value = false;
  const data = response.data as SetVmOptionResponse | undefined;

  if (!data || data.state === 0 || !data.latestVmOption) {
    if (data?.message) {
      window.$message?.error(data.message);
    }
    return;
  }

  const nextOption = {
    name: data.latestVmOption.name,
    value: data.latestVmOption.value,
    origin: data.latestVmOption.origin,
    type: detectVmOptionType(data.latestVmOption.value),
    writable: data.latestVmOption.writeable
  };

  vmOptions.value = vmOptions.value.map(option => (option.name === nextOption.name ? nextOption : option));
  showEditModal.value = false;
  editForm.value = {
    name: '',
    currentValue: '',
    newValue: ''
  };
  window.$message?.success('VM 选项更新成功');
}

const handleEdit = (option: VmOptionRow) => {
  editForm.value = {
    name: option.name,
    currentValue: option.value,
    newValue: option.value
  };
  showEditModal.value = true;
};

const handleSubmitEdit = () => {
  submitting.value = true;

  fetchSetVmOptionCommand({
    instanceId: props.instanceId,
    param: {
      name: editForm.value.name,
      value: editForm.value.newValue
    }
  }).catch(() => {
    submitting.value = false;
  });
};

const handleRefresh = () => {
  createVmOptionCommand();
};

const handleExport = () => {
  window.$message?.info('导出能力后续补充，当前保留现有页面样式');
};

onMounted(() => {
  createVmOptionCommand();
  eventBus.on('command:vm-option', handleVmOption);
  eventBus.on('command:vm-option-set', handleVmOptionSet);
});

onUnmounted(() => {
  eventBus.off('command:vm-option', handleVmOption);
  eventBus.off('command:vm-option-set', handleVmOptionSet);
});
</script>

<template>
  <div class="vm-option-container">
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
            <NButton type="primary" :loading="loading" @click="handleRefresh">
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
        :loading="loading"
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
          <NButton type="primary" :loading="submitting" @click="handleSubmitEdit">确认修改</NButton>
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
