<template>
  <datepicker v-bind="$attrs"
              range
              @update:modelValue="previewDate"
              :style="{'width': width}"
              ref="picker"
              multi-calendars
              close-on-scroll
              calendar-class-name="q-pa-md"
              calendar-cell-class-name="q-pa-md"
              position="right">
    <template #trigger>
      <q-card flat bordered class="row no-wrap items-center justify-around q-px-md" ref="cardRef">
        <q-input mask="datetime" dense readonly borderless v-model="time1" item-aligned/>
        <div class="q-px-md">-</div>
        <q-input mask="datetime" dense readonly borderless v-model="time2" item-aligned/>
      </q-card>
    </template>
    <template #left-sidebar v-if="shortcuts">
      <q-list separator>
        <q-item clickable v-ripple v-for="shortcut of shortcuts" @click="handleShortcutClick(shortcut)">
          <q-item-section no-wrap>
            {{ shortcut.text }}
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </datepicker>
</template>

<script setup>
import { ref, defineProps, watch, useAttrs } from 'vue'
import { date } from 'quasar'

const cardRef = ref()
const picker = ref()

const attrs = useAttrs()

const props = defineProps({
  width: {
    type: String,
    default: '400px'
  },
  shortcuts: {
    type: Array,
    required: false
  }
})

let time1 = ref('')
let time2 = ref('')

const previewDate = (modelData) => {
  if (!modelData || modelData.length !== 2) {
    return
  }
  time1.value = date.formatDate(modelData[0], 'YYYY-MM-DD HH:mm')
  time2.value = date.formatDate(modelData[1], 'YYYY-MM-DD HH:mm')
}

const handleShortcutClick = (shortcut) => {
  if (shortcut && shortcut.value) {
    const value = shortcut.value()
    picker.value.updateInternalModelValue(value)
    picker.value.selectDate()
  }
}

watch(attrs.modelValue, (modelValue) => {
  previewDate(modelValue)
})

</script>

<style scoped>
</style>
