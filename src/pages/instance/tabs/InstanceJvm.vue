<template>
  <statistic-time-picker
    :statistic-latest-time="statisticLatestTime"
    @load-data="loadData"/>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-5 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="heapMemoryStatisticRef"></div>
      </q-responsive>
    </q-card>
    <q-card bordered flat class="col-md-5 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="nonHeapMemoryStatisticRef"></div>
      </q-responsive>
    </q-card>
  </div>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-5 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="garbageCollectorCountRef"></div>
      </q-responsive>
    </q-card>
    <q-card bordered flat class="col-md-5 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="garbageCollectorTimeRef"></div>
      </q-responsive>
    </q-card>
  </div>
</template>

<script setup>
import {ref, onMounted, inject, computed} from "vue"
import * as echarts from 'echarts/core'
import {date} from 'quasar'
import {postAction} from "src/api/manage"
import StatisticTimePicker from '../components/StatisticTimePicker.vue'

import {
  GridComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent
} from "echarts/components"
import {LineChart} from "echarts/charts"
import {UniversalTransition} from "echarts/features"
import {CanvasRenderer} from "echarts/renderers"

echarts.use([GridComponent, LineChart, CanvasRenderer, UniversalTransition, TitleComponent,
  ToolboxComponent, TooltipComponent, LegendComponent])

// echarts instance
let heapMemoryStatisticChart
let nonHeapMemoryStatisticChart
let garbageCollectorCountChart
let garbageCollectorTimeChart

// ref
const heapMemoryStatisticRef = ref()
const nonHeapMemoryStatisticRef = ref()
const garbageCollectorCountRef = ref()
const garbageCollectorTimeRef = ref()

const instanceId = inject('instanceId')

const statisticLatestTime = computed(() => {
  return ''
})

const loadData = (statisticTimes) => {
  const param = {
    instanceId: instanceId,
    reportStartTime: date.formatDate(statisticTimes.value[0], 'YYYY-MM-DD HH:mm:ss'),
    reportEndTime: date.formatDate(statisticTimes.value[1], 'YYYY-MM-DD HH:mm:ss')
  }
  postAction('/api/instance/statistic/jvm', param).then(res => {
    console.log('res', res)
    refreshHeapMemoryChart(res.data.data.heapMemory)
    refreshNonHeapMemoryChart(res.data.data.nonHeapMemory)
    refreshGarbageCollectorCountChart(res.data.data.garbageCollectors)
    refreshGarbageCollectorTimeChart(res.data.data.garbageCollectors)
  })
}

