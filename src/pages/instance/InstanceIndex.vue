<template>
  <q-page padding>

    <q-card>

    </q-card>

    <q-tab-panels v-model="selectedTab" animated>
      <q-tab-panel v-for="tabItem of tabOptions"
                   :key="tabItem.value"
                   :name="tabItem.value">
<!--        <component :is="tabItem.component"/>-->
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { ref, shallowRef, onMounted, provide, readonly } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAction } from "src/api/manage"
// import InstanceDashboard from './components/InstanceDashboard.vue'
// import InstanceJvmInfo from './components/InstanceJvmInfo.vue'
// import InstanceThreadList from 'pages/instance/components/InstanceThreadList.vue'

// const instanceDashboard = shallowRef(InstanceDashboard)
// const instanceJvmInfo = shallowRef(InstanceJvmInfo)
// const instanceThreadList = shallowRef(InstanceThreadList)

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

const selectedAppName = ref('')
const selectedInstance = ref('')

provide('instance', readonly(selectedInstance))

const tabOptions = ref([
  {
    label: '实例面板',
    value: 'Dashboard',
    // component: instanceDashboard
  },
  {
    label: 'JVM信息',
    value: 'JvmInfo',
    // component: instanceJvmInfo
  },
  {
    label: '线程信息',
    value: 'ThreadList',
    // component: instanceThreadList
  }
])

const selectedTab = ref('Dashboard')

</script>

<style lang="scss">
.q-tab-panel {
  padding: 0 !important;
  background: #fafafa;
}

.q-tabs__content {
  padding: 14px;
}

.q-tab__indicator {
  background: transparent;
}

</style>
