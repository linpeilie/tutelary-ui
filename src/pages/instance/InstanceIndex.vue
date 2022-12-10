<template>
  <q-page padding class="q-gutter-y-md">
    <q-card class="q-py-md items-center">
      <div class="row items-center">
        <q-icon name="grain" class="text-h4" left right></q-icon>
        <div class="text-h5 q-mr-md">{{ instanceInfo.appName }}</div>
        <q-chip square color="secondary" text-color="white">{{ instanceInfo.instanceId }}</q-chip>
      </div>
      <descriptions :column="3">
        <description-item label="IP" :content="instanceInfo.ip"/>
        <description-item label="Start Date" :content="instanceInfo.startTime"/>
        <description-item label="Register Date" :content="instanceInfo.registerDate"/>
        <description-item label="VmName" :content="instanceInfo.vmName"/>
        <description-item label="VmVendor" :content="instanceInfo.vmVendor"/>
        <description-item label="Jdk Version" :content="instanceInfo.jdkVersion"/>
      </descriptions>
    </q-card>

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
                 :icon="tabItem.icon"
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
import InstanceOverview from './tabs/InstanceOverview.vue'
import InstanceJvm from './tabs/InstanceJvm.vue'

const instanceOverview = shallowRef(InstanceOverview)
const instanceJvm = shallowRef(InstanceJvm)

const route = useRoute()
const router = useRouter()

const instanceId = route.params.instanceId

const instanceInfo = ref({})

onMounted(() => {
  if (!instanceId) {
    router.push('/')
    return
  }
  getAction('/api/instance/detail', {
    instanceId: instanceId
  }).then(res => {
    instanceInfo.value = res.data.data
  })
})

provide('instanceId', instanceId)

const tabOptions = ref([
  {
    label: '实例面板',
    value: 'Dashboard',
    icon: 'dashboard',
    component: instanceOverview
  },
  {
    label: 'JVM信息',
    value: 'JvmInfo',
    icon: 'memory',
    component: instanceJvm
  },
  {
    label: '线程信息',
    value: 'ThreadList',
    icon: 'analytics'
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
