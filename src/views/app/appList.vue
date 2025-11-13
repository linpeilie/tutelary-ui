<script setup lang="ts">
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from './AppCard.vue'
import type { AppInfo, AppQueryRequest } from '@/api/types/appTypes'
import appApi from '@/api/appApi'

const router = useRouter()

const queryParams: Ref<AppQueryRequest> = ref<AppQueryRequest>({
  appName: '',
})

const loading = ref(false)
const appList: Ref<AppInfo[]> = ref([])

const filteredAppList = computed(() => {
  if (!queryParams.value.appName) {
    return appList.value
  }
  return appList.value.filter((app: AppInfo) =>
    app.appName.toLowerCase().includes(queryParams.value.appName!.toLowerCase()),
  )
})

onMounted(() => {
  loadAppList()
})

async function loadAppList() {
  loading.value = true
  try {
    const response = await appApi.appList({} as any)
    appList.value = response || []
  }
  catch (error) {
    console.error('加载应用列表失败:', error)
    appList.value = []
  }
  finally {
    loading.value = false
  }
}

function toInstanceList(app: AppInfo) {
  router.push({ name: 'InstanceList', params: { appName: app.appName } })
}
</script>

<template>
  <common-page title="应用列表">
    <template #action>
      <div class="flex items-center gap-4">
        <n-input
          v-model:value="queryParams.appName"
          placeholder="搜索应用名称..."
          class="w-64"
          clearable
        >
          <template #prefix>
            <div class="i-lucide-search text-gray-400" />
          </template>
        </n-input>
        <n-button @click="loadAppList">
          <template #icon>
            <div class="i-lucide-refresh-cw" :class="{ 'animate-spin': loading }" />
          </template>
          刷新
        </n-button>
      </div>
    </template>

    <!-- 应用卡片网格 -->
    <n-spin :show="loading">
      <div v-if="filteredAppList.length === 0" class="empty-state">
        <div class="i-lucide-inbox text-6xl text-gray-400 mb-4" />
        <p class="text-gray-400 text-lg">
          {{ queryParams.appName ? '没有找到匹配的应用' : '暂无应用数据' }}
        </p>
      </div>

      <div v-else class="app-grid">
        <AppCard
          v-for="app in filteredAppList"
          :key="app.appName"
          :app="app"
          @click="toInstanceList"
        />
      </div>
    </n-spin>
  </common-page>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 3rem;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .app-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
