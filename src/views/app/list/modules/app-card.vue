<script setup lang="ts">
import { useRouter } from 'vue-router';
import { $t } from '@/locales';

const router = useRouter();

defineOptions({
  name: 'AppCard'
});

interface Props {
  app: Api.Application.AppInfo;
}

const props = defineProps<Props>();

function handleClick() {
  router.push({name: 'appDetail', params: { appName: props.app.appName }})
}
</script>

<template>
  <NCard :bordered="false" hoverable class="cursor-pointer" @click="handleClick">
    <NSpace align="center">
      <SvgIcon icon="duo-icons:app" style="font-size: 2.5rem;" />
      <div>
        <p style="font-size: 1rem;font-weight: bolder">{{ props.app.appName }}</p>
        <p class="text-gray-500">{{ $t('page.app.registerTime') + ' : ' + props.app.registerDate }}</p>
      </div>
    </NSpace>
    <NDivider />
    <NSpace justify="space-between">
      <NSpace align="center">
        <svg-icon icon="solar:server-line-duotone"/>
        <span class="text-gray-500">{{ $t('page.app.instanceCount') }}</span>
      </NSpace>
      <NText type="info">
        {{ props.app.instanceNum || 0 }}
      </NText>
    </NSpace>
  </NCard>
</template>

<style>
.n-divider:not(.n-divider--vertical) {
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>
