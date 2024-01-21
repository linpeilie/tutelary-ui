<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { NDataTable } from 'naive-ui'
import QueryBar from '@/components/queryBar/QueryBar.vue'

const props = defineProps({
  /**
   * @remote true: 后端分页  false： 前端分页
   */
  remote: {
    type: Boolean,
    default: true,
  },
  autoSearch: {
    type: Boolean,
    default: true,
  },
  /**
   * @remote 是否分页
   */
  isPagination: {
    type: Boolean,
    default: true,
  },
  scrollX: {
    type: Number,
    default: 1200,
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  columns: {
    type: Array,
    required: true,
  },
  /** queryBar中的参数 */
  queryItems: {
    type: Object,
    default() {
      return {}
    },
  },
  /** 补充参数（可选） */
  extraParams: {
    type: Object,
    default() {
      return {}
    },
  },
  /**
   * 约定接口入参出参
   * * 分页模式需约定分页接口入参
   *    @pageSize  分页参数：一页展示多少条，默认10
   *    @pageIndex 分页参数：页码，默认1
   * * 需约定接口出参
   *    @records  分页模式必须,非分页模式如果没有pageData则取上一层data
   *    @total    分页模式必须，非分页模式如果没有total则取上一层data.length
   */
  getData: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:queryItems', 'onChecked', 'onDataChange'])
const loading = ref(false)
const initQuery = { ...props.queryItems }
const tableData = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  prefix({ itemCount }) {
    return `总数：${itemCount}`
  },
})

async function handleQuery() {
  try {
    loading.value = true
    let paginationParams = {}
    // 如果非分页模式或者使用前端分页,则无需传分页参数
    if (props.isPagination && props.remote)
      paginationParams = { pageIndex: pagination.page, pageSize: pagination.pageSize }

    const data = await props.getData({ ...props.queryItems, ...props.extraParams, ...paginationParams })
    tableData.value = data?.records || data
    pagination.itemCount = data.total ?? data.length
  }
  catch (error) {
    tableData.value = []
    pagination.itemCount = 0
  }
  finally {
    emit('onDataChange', tableData.value)
    loading.value = false
  }
}
function handleSearch() {
  pagination.page = 1
  handleQuery()
}
async function handleReset() {
  const queryItems = { ...props.queryItems }
  for (const key in queryItems) queryItems[key] = ''

  emit('update:queryItems', { ...queryItems, ...initQuery })
  await nextTick()
  pagination.page = 1
  handleQuery()
}
function onPageChange(currentPage) {
  pagination.page = currentPage
  if (props.remote)
    handleQuery()
}

function onPageSizeChange(currentPageSize) {
  pagination.pageSize = currentPageSize
  pagination.page = 1
  if (props.remote)
    handleQuery()
}

function onChecked(rowKeys) {
  if (props.columns.some(item => item.type === 'selection'))
    emit('onChecked', rowKeys)
}

onMounted(() => {
  if (props.autoSearch)
    handleSearch()
})

defineExpose({
  handleSearch,
  handleReset,
})
</script>

<template>
  <QueryBar v-if="$slots.queryBar" mb-30 @search="handleSearch" @reset="handleReset">
    <slot name="queryBar" />
  </QueryBar>

  <NDataTable
    :remote="remote" :loading="loading" :scroll-x="scrollX" :columns="columns" :data="tableData"
    :row-key="(row) => row[rowKey]" :pagination="isPagination ? pagination : false" @update:checked-row-keys="onChecked"
    @update:page="onPageChange" @update:page-size="onPageSizeChange"
  />
</template>
