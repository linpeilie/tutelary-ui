<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ECharts, EChartsOption } from 'echarts'
import echarts from '@/utils/echarts'
import { useThemeStore } from '@/store'

const props = defineProps({
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '100%',
  },
  lazy: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Object as PropType<EChartsOption>,
    default: null,
  },
})

const themeStore = useThemeStore()

const domRef = ref(null)
const domBox = ref(null)

let chartObj: null | ECharts = null

// dom 监听
let observer: null | MutationObserver = null

onMounted(() => {
  if (!domRef.value)
    return
  // 初始化
  init()

  if (props.lazy)
    return

  // 有初始配置的话，直接绘制
  if (props.options)
    drawOption()

  // 创建 dom 监听器
  observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.target === domBox.value)
        resize()
    }
  })

  nextTick(() => {
    domBox.value && (observer as MutationObserver).observe(domBox.value, {
      attributes: true, // 观察所有监听节点属性值的变化
      childList: false, // 当为 true 时，监听节点中发生的节点新增与删除
      characterData: true, // 监听节点上所有字符的变化
      subtree: true, // 监听根节点及整个子树，包括子树中所有节点的属性
    })
  })

  setTimeout(() => {
    resize()
  }, 1000)
})

onUnmounted(() => {
  if (chartObj) {
    chartObj.dispose()
    chartObj = null
  }

  // 销毁监听器
  observer && observer.disconnect()
})

watch(() => props.options, () => !props.lazy && drawOption())
watch(() => themeStore.darkMode, () => !props.lazy && drawOption())

function init() {
  chartObj = (echarts.init(domRef.value) as any)
}

function drawOption() {
  if (!chartObj)
    return
  if (!props.options) {
    chartObj?.clear()
    chartObj?.showLoading({
      text: '',
      color: '#408eff',
      textColor: '#000',
      maskColor: 'rgba(255, 255, 255, .95)',
      zLevel: 0,
      lineWidth: 2,
    })
  }
  else {
    chartObj.hideLoading()
    chartObj.setOption(props.options)
  }
}

function resize() {
  chartObj?.resize()
}

defineExpose({
  drawOption,
  resize,
  init,
})
</script>

<template>
  <div ref="domBox" :style="{ width, height }">
    <div ref="domRef" :style="{ width, height }" />
  </div>
</template>

<style scoped></style>