const refreshGarbageCollectorTimeChart = (garbageCollectors) => {
  if (!garbageCollectors || garbageCollectors.length === 0) {
    garbageCollectorTimeChart.clear()
    return
  }
  const reportTime = garbageCollectors[0].reportTimestamps.map(timestamp => {
    return date.formatDate(timestamp, 'MM/DD HH:mm')
  })
  const option = {
    title: { text: 'Garbage Collectors Times' },
    legend: {
      data: garbageCollectors.map(item => item.name),
      bottom: 0
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      show: true,
      showTitle: true,
      feature: {
        dataZoom: {
          yAxisIndex: false
        },
        dataView: { readOnly: false },
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: reportTime
    },
    yAxis: { type: 'value' },
    series: garbageCollectors.map(item => {
      return {
        name: item.name,
        type: 'line',
        data: item.collectionTimes
      }
    })
  }
  garbageCollectorTimeChart.setOption(option)
}

const refreshGarbageCollectorCountChart = (garbageCollectors) => {
  if (!garbageCollectors || garbageCollectors.length === 0) {
    garbageCollectorCountChart.clear()
    return
  }
  const reportTime = garbageCollectors[0].reportTimestamps.map(timestamp => {
    return date.formatDate(timestamp, 'MM/DD HH:mm')
  })
  const option = {
    title: { text: 'Garbage Collectors Count' },
    legend: {
      data: garbageCollectors.map(item => item.name),
      bottom: 0
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      show: true,
      showTitle: true,
      feature: {
        dataZoom: {
          yAxisIndex: false
        },
        dataView: { readOnly: false },
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: reportTime
    },
    yAxis: { type: 'value' },
    series: garbageCollectors.map(item => {
      return {
        name: item.name,
        type: 'line',
        data: item.collectionCounts
      }
    })
  }
  garbageCollectorCountChart.setOption(option)
}

const refreshNonHeapMemoryChart = (nonHeapMemoryList) => {
  const reportTime = nonHeapMemoryList?.[0].reportTimestamps
  if(!reportTime || reportTime.length === 0) {
    nonHeapMemoryStatisticChart.clear()
    return
  }
  const nonHeapMemorySeries = nonHeapMemoryList.map(item => {
    return {
      name: item.name,
      type: 'line',
      emphasis: {
        focus: 'series'
      },
      data: item.used.map((currentValue, index) => {
        return [reportTime[index], currentValue]
      }),
      smooth: true,
      symbol: 'none'
    }
  })
  const option = {
    title: { text: 'NonHeap Memory' },
    legend: {
      data: nonHeapMemoryList.map(item => item.name),
      bottom: 0
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      show: true,
      showTitle: true,
      feature: {
        dataZoom: {
          yAxisIndex: false
        },
        dataView: { readOnly: false },
        saveAsImage: {}
      }
    },
    xAxis: [
      {
        type: 'time',
        boundaryGap: false,
        data: reportTime
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: { formatter: `{value} MB` }
      }
    ],
    series: nonHeapMemorySeries
  }
  nonHeapMemoryStatisticChart.setOption(option)
}

const refreshHeapMemoryChart = (heapMemoryList) => {
  const reportTime = heapMemoryList?.[0].reportTimestamps
  if(!reportTime || reportTime.length === 0) {
    heapMemoryStatisticChart.clear()
    return
  }
  const heapMemorySeries = heapMemoryList.map(item => {
    return {
      name: item.name,
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: item.used.map((currentValue, index) => {
        return [reportTime[index], currentValue]
      }),
      smooth: true,
      symbol: 'none'
    }
  })
  const len = heapMemoryList.length
  const totalMemorySeries = {
    name: 'Committed',
    type: 'line',
    data: heapMemoryList[0].committed.map((currentValue, index) => {
      for (let i = 1; i < len; i++) {
        currentValue += heapMemoryList[i].committed[index]
      }
      return [reportTime[index], currentValue]
    }),
    smooth: true,
    symbol: 'none'
  }
  heapMemorySeries.push(totalMemorySeries)
  const maxMemorySeries = {
    name: 'Max',
    type: 'line',
    data: heapMemoryList[0].committed.map((currentValue, index) => {
      for (let i = 1; i < len; i++) {
        currentValue += heapMemoryList[i].max[index]
      }
      return [reportTime[index], currentValue]
    }),
    smooth: true,
    symbol: 'none'
  }
  heapMemorySeries.push(maxMemorySeries)
  const option = {
    title: { text: 'Heap Memory' },
    legend: {
      data: heapMemoryList.map(item => item.name).concat(['Committed', 'Max']),
      bottom: 0
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      show: true,
      showTitle: true,
      feature: {
        dataZoom: {
          yAxisIndex: false
        },
        dataView: { readOnly: false },
        saveAsImage: {}
      }
    },
    xAxis: [
      {
        type: 'time',
        boundaryGap: false,
        data: reportTime
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: { formatter: `{value} MB` }
      }
    ],
    series: heapMemorySeries
  }
  heapMemoryStatisticChart.setOption(option)
}

onMounted(() => {
  heapMemoryStatisticChart = echarts.init(heapMemoryStatisticRef.value)
  nonHeapMemoryStatisticChart = echarts.init(nonHeapMemoryStatisticRef.value)
  garbageCollectorCountChart = echarts.init(garbageCollectorCountRef.value)
  garbageCollectorTimeChart = echarts.init(garbageCollectorTimeRef.value)
  window.onresize = () => {
    if (heapMemoryStatisticChart) {
      heapMemoryStatisticChart.resize()
    }
    if (nonHeapMemoryStatisticChart) {
      nonHeapMemoryStatisticChart.resize()
    }
    if (garbageCollectorCountChart) {
      garbageCollectorCountChart.resize()
    }
    if (garbageCollectorTimeChart) {
      garbageCollectorTimeChart.resize()
    }
  }
})

</script>

<style scoped>

</style>
