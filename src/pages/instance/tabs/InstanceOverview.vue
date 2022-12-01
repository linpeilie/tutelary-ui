<template>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-7 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="threadStatisticRef"></div>
      </q-responsive>
    </q-card>
    <q-card bordered flat class="col-md-4 col-xs-11 q-ma-md q-pa-md">

    </q-card>
  </div>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-7 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="heapMemoryStatisticRef"></div>
      </q-responsive>
    </q-card>
    <q-card bordered flat class="col-md-4 col-xs-11 q-ma-md q-pa-md">

    </q-card>
  </div>
</template>

<script setup>
import {ref, onMounted, inject} from 'vue'
import * as echarts from 'echarts/core'
import {
  GridComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent
} from 'echarts/components'
import {LineChart, BarChart} from 'echarts/charts'
import {UniversalTransition} from 'echarts/features'
import {CanvasRenderer} from 'echarts/renderers'
import {postAction} from "src/api/manage";
import dayjs from "dayjs";

const instanceId = inject('instanceId')

echarts.use([GridComponent, LineChart, CanvasRenderer, UniversalTransition, TitleComponent,
  ToolboxComponent, TooltipComponent, LegendComponent, BarChart])

// echarts instance
let threadStatisticChart
let heapMemoryStatisticChart

// ref
const threadStatisticRef = ref()
const heapMemoryStatisticRef = ref()

onMounted(() => {
  threadStatisticChart = echarts.init(threadStatisticRef.value)
  heapMemoryStatisticChart = echarts.init(heapMemoryStatisticRef.value)
  loadData()
  window.onresize = () => {
    if (threadStatisticChart) {
      threadStatisticChart.resize()
    }
  }
})


const loadData = () => {
  const param = {
    instanceId: instanceId,
    reportStartTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    reportEndTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  postAction('/api/instance/overview', param).then(res => {
    console.log('overview res ', res)
    // thread statistic
    const data = res.data.data
    const threadStatistic = data.threadStatistic
    refreshThreadStatistic(threadStatistic)
    refreshHeapMemoryChart(data.heapMemory)
  }).finally(() => {
  })
}

const refreshHeapMemoryChart = (heapMemoryList) => {
  const reportTime = heapMemoryList[0].reportTimestamps
  const option = {
    title: { text: 'Heap Memory' },
    legend: {
      data: heapMemoryList.map(item => item.name)
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    toolbox: {
      feature: {
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
      { type: 'value' }
    ],
    series: heapMemoryList.map(item => {
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
  }
  console.log('option', option)
  heapMemoryStatisticChart.setOption(option)
}

const refreshThreadStatistic = (threadStatistic) => {
  const option = {
    title: { text: 'Thread Statistic' },
    legend: {
      data: ['ThreadCount', 'DaemonThreadCount']
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    toolbox: {
      show: true,
      showTitle: true,
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        dataView: {readOnly: false},
        restore: {},
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: threadStatistic.reportTimestamps
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {name: 'ThreadCount', data: threadStatistic.threadCount, type: 'line', smooth: true, symbol: 'none'},
      {name: 'DaemonThreadCount', data: threadStatistic.daemonThreadCount, type: 'line', smooth: true, symbol: 'none'}
    ]
  }
  threadStatisticChart.setOption(option)
}


</script>

<style scoped>

</style>
