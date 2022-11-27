<template>
  <q-page padding>

    <q-card>
      <q-card-section>
        <q-tabs v-model="selectedTab"
                content-class="t-tabs"
                class="justify-center"
                active-bg-color="white"
                mobile-arrows
                inline-label
                dense>
          <q-tab v-for="tabItem of tabOptions"
                 :key="tabItem.value"
                 :label="tabItem.label"
                 :name="tabItem.value"
                 class="t-tab q-mx-sm"/>
        </q-tabs>
      </q-card-section>
      <q-separator inset/>
      <q-card-section>
        <q-tab-panels v-model="selectedTab" animated>
          <q-tab-panel v-for="tabItem of tabOptions"
                       :key="tabItem.value"
                       :name="tabItem.value">
            <component :is="tabItem.component"/>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, shallowRef, onMounted, provide, readonly } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAction } from 'src/api/manage'
// import InstanceDashboard from './components/InstanceDashboard.vue'
// import InstanceJvmInfo from './components/InstanceJvmInfo.vue'
// import InstanceThreadList from 'pages/instance/components/InstanceThreadList.vue'
import InstanceOverview from './tabs/InstanceOverview.vue'

// const instanceDashboard = shallowRef(InstanceDashboard)
// const instanceJvmInfo = shallowRef(InstanceJvmInfo)
// const instanceThreadList = shallowRef(InstanceThreadList)
const instanceOverview = shallowRef(InstanceOverview)

const route = useRoute()
const router = useRouter()

const instanceId = route.params.instanceId

onMounted(() => {
  console.log('instanceId', instanceId)
  if (!instanceId) {
    router.push('/')
    return
  }
  getAction('/api/instance/detail', {
    instanceId: instanceId
  }).then(res => {
    console.log('res', res)
  })
})

provide('instanceId', readonly(instanceId))

const tabOptions = ref([
  {
    label: '实例面板',
    value: 'Dashboard',
    component: instanceOverview
  },
  {
    label: 'JVM信息',
    value: 'JvmInfo'
    // component: instanceJvmInfo
  },
  {
    label: '线程信息',
    value: 'ThreadList'
    // component: instanceThreadList
  },
  {
    label: '方法追踪',
    value: 'MethodTrace'
  },
  {
    label: '方法监控',
    value: 'MethodMonitor'
  },
  {
    label: '源码查看',
    value: 'SourceCode'
  }
])

const selectedTab = ref('Dashboard')

</script>

<style lang="scss">


.q-tab-panel {
  padding: 0 !important;
}

.q-tabs__content {
  padding: 14px;
}

.q-tab__indicator {
  background: transparent;
}

</style>
