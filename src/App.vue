<template>
<!--  <router-view />-->
  <main-layout />
</template>

<script>
import { defineComponent } from 'vue'
import MainLayout from 'layouts/MainLayout.vue'

export default defineComponent({
  name: 'App',
  components: { MainLayout }
})
</script>
