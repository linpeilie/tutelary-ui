<template>
  <tr>
    <template v-for="(cell, index) in row" :key="'description-row-' + index" class="description-item-cell">
      <template v-if="descriptions.bordered">
        <td>{{ cell.props.label }}</td>
        <td :colspan="cell.props.span * 2 - 1">{{ cell.props.content }}</td>
      </template>
      <template v-else>
        <td :colspan="cell.props.span * 2 - 1">
          <span class="description-item-cell__label">{{ cell.props.label }}</span>
          <span class="description-item-cell__content">{{ cell.props.content }}</span>
        </td>
      </template>
    </template>
  </tr>
</template>

<script setup>
import { defineProps, inject } from 'vue'

const props = defineProps({
  row: {
    type: Array,
    default: []
  }
})

const descriptions = inject('descriptions')
</script>

<style scoped lang="scss">
.description-item-cell__label {
  color: $grey-7;
}

.description-item-cell__label::after {
  display: inline-block;
  content: ':';
  margin-left: 5px;
  margin-right: 5px;
}
</style>
