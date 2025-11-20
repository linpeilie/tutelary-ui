<script setup lang="ts">
import { h, ref } from 'vue';
import {
  type DataTableColumns,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui';
import { useEnum } from '@/composables/useEnum';
import { getLabelByValue } from '@/utils/enum';
import { enableStatusEnum } from '@/enum/commonEnums';
import { threadStates } from '@/enum/threadStateEnums';
import { userStateEnum as userStateEnumDef } from '@/enum/userEnums';

// 使用枚举 Composable
const statusEnum = useEnum(enableStatusEnum);
const threadStateEnum = useEnum(threadStates);
const userStateEnum = useEnum(userStateEnumDef);

// 表单值
const selectedStatus = ref<number | null>(1);
const selectedThreadState = ref<string>('RUNNABLE');
const selectedUserState = ref<string>('00');

// 表格数据
interface TableRow {
  id: number;
  name: string;
  status: number;
  threadState: string;
  userState: string;
}

const tableData = ref<TableRow[]>([
  { id: 1, name: '用户A', status: 1, threadState: 'RUNNABLE', userState: '00' },
  { id: 2, name: '用户B', status: 0, threadState: 'WAITING', userState: '10' },
  { id: 3, name: '用户C', status: 1, threadState: 'BLOCKED', userState: '00' }
]);

// 表格列定义
const columns: DataTableColumns<TableRow> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '姓名', key: 'name', width: 120 },
  {
    title: '启用状态',
    key: 'status',
    width: 120,
    render: row => {
      const tag = statusEnum.getTag(row.status);
      return h(NTag, { type: tag?.type }, { default: () => statusEnum.getLabel(row.status) });
    }
  },
  {
    title: '线程状态',
    key: 'threadState',
    width: 150,
    render: row => {
      const tag = threadStateEnum.getTag(row.threadState);
      return h(NTag, { type: tag?.type }, { default: () => threadStateEnum.getLabel(row.threadState) });
    }
  },
  {
    title: '用户状态',
    key: 'userState',
    width: 120,
    render: row => {
      const tag = userStateEnum.getTag(row.userState);
      return h(NTag, { type: tag?.type }, { default: () => userStateEnum.getLabel(row.userState) });
    }
  }
];
</script>

<template>
  <div class="h-full p-4">
    <NCard title="枚举使用示例" class="h-full">
      <NSpace vertical>
        <!-- 示例 1: Select 选择器 -->
        <NCard title="示例 1: Select 下拉选择" size="small">
          <NSpace vertical>
            <NSpace align="center">
              <span class="w-100px">启用状态:</span>
              <NSelect
                v-model:value="selectedStatus"
                :options="statusEnum.options.value"
                class="w-200px"
                placeholder="请选择状态"
              />
              <NTag v-if="selectedStatus !== null" :type="statusEnum.getTag(selectedStatus)?.type">
                {{ statusEnum.getLabel(selectedStatus) }}
              </NTag>
            </NSpace>

            <NSpace align="center">
              <span class="w-100px">线程状态:</span>
              <NSelect
                v-model:value="selectedThreadState"
                :options="threadStateEnum.options.value"
                class="w-200px"
                placeholder="请选择线程状态"
              />
              <NTag v-if="selectedThreadState" :type="threadStateEnum.getTag(selectedThreadState)?.type">
                {{ threadStateEnum.getLabel(selectedThreadState) }}
              </NTag>
            </NSpace>

            <NSpace align="center">
              <span class="w-100px">用户状态:</span>
              <NSelect
                v-model:value="selectedUserState"
                :options="userStateEnum.options.value"
                class="w-200px"
                placeholder="请选择用户状态"
              />
              <NTag v-if="selectedUserState" :type="userStateEnum.getTag(selectedUserState)?.type">
                {{ userStateEnum.getLabel(selectedUserState) }}
              </NTag>
            </NSpace>
          </NSpace>
        </NCard>

        <!-- 示例 2: Radio 单选 -->
        <NCard title="示例 2: Radio 单选组" size="small">
          <NSpace vertical>
            <NRadioGroup v-model:value="selectedStatus">
              <NSpace>
                <NRadio
                  v-for="item in statusEnum.options.value"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </NSpace>
            </NRadioGroup>
          </NSpace>
        </NCard>

        <!-- 示例 3: 表格中使用 -->
        <NCard title="示例 3: 数据表格" size="small">
          <NDataTable :columns="columns" :data="tableData" :pagination="false" size="small" />
        </NCard>

        <!-- 示例 4: 枚举工具方法 -->
        <NCard title="示例 4: 枚举工具方法" size="small">
          <NDescriptions :column="2" size="small">
            <NDescriptionsItem label="所有启用状态值">
              {{ statusEnum.getValues().join(', ') }}
            </NDescriptionsItem>
            <NDescriptionsItem label="所有启用状态标签">
              {{ statusEnum.getLabels().join(', ') }}
            </NDescriptionsItem>
            <NDescriptionsItem label="是否存在值 1">
              {{ statusEnum.hasValue(1) ? '是' : '否' }}
            </NDescriptionsItem>
            <NDescriptionsItem label="是否存在值 999">
              {{ statusEnum.hasValue(999) ? '是' : '否' }}
            </NDescriptionsItem>
            <NDescriptionsItem label="根据标签'启用'获取值">
              {{ statusEnum.getValueByLabel('启用') }}
            </NDescriptionsItem>
            <NDescriptionsItem label="类型守卫验证 1">
              {{ statusEnum.isValid(1) ? '有效' : '无效' }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- 示例 5: 枚举映射 -->
        <NCard title="示例 5: 使用 getLabelByValue" size="small">
          <NSpace vertical>
            <div>
              <span class="font-bold">直接使用工具函数:</span>
              {{ getLabelByValue(enableStatusEnum, 1) }}
            </div>
            <div>
              <span class="font-bold">不存在的值:</span>
              {{ getLabelByValue(enableStatusEnum, 999, '未知状态') }}
            </div>
          </NSpace>
        </NCard>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
/* 自定义样式 */
</style>
