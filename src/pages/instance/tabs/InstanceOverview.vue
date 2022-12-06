<template>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-7 col-xs-11 q-ma-md q-pa-md">
      <q-responsive :ratio="7/2" style="min-height: 300px">
        <div ref="threadStatisticRef"></div>
      </q-responsive>
    </q-card>
    <q-card bordered flat class="col-md-4 col-xs-11 q-ma-md q-pa-md">

      <descriptions :column="1">
        <description-item label="Available Processors" :content="host.availableProcessors">
        </description-item>
      </descriptions>

      <q-list separator>
        <q-item>
          <q-item-section class="text-grey">Physical Memory</q-item-section>
          <q-item-section>
            <q-linear-progress rounded
                               :value="(host.totalPhysicalMemorySize - host.freePhysicalMemorySize) / host.totalPhysicalMemorySize"
                               size="18px" color="amber-4">
              <div class="absolute-full flex flex-center text-black text-caption">
                {{ $memoryFormat(host.totalPhysicalMemorySize - host.freePhysicalMemorySize) }} / {{ $memoryFormat(host.totalPhysicalMemorySize) }}
              </div>
            </q-linear-progress>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section class="text-grey">Swap Space</q-item-section>
          <q-item-section>
            <q-linear-progress rounded :value="(host.totalSwapSpaceSize - host.freeSwapSpaceSize) / host.totalSwapSpaceSize" size="18px" color="lime-4">
              <div class="absolute-full flex flex-center text-black text-caption">
                {{ $memoryFormat(host.totalSwapSpaceSize - host.freeSwapSpaceSize) }} / {{ $memoryFormat(host.totalSwapSpaceSize) }}
              </div>
            </q-linear-progress>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section class="text-grey">Disk Space</q-item-section>
          <q-item-section>
            <q-linear-progress rounded :value="(host.diskFreeSpace) / host.diskTotalSpace" size="18px" color="lime-4">
              <div class="absolute-full flex flex-center text-black text-caption">
                {{ $memoryFormat(host.diskFreeSpace) }} / {{ $memoryFormat(host.diskTotalSpace) }}
              </div>
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

const host = ref({})

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
    host.value = data.host
    refreshThreadStatistic(data.threadStatistic)
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
  console.log(heapMemorySeries)
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
    series: heapMemorySeries
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
