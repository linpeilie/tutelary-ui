<template>
  <q-card flat bordered class="row items-center" ref="cardRef">
    <datepicker v-model="modelValue">
      <q-input mask="datetime"></q-input>
    </datepicker>
    <q-input label="DateTimePicker" mask="datetime" readonly borderless>
      <template v-slot:default>
        <q-popup-proxy cover :breakpoint="600">
          <datepicker input-class-name="q-field__native q-placeholder" inline></datepicker>
        </q-popup-proxy>
      </template>
    </q-input>
    <div class="q-px-md">
      -
    </div>
    <q-input mask="datetime" readonly borderless>
      <template v-slot:default>
        <q-popup-proxy cover :breakpoint="600">
          <datepicker input-class-name="q-field__native q-placeholder" inline></datepicker>
        </q-popup-proxy>
      </template>
    </q-input>
  </q-card>
</template>

<script setup>
import { ref, defineProps } from 'vue'

const cardRef = ref()

const props = defineProps({
  modelValue: {
    type: [String, Array],
    required: true
  }
})

</script>

<style scoped>

</style>
