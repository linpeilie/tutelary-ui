<template>
  <q-page padding>
    <div class="row inline q-gutter-md items-center q-mb-md">
      <q-select outlined v-model="selectedProtobuf" :options="options" label="Protobuf" style="width: 500px"/>
      <q-btn label="确定" color="primary" @click="trans"/>
    </div>
    <div class="row">
      <div class="q-pa-md" style="width: 45%">
        <q-input
          v-model="input"
          label="输入"
          filled
          clearable
          type="textarea"
        />
      </div>
      <div class="q-pa-md" style="width: 45%">
        <q-input
          v-model="output"
          label="输出"
          filled
          clearable
          type="textarea"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue'
import { CMD_PROTO } from 'src/proto/proto'
import { Base64 } from 'js-base64'

const instance = getCurrentInstance()

const input = ref('')

const output = ref('')

const options = computed(() => {
  return CMD_PROTO.map(item => {
    return {
      label: item.proto + ' --- ' + item.description,
      value: item.cmd
    }
  })
})

const selectedProtobuf = ref(options.value[0])

const trans = () => {
  console.log('=>(ProtobufTest.vue:59) selectedProtobuf', selectedProtobuf.value)
  let data = input.value
  data = JSON.parse(data)
  console.log('输入内容', data)
  const value = instance.appContext.config.globalProperties.$protobufEncode(selectedProtobuf.value.value, data)
  const uint8Array = new Uint8Array(value)
  const base64Value = Base64.fromUint8Array(uint8Array)
  console.log('=>(ProtobufTest.vue:59) base64Value', base64Value)
  output.value = base64Value
}

</script>

<style scoped>

</style>
