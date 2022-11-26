<template>
  <div class="row justify-center">
    <q-card bordered flat class="col-md-7 col-xs-11 q-ma-md">
      <q-card-section>
        <div class="text-h5">线程概况</div>
      </q-card-section>
      <q-separator inset/>
      <q-card-section>
        <q-responsive :ratio="16/9" style="min-width: 300px">
          <div ref="main" style="width: 100%;height: 300px">
          </div>
        </q-responsive>
      </q-card-section>
    </q-card>
    <q-card bordered flat class="col-md-4 col-xs-11 q-ma-md">
      <div class="q-pa-md">TODO</div>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts/core'
import { GridComponent } from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

const main = ref()
echarts.use([GridComponent, LineChart, CanvasRenderer, UniversalTransition])
let chart

onMounted(() => {
  loadChart()
  window.onresize = () => {
    if (chart) {
      chart.resize()
    }
  }
})

const loadChart = () => {
  chart = echarts.init(main.value)
  const option = {
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
        smooth: true
      }
    ]
  }
  chart.setOption(option)
}


</script>

<style scoped>

</style>
