<template>
  <div class="row items-center justify-end q-mx-md">
    <t-datetime-picker v-model="statisticTime" :shortcuts="shortcuts"/>
    <q-btn class="q-mx-md" color="primary" label="刷新" icon="refresh" @click="loadData"/>
    <div class="row column items-end">
      <div class="text-grey">更新时间：{{ statisticCurrentTime }}</div>
      <div class="text-grey" v-if="statisticLatestTime">最新数据时间：{{ statisticLatestTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, defineEmits, onMounted } from 'vue'
import {date} from "quasar";

const props = defineProps({
  statisticLatestTime: { type: String, required: false }
})

const emit = defineEmits(['loadData'])

const statisticTime = ref([])

const statisticCurrentTime = ref('')

const shortcuts = [
  {
    text: 'Last 15 Minutes',
    value: () => {
      const end = Date.now()
      const start = date.subtractFromDate(end, {minute: 15})
      return [start, end]
    }
  },
  {
    text: 'Last 30 Minutes',
    value: () => {
      const end = Date.now()
      const start = date.subtractFromDate(end, {minute: 30})
      return [start, end]
    }
  },
  {
    text: 'Last Hour',
    value: () => {
      const end = Date.now()
      const start = date.subtractFromDate(end, {hour: 1})
      return [start, end]
    },
    default: true
  },
  {
    text: 'Last Day',
    value: () => {
      const end = Date.now()
      const start = date.subtractFromDate(end, {day: 1})
      return [start, end]
    }
  },
  {
    text: 'Last 3 Days',
    value: () => {
      const end = Date.now()
      const start = date.subtractFromDate(end, {day: 3})
      return [start, end]
    }
  }
]

const loadData = () => {
  emit('loadData', statisticTime)
  statisticCurrentTime.value = date.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  let now = Date.now()
  statisticTime.value.push(date.subtractFromDate(now, { hours: 1 }))
  statisticTime.value.push(now)
  loadData()
})

</script>

<style scoped>

</style>
