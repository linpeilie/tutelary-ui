<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fetchInstanceDetail } from '@/service/api/instance';
import { $t } from '@/locales';
import InstanceInfoCard from '@/views/app/instance_detail/modules/instance-info-card.vue';
import type { OptionsType } from '@/components/custom/types/t-segmented';
import TSegmented from '@/components/custom/t-segmented.vue';

const route = useRoute();
const instanceDetail: Ref<Api.Instance.InstanceInfo | undefined> = ref();

const tabs: OptionsType[] = [
  { label: '面板', value: 'dashboard' },
  { label: '系统', value: 'system' },
  { label: '线程', value: 'thread' },
  { label: 'JvmMemory', value: 'jvmMemory' },
  { label: '反编译', value: 'jad' },
  { label: 'VmOption', value: 'vmOption' },
  { label: '日志', value: 'logger' },
  { label: 'Trace', value: 'trace' },
  { label: 'Stack', value: 'stack' },
  { label: 'Watch', value: 'watch' },
  { label: 'Monitor', value: 'monitor' },
  { label: 'Class Explorer', value: 'classExplorer' },
  { label: 'TimeTunnel', value: 'timeTunnel' },
  { label: 'OGNL', value: 'ognl' },
  { label: 'Profiler', value: 'profiler' },
  { label: 'JFR', value: 'jfr' },
  { label: '变更记录', value: 'record' }
];

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
    <NCard size="small" class="mt-3">
      <NScrollbar x-scrollable>
        <TSegmented style="width: 100%" :options="tabs" />
      </NScrollbar>
    </NCard>
  </AppPage>
</template>

<style scoped></style>
