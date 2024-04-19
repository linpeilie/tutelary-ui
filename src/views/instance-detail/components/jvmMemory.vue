<script setup lang="ts">
import type { EChartsOption, SeriesOption } from 'echarts'
import { useArrayReduce, useDateFormat } from '@vueuse/core'
import type { SelectBaseOption } from 'naive-ui/es/select/src/interface'
import eventbus from '@/utils/eventbus'
import { commandEnum } from '@/enums/commandEnums'
import commandCreateApi from '@/api/commandCreateApi'
import type { CommandCreateRequest } from '@/api/types/commandCreateTypes'
import type { JvmMemoryResponse } from '@/proto/command/result/JvmMemoryResponse'
import type { JvmMemory } from '@/proto/command/domain/JvmMemory'
import { useEcharts } from '@/composables/useEcharts'
import { div } from '@/utils/common/math'
import type { GarbageCollector } from '@/proto/command/domain/GarbageCollector'

import LimitedCountQueue from '@/utils/queue/LimitedCountQueue'

const props = defineProps({
  instanceId: { type: String, required: true },
})

const limitCount = 6000

const timer = ref()

// 数据刷新时间
const refreshTimestamp = ref<number>()

// 时间线
const timeline = ref<LimitedCountQueue<string>>(new LimitedCountQueue(limitCount))
// 堆内存
const heapMemoryMap: Ref<Map<string, LimitedCountQueue<number>>> = ref(new Map())
// 堆内存折线图配置
const heapMemoryOptions = ref<EChartsOption>()
// 上一次垃圾回收次数
const lastGarbageCollectionCount = ref(new Map())
// 上一次垃圾回收耗时
const lastGarbageCollectionTime = ref(new Map())
// 垃圾回收耗时集合
const garbageCollectionTimeMap: Ref<Map<string, LimitedCountQueue<number | string>>> = ref(new Map())
// 垃圾回收次数集合
const garbageCollectionCountMap: Ref<Map<string, LimitedCountQueue<number | string>>> = ref(new Map())
// 垃圾回收次数折线图配置
const garbageCollectionCountOptions = ref<EChartsOption>()
// 垃圾回收耗时折线图配置
const garbageCollectionTimeOptions = ref<EChartsOption>()
// 非堆内存
const nonHeapMemoryMap: Ref<Map<string, LimitedCountQueue<number>>> = ref(new Map())
// 非堆内存折线图配置
const nonHeapMemoryOptions = ref<EChartsOption>()

// 堆内存折线图
const { domRef: jvmDomRef } = useEcharts(heapMemoryOptions)
// 垃圾回收次数折线图
const { domRef: garbageCollectionCountRef } = useEcharts(garbageCollectionCountOptions)
// 垃圾回收耗时折线图
const { domRef: garbageCollectionTimeRef } = useEcharts(garbageCollectionTimeOptions)
// 非堆内存折线图
const { domRef: nonHeapDomRef } = useEcharts(nonHeapMemoryOptions)

const refreshTimeInterval = ref<number>(10)
const refreshTimeOptions: SelectBaseOption[] = [
  { label: '5 s', value: 5 },
  { label: '10 s', value: 10 },
  { label: '30 s', value: 30 },
  { label: '1 min', value: 60 },
]

onMounted(() => {
  onJvmCommand()
  createJvmMemoryCommand()
  setRefreshTimer(refreshTimeInterval.value)
})

onBeforeUnmount(() => {
  eventbus.off('command')
  if (timer.value)
    clearInterval(timer.value)
})

function setRefreshTimer(interval: number) {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  // 上一次垃圾回收次数
  lastGarbageCollectionCount.value = new Map()
  // 上一次垃圾回收耗时
  lastGarbageCollectionTime.value = new Map()
  // 垃圾回收耗时集合
  garbageCollectionTimeMap.value = new Map()
  // 垃圾回收次数集合
  garbageCollectionCountMap.value = new Map()
  timer.value = setInterval(() => {
    createJvmMemoryCommand()
  }, interval * 1000)
}

