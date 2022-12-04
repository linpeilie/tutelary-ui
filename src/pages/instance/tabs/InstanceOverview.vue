<template>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-7 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="threadStatisticRef"></div>
      </q-responsive>
    </q-card>
    <q-card bordered flat class="col-md-4 col-xs-11 q-ma-md q-pa-md">
      <q-list separator>
        <q-item>
          <q-item-section class="text-grey">Host Name</q-item-section>
          <q-item-section>linpldeiMac.lan</q-item-section>
        </q-item>
        <q-item>
          <q-item-section class="text-grey">OS Name</q-item-section>
          <q-item-section>Mac OS</q-item-section>
        </q-item>
        <q-item>
          <q-item-section class="text-grey">Available Processors</q-item-section>
          <q-item-section>12</q-item-section>
        </q-item>
        <q-item>
          <q-item-section class="text-grey">Physical Memory</q-item-section>
          <q-item-section>
            <q-linear-progress rounded :value="0.4" size="xl" color="amber-4">
              <div class="absolute-center flex flex-center text-black">23Mb / 422Mb</div>
            </q-linear-progress>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section class="text-grey">Swap Space</q-item-section>
          <q-item-section>
            <q-linear-progress rounded :value="0.4" size="xl" color="lime-4">
              <div class="absolute-center flex flex-center text-black">23Mb / 422Mb</div>
            </q-linear-progress>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section class="text-grey">Disk Space</q-item-section>
          <q-item-section>
            <q-linear-progress rounded :value="888516976/999871418368" size="xl" color="light-4">
              <div class="absolute-center flex flex-center text-black">23Mb / 422Mb</div>
            </q-linear-progress>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </div>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-6 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="5/2" style="min-height: 200px">
        <div ref="heapMemoryStatisticRef"></div>
      </q-responsive>
    </q-card>
    <q-card bordered flat class="col-md-5 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="15/7" style="min-height: 200px">
        <div ref="garbageCollectorRef"></div>
      </q-responsive>
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
let garbageCollectorChart

// ref
const threadStatisticRef = ref()
const heapMemoryStatisticRef = ref()
const garbageCollectorRef = ref()

onMounted(() => {
  threadStatisticChart = echarts.init(threadStatisticRef.value)
  heapMemoryStatisticChart = echarts.init(heapMemoryStatisticRef.value)
  garbageCollectorChart = echarts.init(garbageCollectorRef.value)
  loadData()
  window.onresize = () => {
    if (threadStatisticChart) {
      threadStatisticChart.resize()
    }
    if (heapMemoryStatisticChart) {
      heapMemoryStatisticChart.resize()
    }
    if (garbageCollectorChart) {
      garbageCollectorChart.resize()
    }
  }
})


const loadData = () => {
  const param = {
    instanceId: instanceId,
    reportStartTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    reportEndTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  postAction('/api/instance/statistic/overview', param).then(res => {
    console.log('overview res ', res)
    // thread statistic
    const data = res.data.data
    const threadStatistic = data.threadStatistic
    refreshThreadStatistic(threadStatistic)
    refreshHeapMemoryChart(data.heapMemory)
    refreshGarbageCollectorChart(data.garbageCollectors)
  }).finally(() => {
  })
}

const refreshGarbageCollectorChart = (garbageCollectors) => {
  const reportTime = garbageCollectors[0].reportTimestamps.map(timestamp => {
    return dayjs(timestamp).format('MM/DD HH:mm')
  })
  const option = {
    title: { text: 'Garbage Collectors' },
    legend: {
      data: garbageCollectors.map(item => item.name)
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
        dataView: {readOnly: false},
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
  garbageCollectorChart.setOption(option)
}

const refreshHeapMemoryChart = (heapMemoryList) => {
  const reportTime = heapMemoryList[0].reportTimestamps
  const option = {
    title: {text: 'Heap Memory'},
    legend: {
      data: heapMemoryList.map(item => item.name)
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
        dataView: {readOnly: false},
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
      {type: 'value'}
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
  heapMemoryStatisticChart.setOption(option)
}

const refreshThreadStatistic = (threadStatistic) => {
  const reportTime = threadStatistic.reportTimestamps
  const option = {
    title: {text: 'Thread Statistic'},
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
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      data: reportTime
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'ThreadCount', type: 'line', smooth: true, symbol: 'none',
        data: threadStatistic.threadCount.map((currentValue, index) => {
          return [reportTime[index], currentValue]
        })
      },
      {
        name: 'DaemonThreadCount', type: 'line', smooth: true, symbol: 'none',
        data: threadStatistic.daemonThreadCount.map((currentValue, index) => {
          return [reportTime[index], currentValue]
        })
      }
    ]
  }
  threadStatisticChart.setOption(option)
}


</script>

<style scoped>

</style>
