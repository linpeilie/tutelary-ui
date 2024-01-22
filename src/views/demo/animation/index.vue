<script setup lang="ts">
import { shuffle } from 'lodash-es'

interface NumItem {
  id: number
  num: number
}
const numList = ref<NumItem[]>(Array.from({ length: 81 }).fill(undefined).map((item, index) => ({ id: index, num: index % 9 + 1 })))
</script>

<template>
  <CommonPage :show-footer="true">
    <n-button type="primary" @click="numList = shuffle(numList)">
      打乱
    </n-button>
    <transition-group tag="ul" move-class="transition-500" mt-15 w-510 f-c-c flex-wrap rounded-15 bg-white p-30 dark:bg-dark>
      <li v-for="item in numList" :key="item.id" m-5 h-40 w-40 f-c-c border-1 rounded-full color-primary bc-ccc>
        {{ item.num }}
      </li>
    </transition-group>
  </CommonPage>
</template>
