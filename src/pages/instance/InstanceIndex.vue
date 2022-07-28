<template>
  <q-page>
    <div class="q-pa-md fit">
      <q-card>
        <q-card-section>
          <h1>实例详情</h1>
        </q-card-section>
      </q-card>
    </div>
    <div class="q-pa-md">
      <q-card>
        <q-tabs v-model="selectedTab">
          <q-tab v-for="tabItem of tabOptions"
                 :key="tabItem.value"
                 :label="tabItem.label"
                 :name="tabItem.value"/>
        </q-tabs>
        <q-separator/>
        <q-tab-panels v-model="selectedTab" animated>
          <q-tab-panel v-for="tabItem of tabOptions"
                       :key="tabItem.value"
                       :name="tabItem.value">
            <component :is="tabItem.component"/>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import InstanceDashboard from './components/InstanceDashboard.vue'
import InstanceJvmInfo from './components/InstanceJvmInfo.vue'

const instanceDashboard = shallowRef(InstanceDashboard)
const instanceJvmInfo = shallowRef(InstanceJvmInfo)

const tabOptions = ref([
  {
    label: '实例面板',
    value: 'Dashboard',
    component: instanceDashboard
  },
  {
    label: 'JVM信息',
    value: 'JvmInfo',
    component: instanceJvmInfo
  }
])

const selectedTab = ref('Dashboard')

</script>

<style scoped lang="scss">

</style>
