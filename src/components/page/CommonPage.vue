<script setup lang="ts">
interface Props {
  showFooter?: boolean
  showHeader?: boolean
  title?: string
}
withDefaults(defineProps<Props>(), {
  showFooter: false,
  showHeader: true,
  title: undefined,
})

const route = useRoute()
</script>

<template>
  <AppPage :show-footer="showFooter">
    <header v-if="showHeader" mb-15 min-h-45 flex items-center justify-between px-15>
      <slot v-if="$slots.header" name="header" />
      <template v-else>
        <h2 text-22 font-normal>
          {{ title || route.meta?.title }}
        </h2>
        <slot name="action" />
      </template>
    </header>

    <n-card flex-1 rounded-10>
      <slot />
    </n-card>
  </AppPage>
</template>
