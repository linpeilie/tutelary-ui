<script setup lang="ts">
import type { Ref } from 'vue'
import { ref } from 'vue'
import { NButton, NTag } from 'naive-ui'
import { useModal } from '@/composables/useModal'
import type { RoleInfo, RoleQuery } from '@/api/types/roleTypes'
import roleApi from '@/api/roleApi'
import CommonPage from '@/components/page/CommonPage.vue'
import TheIcon from '@/components/custom/TheIcon.vue'
import { renderIcon } from '~/src/utils'
import { enableStatusEnum } from '@/enums/commonEnums'
import { getLabelByValue, getTagByValue } from '@/utils/common/enum'

const $table = ref<any>(null)

const queryParams: Ref<RoleQuery> = ref({
  roleName: '',
} as RoleQuery)

const { modalAction, modalVisible, modalTitle, modalFormRef, modalLoading, handleAdd, handleEdit, modalForm }
  = useModal<RoleInfo>({
    name: '角色',
  })

const enableStateOptions = Object.values(enableStatusEnum)

const columns: any = [
  { title: '角色ID', key: 'roleId' },
  { title: '角色名称', key: 'roleName' },
  {
    title: '启用状态',
    key: 'enableStatus',
    render(row: RoleInfo) {
      return h(NTag, {
        type: getTagByValue(enableStatusEnum, row.enableStatus)?.type,
      }, {
        default: () => getLabelByValue(enableStatusEnum, row.enableStatus),
      })
    },
  },
  { title: '备注', key: 'remark' },
  { title: '创建时间', key: 'createTime' },
  { title: '修改时间', key: 'updateTime' },
  {
    title: '操作',
    key: 'action',
    render(row: RoleInfo) {
      return h(NButton, {
        size: 'small',
        type: 'primary',
        onClick: () => handleEdit(row),
      }, {
        default: () => '编辑',
        icon: renderIcon('material-symbols:edit-outline', { size: 14 }),
      })
    },
  },
]

const modalFormRules = {
  roleName: { required: true, message: '请输入角色名', trigger: 'blur' },
  enableStatue: { required: true, message: '请输入角色名', trigger: 'blur' },
}

function addRole() {
  const addRequest = {
    roleName: modalForm.value.roleName,
    enableStatus: modalForm.value.enableStatus,
    remark: modalForm.value.remark,
  }
  return roleApi.roleAdd(addRequest)
}

function editRole() {
  const editRequest = {
    roleId: modalForm.value.roleId,
    roleName: modalForm.value.roleName,
    enableStatus: modalForm.value.enableStatus,
    remark: modalForm.value.remark,
  }
  return roleApi.roleEdit(editRequest)
}

function save() {
  if (modalAction.value === 'edit') {
    editRole().then(() => {
      modalVisible.value = false
      $table.value.handleSearch()
    })
  }
  else if (modalAction.value === 'add') {
    addRole().then(() => {
      modalVisible.value = false
      $table.value.handleSearch()
    })
  }
}
</script>

<template>
  <CommonPage title="角色">
    <template #action>
      <div>
        <NButton type="primary" @click="handleAdd">
          <TheIcon icon="material-symbols:add" :size="18" class="mr-5" /> 新建角色
        </NButton>
      </div>
    </template>

    <crud-table
      ref="$table"
      v-model:query-items="queryParams"
      :columns="columns"
      :get-data="roleApi.rolePageQuery"
      row-key="roleId"
    >
      <template #queryBar>
        <query-bar-item label="角色名称" :label-width="80">
          <n-input
            v-model:value="queryParams.roleName"
            placeholder="请输入角色名"
            @keydown.enter="$table?.handleSearch"
          />
        </query-bar-item>
        <query-bar-item label="启用状态" :label-width="80">
          <n-select v-model:value="queryParams.enableStatus" :options="enableStateOptions" />
        </query-bar-item>
      </template>
    </crud-table>
  </CommonPage>

  <CrudModal v-model:visible="modalVisible" :title="modalTitle" :loading="modalLoading" @on-save="save">
    <n-form
      ref="modalFormRef"
      label-placement="left"
      label-align="left"
      :label-width="80"
      :model="modalForm"
      :rules="modalFormRules"
    >
      <n-form-item label="角色名称" path="roleName">
        <n-input v-model:value="modalForm.roleName" :disabled="modalAction === 'edit'" />
      </n-form-item>
      <n-form-item label="启用状态" path="enableStatus">
        <n-switch v-model:value="modalForm.enableStatus" :checked-value="1" :unchecked-value="0" />
      </n-form-item>
      <n-form-item label="备注" path="remark">
        <n-input v-model:value="modalForm.remark" type="textarea" />
      </n-form-item>
    </n-form>
  </CrudModal>
</template>

<style scoped></style>
