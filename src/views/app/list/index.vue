<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, ref } from 'vue';
import { fetchAppList } from '@/service/api';
import AppCard from '@/views/app/list/modules/app-card.vue';
import { useBoolean } from '~/packages/hooks';

const appList: Ref<Api.Application.AppInfo[]> = ref([]);
const { bool: loading, setTrue: startLoading, setFalse: stopLoading } = useBoolean();

onMounted(() => {
  startLoading();
  fetchAppList()
    .then(res => {
      if (res.data) {
        appList.value = res.data;
      }
    })
    .finally(() => stopLoading());
});


</script>

<template>
  <div>
    <NSpin :show="loading">
      <div v-if="appList.length === 0" class="empty-state">
        <div class="i-lucide-inbox text-6xl text-gray-400 mb-4"></div>
        <p class="text-gray-400 text-lg">暂无应用数据</p>
      </div>
      <NGrid v-else cols="2 800:3 1200:4">
        <NGridItem>
          <AppCard v-for="item in appList" :key="item.appName" :app="item" />
        </NGridItem>
      </NGrid>
    </NSpin>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 3rem;
}
</style>
