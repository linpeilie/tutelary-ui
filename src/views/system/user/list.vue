<script setup lang="ts">
import type { Ref } from 'vue'
import { ref } from 'vue'
import type { FormValidationError } from 'naive-ui'
import { NButton, NTag } from 'naive-ui'
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import { useModal } from '@/composables/useModal'
import type { UserInfo, UserQuery } from '@/api/types/userTypes'
import userApi from '@/api/userApi'
import { userStateEnum } from '~/src/enums/userEnums'
import { getLabelByValue, getTagByValue } from '@/utils/common/enum'

const $table = ref<any>(null)

const queryParams: Ref<UserQuery> = ref<UserQuery>({} as UserQuery)

const { modalAction, modalVisible, modalTitle, modalFormRef, modalLoading, handleAdd, handleEdit, modalForm }
  = useModal<UserInfo>({
    name: '用户',
  })
const columns: TableColumns<any> = [
  { title: '用户名', key: 'username' },
  { title: '昵称', key: 'nickName' },
  { title: '手机号', key: 'phoneNumber' },
  {
    title: '状态',
    key: 'state',
    render(row: UserInfo) {
      return h(NTag, {
        bordered: false,
        type: getTagByValue(userStateEnum, row.state)?.type,
      }, {
        default: () => getLabelByValue(userStateEnum, row.state),
      })
    },
  },
  { title: '备注', key: 'remark' },
  {
    title: '操作',
    key: 'action',
    render(row: UserInfo) {
      return h(NButton, {
        size: 'small',
        type: 'primary',
        onClick: () => handleEdit(row),
      }, { default: () => '编辑' })
    },
  },
]

const modalFormRules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  nickName: { required: true, meessage: '请输入昵称', trigger: 'blur' },
  phoneNumber: { required: true, meessage: '请输入手机号', trigger: 'blur' },
  password: { required: true, meessage: '请输入密码', trigger: 'blur' },
}

function save() {
  modalFormRef.value?.validate((errors: Array<FormValidationError>) => {
    if (!errors) {
      if (modalAction.value === 'edit') {
        editUser().then(() => {
          modalVisible.value = false
          $table.value.handleSearch()
        })
      }
      else if (modalAction.value === 'add') {
        addUser().then(() => {
          modalVisible.value = false
          $table.value.handleSearch()
        })
      }
    }
  })
}

function addUser() {
  const addRequest = {
    username: modalForm.value.username,
    nickName: modalForm.value.nickName,
    phoneNumber: modalForm.value.phoneNumber,
    password: modalForm.value.password,
    remark: modalForm.value.remark,
  }
  return userApi.userAdd(addRequest)
}

function editUser() {
  const editRequest = {
    userId: modalForm.value.userId,
    nickName: modalForm.value.nickName,
    phoneNumber: modalForm.value.phoneNumber,
    remark: modalForm.value.remark,
  }
  return userApi.userEdit(editRequest)
}
</script>

<template>
  <common-page title="用户">
    <template #action>
      <NButton type="primary" @click="handleAdd">
        <TheIcon icon="material-symbols:add" :size="18" class="mr-5" />新建用户
      </NButton>
    </template>

    <crud-table
      ref="$table"
      v-model:query-items="queryParams"
      :columns="columns"
      :get-data="userApi.userPageQuery"
      row-key="userId"
    >
      <template #queryBar>
        <query-bar-item label="用户名" :label-width="80">
          <n-input
            v-model:value="queryParams.username"
            placeholder="请输入用户名"
            @keydown.enter="$table?.handleSearch"
          />
        </query-bar-item>
      </template>
    </crud-table>
  </common-page>

  <crud-modal v-model:visible="modalVisible" :title="modalTitle" :loading="modalLoading" @on-save="save">
    <n-form
      ref="modalFormRef"
      label-placement="left"
      label-align="left"
      :label-width="80"
      :model="modalForm"
      :rules="modalFormRules"
    >
      <n-form-item label="用户名" path="username">
        <n-input v-model:value="modalForm.username" :disabled="modalAction === 'edit'" />
      </n-form-item>
      <n-form-item label="昵称" path="nickName">
        <n-input v-model:value="modalForm.nickName" />
      </n-form-item>
      <n-form-item label="手机号" path="phoneNumber">
        <n-input v-model:value="modalForm.phoneNumber" />
      </n-form-item>
      <n-form-item v-if="modalAction === 'add'" label="密码" path="password">
        <n-input v-model:value="modalForm.password" />
      </n-form-item>
      <n-form-item label="备注" path="remark">
        <n-input v-model:value="modalForm.remark" type="textarea" />
      </n-form-item>
    </n-form>
  </crud-modal>
</template>

<style scoped></style>
