<template>
  <div class="descriptions-container">
    <div class="descriptions-header q-table__top" v-if="title">
      <div class="q-table__control q-table__title">
        <slot name="title">{{ title }}</slot>
      </div>
    </div>
    <div class="descriptions-body">
      <q-markup-table :bordered="bordered"
                      flat
                      :separator="bordered ? 'horizontal' : 'none'"
                      wrap-cells>
        <tbody>
        <template v-for="(row, key) in getRows()"
                  :key="key"
                  class="description-row">
          <description-row :row="row"/>
        </template>
        </tbody>
      </q-markup-table>
    </div>
  </div>
</template>

<script setup>
import { defineProps, provide, useSlots } from 'vue'
import DescriptionRow from './DescriptionRow.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  column: {
    type: Number,
    default: 3
  },
  bordered: {
    type: Boolean,
    default: false
  }
})

provide('descriptions', props)

const slots = useSlots()

const filledNode = (node, span, count, isLast = false) => {
  if (!node.props) {
    node.props = {}
  }
  if (span > count) {
    node.props.span = count
  }
  if (isLast) {
    node.props.span = span
  }
  return node
}

const getRows = () => {
  const rows = []
  const defaultSlots = slots.default?.().filter(
    node => node?.type?.__name === 'DescriptionItem'
  )
  console.log('=>(Descriptions.vue:60) defaultSlots', defaultSlots)
  if (!defaultSlots) {
    return rows
  }
  let temp = []
  let count = props.column
  let totalSpan = 0
  defaultSlots.forEach((node, index) => {
    const span = node.props?.span || 1
    if (index < defaultSlots.length - 1) {
      totalSpan += span > count ? count : span
    }
    if (index === defaultSlots.length - 1) {
      const lastSpan = props.column - (totalSpan % props.column)
      temp.push(filledNode(node, lastSpan, count, true))
      rows.push(temp)
      console.log('=>(Descriptions.vue:75) rows', rows)
      return rows
    }
    if (span < count) {
      count -= span
      temp.push(node)
    } else {
      temp.push(filledNode(node, span, count))
      rows.push(temp)
      count = props.column
      temp = []
    }
    console.log('=>(Descriptions.vue:88) rows', rows)
    return rows
  })
  return rows
}

</script>

<style scoped lang="scss">
.descriptions-container {
  .descriptions-body {
    width: 100%;
    overflow: hidden;
  }

}
</style>
