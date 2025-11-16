<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fetchInstanceDetail } from '@/service/api/instance';
import { $t } from '@/locales';
import InstanceInfoCard from '@/views/app/instance_detail/modules/instance-info-card.vue';

const route = useRoute();
const instanceDetail: Ref<Api.Instance.InstanceInfo | undefined> = ref();

onMounted(() => {
  fetchInstanceDetail(route.params.instanceId as string).then(res => {
    if (res.data) {
      instanceDetail.value = res.data;
    }
  });
});
</script>

<template>
  <AppPage>
    <template #header>
      <div class="font-bold">
        <span class="text-gray">{{ instanceDetail?.appName }}</span>
        <span>/</span>
        <span>{{ instanceDetail?.instanceId }}</span>
      </div>
    </template>
    <NCard size="small">
      <template #header>
        <NSpace align="center">
          <SvgIcon icon="ri:information-2-fill" />
          {{ $t('page.instance.instanceInfo') }}
        </NSpace>
      </template>
      <InstanceInfoCard v-if="instanceDetail" :instance="instanceDetail" />
    </NCard>
  </AppPage>
</template>

<style scoped></style>
