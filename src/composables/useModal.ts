import type { Ref } from 'vue'
import { computed, ref } from 'vue'

const VIEW = 'view'
const EDIT = 'edit'
const ADD = 'add'

const ACTIONS = {
  view: '查看',
  edit: '编辑',
  add: '新增',
}

type ActionKey = keyof typeof ACTIONS

type ActionKeyScope = 'view' | 'edit' | 'add'

interface ModalOptions<F> {
  name: string
  initForm?: F
  doCreate?: Function
  doUpdate?: Function
}

export function useModal<V>(options: ModalOptions<V>) {
  const modalVisible = ref(false)
  const modalAction: Ref<ActionKeyScope> = ref('view')
  const modalTitle = computed(() => computedModalTitle(modalAction.value))
  const modalLoading = ref(false)
  const modalFormRef = ref(null)
  const modalForm: Ref<V> = ref<V>({} as V) as Ref<V>

  function computedModalTitle(key: ActionKeyScope): string {
    return ACTIONS[key as ActionKey] + options.name
  }

  function handleView(row: V) {
    modalAction.value = VIEW
    modalVisible.value = true
    modalForm.value = { ...row }
  }

  function handleAdd() {
    modalAction.value = ADD
    modalVisible.value = true
    modalForm.value = { ...options.initForm } as V
  }

  function handleEdit(row: V) {
    modalAction.value = EDIT
    modalVisible.value = true
    modalForm.value = { ...row }
  }

  return {
    modalAction,
    modalVisible,
    modalTitle,
    modalLoading,
    modalFormRef,
    modalForm,
    handleView,
    handleAdd,
    handleEdit,
  }
}
