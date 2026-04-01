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
    <NCard class="id-table-card">
      <template #header>
        <div class="id-table-header">
          <div class="id-table-title">
            <SvgIcon icon="lucide:list" class="text-16px text-primary" />
            <span>VM 选项列表</span>
          </div>
          <div class="id-table-actions">
            <!-- 搜索 -->
            <NInput v-model:value="searchText" placeholder="搜索选项名称..." clearable style="width: 240px">
              <template #prefix>
                <SvgIcon icon="lucide:search" class="text-14px" />
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
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>

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

      <NSkeleton v-if="loading && filteredData.length === 0" text :repeat="8" round />
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
    <NModal v-model:show="showEditModal" preset="card" title="修改 VM 选项" style="width: 600px">
      <NForm :model="editForm" label-placement="top">
        <NFormItem label="选项名称">
          <NInput :value="editForm.name" readonly />
        </NFormItem>
        <NFormItem label="当前值">
          <div class="id-current-value">{{ editForm.currentValue }}</div>
        </NFormItem>
        <NFormItem label="新值" required>
          <NInput v-model:value="editForm.newValue" placeholder="输入新值" />
          <template #feedback>
            <span class="text-xs text-gray-500">请谨慎修改,错误的值可能影响 JVM 运行</span>
          </template>
        </NFormItem>
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
.vm-option-container {
  padding: 0;
}
</style>
