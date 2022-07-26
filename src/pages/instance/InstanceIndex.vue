<template>
  <q-page>
    <div>
      <q-card class="q-gutter-md bg-grey-1">
        <q-card-section class="row q-gutter-md">
          <q-select
            filled
            autofocus
            v-model="selectedAppName"
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            label="应用"
            :options="appList"
            @filter="filterApp"
            @update:model-value="appUpdated"
            style="width: 250px"
          />
          <q-select
            filled
            hide-selected
            v-model="selectedInstance"
            use-input
            fill-input
            input-debounce="0"
            label="应用实例"
            :options="instanceList"
            @filter="filterInstance"
            @update:model-value="instanceUpdated"
            style="width: 450px"
          />
        </q-card-section>

        <q-card-section v-if="selectedInstance">
          <descriptions :column="1" content-class="bg-grey-1">
            <description-item label="App Name" :content="selectedInstance.appName"/>
            <description-item label="IP" :content="selectedInstance.ip"/>
            <description-item label="Register Date" :content="selectedInstance.registerDate"/>
          </descriptions>
        </q-card-section>

        <q-tabs v-model="selectedTab" align="left" active-class="shadow-3">
          <q-tab v-for="tabItem of tabOptions"
                 class="rounded-borders"
                 :key="tabItem.value"
                 :label="tabItem.label"
                 :name="tabItem.value"/>
        </q-tabs>
      </q-card>
    </div>
    <q-tab-panels v-model="selectedTab" animated>
      <q-tab-panel v-for="tabItem of tabOptions"
                   :key="tabItem.value"
                   :name="tabItem.value">
        <component :is="tabItem.component"/>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { ref, shallowRef, onMounted, provide, readonly } from 'vue'
import { getAction, postAction } from 'src/api/manage'
import InstanceDashboard from './components/InstanceDashboard.vue'
import InstanceJvmInfo from './components/InstanceJvmInfo.vue'
import InstanceThreadList from 'pages/instance/components/InstanceThreadList.vue'

const instanceDashboard = shallowRef(InstanceDashboard)
const instanceJvmInfo = shallowRef(InstanceJvmInfo)
const instanceThreadList = shallowRef(InstanceThreadList)

const originalAppList = ref([])
const originalInstanceList = ref([])

const appList = ref([])
const instanceList = ref([])

const selectedAppName = ref('')
const selectedInstance = ref('')

provide('instance', readonly(selectedInstance))

const filterApp = (val, update, abort) => {
  update(() => {
    if (val === '') {
      appList.value = originalAppList.value
    } else {
      const needle = val.toLowerCase()
      appList.value = originalAppList.value.filter(v => v.toLowerCase().indexOf(needle) > -1)
    }
  })
}

const filterInstance = (val, update, abort) => {
  update(() => {
    if (val === '') {
      instanceList.value = originalInstanceList.value
    } else {
      const needle = val.toLowerCase()
      instanceList.value = originalInstanceList.value.filter(v => v.toLowerCase().indexOf(needle) > -1)
    }
  })
}

const appUpdated = (appName) => {
  postAction('/api/instance/list', { appName })
    .then(res => {
      originalInstanceList.value = res.data.data.map(v => {
        return {
          ...v,
          label: v.instanceId + ' - ' + v.ip
        }
      })
    })
}

const instanceUpdated = (instance) => {
}

onMounted(() => {
  postAction('/api/app/list', {})
    .then(res => {
      originalAppList.value = res.data.data.map(v => v.appName)
      appList.value = originalAppList.value
    })
})

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
  },
  {
    label: '线程信息',
    value: 'ThreadList',
    component: instanceThreadList
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
