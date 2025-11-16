<script setup lang="ts">
import type { Ref } from 'vue';
import { h, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { DataTableColumns } from 'naive-ui';
import { NButton } from 'naive-ui';
import { fetchAppDetail } from '@/service/api';
import { $t } from '@/locales';
import { useBoolean } from '~/packages/hooks';

const route = useRoute();

const { bool: loading, setTrue: startLoading, setFalse: stopLoading } = useBoolean();

const appDetail: Ref<Api.Application.AppDetail | undefined> = ref();

const instanceTable: DataTableColumns<Api.Instance.InstanceInfo> = [
  { key: 'instanceId', title: $t('page.instance.instanceId') },
  { key: 'ip', title: 'IP' },
  { key: 'registerDate', title: $t('page.instance.registerDate') },
  { key: 'startTime', title: $t('page.instance.startTime') },
  {
    key: 'action',
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => toInstanceDetail(row)
        },
        {
          default: () => $t('common.viewDetail')
        }
      );
    }
  }
];

function fetchData() {
  startLoading();
  fetchAppDetail(route.params.appName as string)
    .then(res => {
      if (res.data) {
        appDetail.value = res.data;
      }
    })
    .finally(() => stopLoading());
}

function toInstanceDetail(instance: Api.Instance.InstanceInfo) {
  console.log(instance);
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <AppPage :title="appDetail?.appName">
    <template #action>
      <NButton secondary @click="fetchData">
        <template #icon>
          <NIcon>
            <SvgIcon icon="tabler:refresh" />
          </NIcon>
        </template>
        {{ $t('common.refresh') }}
      </NButton>
    </template>
    <NDataTable :loading="loading" :columns="instanceTable" :data="appDetail?.instances" />
  </AppPage>
</template>

<style scoped></style>