function onJvmCommand() {
  eventbus.on('command', (commandExecuteResponse) => {
    if (commandExecuteResponse.code === commandEnum.JVM_MEMORY.value) {
      const jvmMemoryResponse = commandExecuteResponse.data as JvmMemoryResponse

      refreshTimestamp.value = commandExecuteResponse.timestamp

      // 时间线
      timeline.value.offer(useDateFormat(commandExecuteResponse.timestamp, 'HH:mm.ss').value)

      // jvm heap memory
      renderJvmHeapMemory(jvmMemoryResponse.heapMemory)

      // 垃圾回收信息
      renderGarbageCollectors(jvmMemoryResponse.garbageCollectors)

      // jvm nonheap memory
      renderJvmNonHeapMemory(jvmMemoryResponse.nonHeapMemory)
    }
  })
}

function createJvmMemoryCommand() {
  const params: CommandCreateRequest<any> = {
    instanceId: props.instanceId,
  }
  commandCreateApi.createJvmMemoryCommand(params)
}

function addJvmHeapMemory(heapMemoryName: string, value: number) {
  if (!heapMemoryMap.value.has(heapMemoryName))
    heapMemoryMap.value.set(heapMemoryName, new LimitedCountQueue(limitCount))

  heapMemoryMap.value.get(heapMemoryName)?.offer(div(value, 1000))
}

