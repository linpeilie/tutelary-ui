<script setup lang="ts">
import { useUserStore } from '@/store'

const userStore = useUserStore()
</script>

<template>
  <AppPage :show-footer="true" min-w-375>
    <div min-w-375 flex-1>
      <n-watermark
        :content="userStore.name"
        cross
        selectable
        :font-size="16"
        :line-height="16"
        :width="192"
        :height="128"
        :x-offset="12"
        :y-offset="28"
        :rotate="-15"
      >
        <n-card rounded-10>
          <div flex items-center>
            <img rounded-full width="60" :src="userStore.avatar">
            <div ml-20>
              <p text-16>
                Hello, {{ userStore.name }} ！
              </p>
              <n-gradient-text
                mt-5 text-12 op-60
                gradient="linear-gradient(90deg, red 0%, green 50%, blue 100%)"
              >
                他日若遂凌云志，敢笑黄巢不丈夫~
              </n-gradient-text>
            </div>
            <div ml-auto hidden items-center md:flex>
              <n-statistic label="待办" :value="4" w-80>
                <template #suffix>
                  / 10
                </template>
              </n-statistic>
              <n-statistic label="Stars" ml-20 w-80>
                <a href="https://github.com/zclzone/qs-admin">
                  <img allt="stars" src="https://badgen.net/github/stars/zclzone/qs-admin">
                </a>
              </n-statistic>
              <n-statistic label="Forks" ml-20 w-80>
                <a href="https://github.com/zclzone/qs-admin">
                  <img allt="forks" src="https://badgen.net/github/forks/zclzone/qs-admin">
                </a>
              </n-statistic>
            </div>
          </div>
        </n-card>
      </n-watermark>

      <n-card title="项目" size="small" :segmented="true" mt-15 rounded-10>
        <template #header-extra>
          <n-button text type="primary">
            更多
          </n-button>
        </template>
        <div flex flex-wrap justify-around>
          <n-card
            v-for="i in 20"
            :key="i"

            mb-10 mt-10 w-300 flex-shrink-0 cursor-pointer hover:card-shadow
            title="Tutelary"
            size="small"
          >
            <p op-60>
              一个基于 Vue3、Vite3、TypeScript、Pinia、Unocss、Naive UI 的轻量级后台管理模板
            </p>
          </n-card>
          <div h-0 w-300 />
          <div h-0 w-300 />
          <div h-0 w-300 />
          <div h-0 w-300 />
        </div>
      </n-card>
    </div>
  </AppPage>
</template>
