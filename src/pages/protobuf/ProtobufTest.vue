<template>
  <q-page padding>
    <div class="row inline q-gutter-md items-center q-mb-md">
      <q-select outlined v-model="selectedProtobuf" :options="options" label="Protobuf" style="width: 500px"/>
      <q-btn label="确定" color="primary" @click="trans"/>
      <q-btn label="发送" color="primary" @click="sendMessage"/>
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
import { useStore } from 'vuex'
import { CMD_PROTO } from 'src/proto/proto'
import { Base64 } from 'js-base64'

const instance = getCurrentInstance()
const store = useStore()

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

const getEncodeValue = () => {
  let data = input.value
  data = JSON.parse(data)
  return instance.appContext.config.globalProperties.$protobufEncode(selectedProtobuf.value.value, data)
}

const trans = () => {
  const value = getEncodeValue()
  const uint8Array = new Uint8Array(value)
  const base64Value = Base64.fromUint8Array(uint8Array)
  output.value = base64Value
}

const sendMessage = () => {
  store.dispatch('sendMessage', {
    cmd: selectedProtobuf.value.value,
    message: JSON.parse(input.value)
  })
}

</script>

<style scoped>

</style>
