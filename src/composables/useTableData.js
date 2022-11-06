import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { postAction } from 'src/api/manage'

export default function useTableData (url) {
  const $q = useQuasar()
  // 加载中
  const loading = ref(false)
  // 表格数据
  const tableData = ref([])
  // 详情窗口
  const recordDetailDialog = ref(null)
  // 分页入参
  const pagination = ref({
    pageNo: 1,
    pageSize: 10
  })
  // 查询入参
  const queryParams = ref({})
  // 分页配置
  const pageOptions = ref([10, 30, 50, 100])
  // 显示添加窗口
  const showAddForm = () => {
    recordDetailDialog.value.formType = 'add'
    recordDetailDialog.value.show()
  }
  // 显示编辑窗口
  const showEditForm = (row) => {
    recordDetailDialog.value.formType = 'edit'
    recordDetailDialog.value.show(row)
  }
  // 查询方法
  const onRequest = async (props) => {
    if (!url || !url.list) {
      $q.notify({
        type: 'negative',
        message: '没有配置查询URL',
        position: 'top'
      })
      return
    }
    loading.value = true
    let params = {}
    params.pageNo = props.pagination.pageNo
    params.pageSize = props.pagination.pageSize
    params = Object.assign(params, queryParams.value)
    await postAction(url.list, params)
      .then(res => {
        pagination.value = props.pagination
        pagination.value.total = res.data.data.total
        tableData.value = res.data.data.records
      }).finally(() => {
        loading.value = false
      })
  }
  // 获取表格数据
  const getTableData = () => onRequest({
    pagination: pagination.value,
    queryParams: queryParams.value
  })
  const handleSearch = () => {
    getTableData()
  }
  const resetSearch = () => {
    queryParams.value = {}
    getTableData()
  }
  const handleFinish = () => {
    getTableData()
  }
  onMounted(() => {
    handleSearch()
  })
  return {
    loading,
    pagination,
    queryParams,
    pageOptions,
    tableData,
    recordDetailDialog,
    showAddForm,
    showEditForm,
    onRequest,
    getTableData,
    handleSearch,
    resetSearch,
    handleFinish
  }
}
