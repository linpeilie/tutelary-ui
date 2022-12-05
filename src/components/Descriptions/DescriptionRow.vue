<template>
  <tr>
    <template v-for="(cell, index) in row" :key="'description-row-' + index" class="description-item-cell">
      <template v-if="descriptions.bordered">
        <descriptions-cell :cell="cell" tag="td" type="label"/>
        <descriptions-cell :cell="cell" tag="td" type="content"/>
      </template>
      <descriptions-cell v-else :cell="cell" tag="td" type="both"/>
    </template>
  </tr>
</template>

<script setup>
import {defineProps, inject} from 'vue'
import DescriptionsCell from './DescriptionsCell'

const props = defineProps({
  row: {
    type: Array,
    default: []
  }
})

const descriptions = inject('descriptions')
</script>
