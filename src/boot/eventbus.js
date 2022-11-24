import { boot } from 'quasar/wrappers'
import { EventBus } from 'quasar'

const commandEventPrefix = 'command'
const separator = '#'

const onCommand = (type, commandCode, callback) => {
  this.$bus.on(commandEventPrefix + separator + type + separator + commandCode, callback)
}

const emitCommand = (type, commandCode, e) => {
  this.$bus.emit(commandEventPrefix + separator + type + separator + commandCode, e)
}

const offCommand = (type, commandCode, callback) => {
  this.$bus.off(commandEventPrefix + separator + type + separator + commandCode, callback)
}

export default boot(({ app }) => {
  const bus = new EventBus()
  app.config.globalProperties.$bus = bus
})

export {
  onCommand,
  emitCommand,
  offCommand
}