function renderJvmHeapMemory(heapMemoryList: JvmMemory[]) {
  // max
  addJvmHeapMemory('Max', useArrayReduce(heapMemoryList.map(m => m.max), (sum, val) => sum + val).value)
  // min
  addJvmHeapMemory('Min', useArrayReduce(heapMemoryList.map(m => m.used), (sum, val) => sum + val).value)

  // heap memory
  heapMemoryList.forEach((hm) => {
    addJvmHeapMemory(hm.name, hm.used)
  })

  const legend = ['Min', 'Max', ...heapMemoryList.map(m => m.name)]

  const minSeries: SeriesOption = {
    data: heapMemoryMap.value.get('Min')?.elements(),
    type: 'line',
    name: 'Min',
    smooth: true,
    showSymbol: false,
  }

  const maxSeries: SeriesOption = {
    data: heapMemoryMap.value.get('Max')?.elements(),
    type: 'line',
    name: 'Max',
    smooth: true,
    showSymbol: false,
  }

  const series = [minSeries, maxSeries, ...heapMemoryList.map((hm) => {
    return {
      data: heapMemoryMap.value.get(hm.name)?.elements(),
      type: 'line',
      name: hm.name,
      smooth: true,
      showSymbol: false,
    } as SeriesOption
  })]

  // 堆内存
  heapMemoryOptions.value = {
    title: { text: 'Heap Memory' },
    tooltip: { trigger: 'axis' },
    legend: {
      data: legend,
      right: 0,
      selected: {
        Min: false,
        Max: false,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      boundaryGap: false,
      data: timeline.value.elements(),
    },
    yAxis: {
      axisLabel: {
        formatter: '{value} MB',
      },
    },
    series,
  }
}

function addGarbageCollectorTime(garbageCollectorName: string, value: number | string) {
  if (!garbageCollectionTimeMap.value.has(garbageCollectorName))
    garbageCollectionTimeMap.value.set(garbageCollectorName, new LimitedCountQueue(limitCount))

  garbageCollectionTimeMap.value.get(garbageCollectorName)?.offer(value)
}

function addGarbageCollectorCount(garbageCollectorName: string, value: number | string) {
  if (!garbageCollectionCountMap.value.has(garbageCollectorName))
    garbageCollectionCountMap.value.set(garbageCollectorName, new LimitedCountQueue(limitCount))

  garbageCollectionCountMap.value.get(garbageCollectorName)?.offer(value)
}

function renderGarbageCollectors(garbageCollectors: GarbageCollector[]) {
  if (lastGarbageCollectionCount.value.size === 0) {
    garbageCollectors.forEach((garbageCollector) => {
      addGarbageCollectorCount(garbageCollector.name, '-')
      addGarbageCollectorTime(garbageCollector.name, '-')
    })
  }
  else {
    garbageCollectors.forEach((collector) => {
      // 次数
      const lastCollectionCount = lastGarbageCollectionCount.value.get(collector.name)
      addGarbageCollectorCount(collector.name, collector.collectionCount - lastCollectionCount)
      // 耗时
      const lastCollectionTime = lastGarbageCollectionTime.value.get(collector.name)
      addGarbageCollectorTime(collector.name, collector.collectionTime - lastCollectionTime)
    })
  }

  // 记录上一次垃圾回收信息
  garbageCollectors.forEach((garbageCollector) => {
    lastGarbageCollectionCount.value.set(garbageCollector.name, garbageCollector.collectionCount)
    lastGarbageCollectionTime.value.set(garbageCollector.name, garbageCollector.collectionTime)
  })

  const garbageCollectorNames = garbageCollectors.map(m => m.name)
  const legendData = [...garbageCollectorNames]

  // 渲染垃圾回收次数折线图
  garbageCollectionCountOptions.value = {
    title: { text: 'Garbage Collection Count' },
    tooltip: { trigger: 'axis' },
    legend: {
      data: legendData,
      bottom: 5,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      boundaryGap: false,
      data: timeline.value.elements(),
    },
    yAxis: {},
    series: garbageCollectors.map((hm) => {
      return {
        data: garbageCollectionCountMap.value.get(hm.name)?.elements(),
        type: 'line',
        name: hm.name,
        smooth: true,
        showSymbol: false,
      }
    }),
  }
  // 渲染垃圾回收耗时折线图
  garbageCollectionTimeOptions.value = {
    title: { text: 'Garbage Collection Times' },
    tooltip: { trigger: 'axis' },
    legend: {
      data: garbageCollectors.map(m => m.name),
      bottom: 5,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      boundaryGap: false,
      data: timeline.value.elements(),
    },
    yAxis: {},
    series: garbageCollectors.map((hm) => {
      return {
        data: garbageCollectionTimeMap.value.get(hm.name)?.elements(),
        type: 'line',
        name: hm.name,
        smooth: true,
        showSymbol: false,
      }
    }),
  }
}

function addJvmNonHeapMemory(nonHeapMemoryName: string, value: number) {
  if (!nonHeapMemoryMap.value.has(nonHeapMemoryName))
    nonHeapMemoryMap.value.set(nonHeapMemoryName, new LimitedCountQueue(limitCount))

  nonHeapMemoryMap.value.get(nonHeapMemoryName)?.offer(div(value, 1000))
}

function renderJvmNonHeapMemory(nonHeapMemories: JvmMemory[]) {
  addJvmNonHeapMemory('Used', useArrayReduce(nonHeapMemories.map(nhm => nhm.used), (sum, val) => sum + val).value)
  addJvmNonHeapMemory('Committed', useArrayReduce(nonHeapMemories.map(nhm => nhm.committed), (sum, val) => sum + val).value)

  const usedSeries: SeriesOption = {
    data: nonHeapMemoryMap.value.get('Used')?.elements(),
    type: 'line',
    name: 'Used',
    smooth: true,
    showSymbol: false,
  }

  const maxSeries: SeriesOption = {
    data: nonHeapMemoryMap.value.get('Committed')?.elements(),
    type: 'line',
    name: 'Committed',
    smooth: true,
    showSymbol: false,
  }

  // 堆内存
  nonHeapMemoryOptions.value = {
    title: { text: 'NonHeap Memory' },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['Used', 'Committed'],
      right: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      boundaryGap: false,
      data: timeline.value.elements(),
    },
    yAxis: {
      axisLabel: {
        formatter: '{value} MB',
      },
    },
    series: [usedSeries, maxSeries],
  }
}
</script>

<template>
  <n-space justify="end" align="center">
    <span>每</span>
    <n-select
      v-model:value="refreshTimeInterval" :options="refreshTimeOptions" style="width: 80px"
      @update-value="setRefreshTimer"
    />
    <span>刷新</span>
  </n-space>
  <div mt-15>
    <n-grid x-gap="12" :cols="2">
      <n-gi>
        <n-card :bordered="false" embedded>
          <div ref="garbageCollectionCountRef" h-350px />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" embedded>
          <div ref="garbageCollectionTimeRef" h-350px />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
  <n-card :bordered="false" embedded mt-20>
    <div ref="jvmDomRef" h-350px />
  </n-card>
  <n-card :bordered="false" embedded mt-20>
    <div ref="nonHeapDomRef" h-350px />
  </n-card>
</template>

<style scoped></style>
