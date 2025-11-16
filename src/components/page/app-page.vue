<script setup lang="ts">
import { useRoute } from 'vue-router';

defineOptions({
  name: 'AppPage'
});

interface Props {
  showHeader?: boolean;
  title?: string;
  showBackButton?: boolean;
}

withDefaults(defineProps<Props>(), {
  showHeader: true,
  title: undefined,
  showBackButton: true
});

const route = useRoute();
</script>

<template>
  <section class="bg-layout px-5">
    <header v-if="showHeader" class="min-15 min-h-15 flex items-center justify-between">
      <NSpace align="center">
        <NButton v-if="showBackButton" strong>
          <template #icon>
            <NIcon>
              <SvgIcon icon="eva:arrow-back-outline" />
            </NIcon>
          </template>
        </NButton>
        <slot v-if="$slots.header" name="header" />
        <template v-else>
          <h2 class="text-6 font-bold">
            {{ title || route.meta?.title }}
          </h2>
        </template>
      </NSpace>
      <slot name="action" />
    </header>
    <slot />
  </section>
</template>

<style scoped></style>
