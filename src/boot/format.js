import { boot } from 'quasar/wrappers'
import { divide } from 'src/utils/math'

const kb = 1024
const mb = 1024 * 1024

const memoryFormat = (memory) => {
  if (memory < kb) {
    return memory + 'KB'
  }
  if (memory < mb) {
    return divide(memory, kb, 2) + 'MB'
  }
  return divide(memory, mb, 2) + 'GB'
}

export default boot(({ app }) => {
  app.config.globalProperties.$memoryFormat = memoryFormat
  app.provide("$memoryFormat", memoryFormat)
})
