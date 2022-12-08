<template>
  <div class="row items-center justify-end q-mx-md">
    <t-datetime-picker v-model="statisticTime" :shortcuts="shortcuts"/>
    <q-btn class="q-mx-md" color="primary" label="刷新" icon="refresh" @click="loadData"/>
    <div class="row column items-end">
      <div class="text-grey">更新时间：{{ statisticCurrentTime }}</div>
      <div class="text-grey">最新数据时间：{{ date.formatDate(host.reportTimestamps, 'YYYY-MM-DD HH:mm:ss') }}</div>
    </div>
  </div>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-7 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="threadStatisticRef"></div>
      </q-responsive>
    </q-card>
    <q-card bordered flat class="col-md-4 col-xs-11 q-ma-md q-pa-md">

      <descriptions :column="1">
        <description-item label="Host Name" :content="host.hostName" labelClassName="col-5" className="col-7"/>
        <description-item label="Os Name" :content="host.osName" labelClassName="col-5" className="col-7"/>
        <description-item label="Available Processors" :content="host.availableProcessors" labelClassName="col-5"
                          className="col-7"/>
        <description-item label="Physical Memory" labelClassName="col-5" className="col-7">
          <q-linear-progress rounded
                             :value="(host.totalPhysicalMemorySize - host.freePhysicalMemorySize) / host.totalPhysicalMemorySize"
                             size="18px" color="amber-4">
            <div class="absolute-full flex flex-center text-black text-caption">
              {{ $memoryFormat(host.totalPhysicalMemorySize - host.freePhysicalMemorySize) }} /
              {{ $memoryFormat(host.totalPhysicalMemorySize) }}
            </div>
          </q-linear-progress>
        </description-item>
        <description-item label="Swap Space" labelClassName="col-5" className="col-7">
          <q-linear-progress rounded
                             :value="(host.totalSwapSpaceSize - host.freeSwapSpaceSize) / host.totalSwapSpaceSize"
                             size="18px" color="lime-4">
            <div class="absolute-full flex flex-center text-black text-caption">
              {{ $memoryFormat(host.totalSwapSpaceSize - host.freeSwapSpaceSize) }} /
              {{ $memoryFormat(host.totalSwapSpaceSize) }}
            </div>
          </q-linear-progress>
        </description-item>
        <description-item label="Disk Space" labelClassName="col-5" className="col-7">
          <q-linear-progress rounded :value="(host.diskFreeSpace) / host.diskTotalSpace" size="18px" color="lime-4">
            <div class="absolute-full flex flex-center text-black text-caption">
              {{ $memoryFormat(host.diskFreeSpace) }} / {{ $memoryFormat(host.diskTotalSpace) }}
            </div>
          </q-linear-progress>
        </description-item>
      </descriptions>
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
import { ref, onMounted, inject } from 'vue'
import * as echarts from 'echarts/core'
import {
  GridComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent
} from 'echarts/components'
import { LineChart, BarChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { postAction } from 'src/api/manage'
import { date } from 'quasar'
import { divide } from "src/utils/math";

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

const host = ref({})

const statisticTime = ref([])

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
    }
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

const statisticCurrentTime = ref('')

onMounted(() => {
  threadStatisticChart = echarts.init(threadStatisticRef.value)
  heapMemoryStatisticChart = echarts.init(heapMemoryStatisticRef.value)
  garbageCollectorChart = echarts.init(garbageCollectorRef.value)
  let now = Date.now()
  statisticTime.value.push(date.subtractFromDate(now, { days: 1 }))
  statisticTime.value.push(now)
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
    reportStartTime: date.formatDate(statisticTime.value[0], 'YYYY-MM-DD HH:mm:ss'),
    reportEndTime: date.formatDate(statisticTime.value[1], 'YYYY-MM-DD HH:mm:ss')
  }
  postAction('/api/instance/statistic/overview', param).then(res => {
    statisticCurrentTime.value = date.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss')
    const data = res.data.data
    host.value = data.host
    refreshThreadStatistic(data.threadStatistic)
    refreshHeapMemoryChart(data.heapMemory)
    refreshGarbageCollectorChart(data.garbageCollectors)
  }).finally(() => {
  })
}

const refreshGarbageCollectorChart = (garbageCollectors) => {
  if (!garbageCollectors || garbageCollectors.length === 0) {
    garbageCollectorChart.clear()
    return
  }
  const reportTime = garbageCollectors[0].reportTimestamps.map(timestamp => {
    return date.formatDate(timestamp, 'MM/DD HH:mm')
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
  garbageCollectorChart.setOption(option)
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
  const option = {
    title: { text: 'Heap Memory' },
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

const refreshThreadStatistic = (threadStatistic) => {
  const reportTime = threadStatistic?.reportTimestamps
  if (!reportTime || reportTime.length === 0) {
    threadStatisticChart.clear()
    return
  }
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
        dataView: { readOnly: false },
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
        name: 'ThreadCount',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: threadStatistic.threadCount.map((currentValue, index) => {
          return [reportTime[index], currentValue]
        })
      },
      {
        name: 'DaemonThreadCount',
        type: 'line',
        smooth: true,
        symbol: 'none',
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
