<script setup lang="ts">
import { formatMemory } from '@/utils/common';
import type { TDescriptionItemProps } from '@/components/advanced/t-descriptions.vue';
import { $t } from '@/locales';

interface Props {
  instance: Api.Instance.InstanceInfo;
}

const props = defineProps<Props>();

const instanceDescriptions: Array<TDescriptionItemProps<Api.Instance.InstanceInfo>> = [
  { label: $t('page.instance.ip'), value: val => val?.ip },
  { label: $t('page.instance.startTime'), value: val => val?.startTime },
  { label: $t('page.instance.hostName'), value: val => val?.hostName },
  { label: $t('page.instance.jdkVersion'), value: val => val?.jdkVersion },
  { label: $t('page.instance.vmName'), value: val => val?.vmName },
  { label: $t('page.instance.vmVendor'), value: val => val?.vmVendor },
  { label: $t('page.instance.os'), value: val => val?.osName },
  { label: $t('page.instance.availableProcessors'), value: val => val?.availableProcessors },
  { label: $t('page.instance.memorySize'), value: val => formatMemory(val?.memorySize) }
];
</script>

<template>
  <TDescriptions label-placement="top" :items="instanceDescriptions" :val="props.instance" />
</template>

<style scoped></style>
