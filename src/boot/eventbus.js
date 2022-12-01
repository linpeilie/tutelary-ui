import { boot } from 'quasar/wrappers'
import { EventBus } from 'quasar'

const commandEventPrefix = 'command'
const separator = '#'

const bus = new EventBus()

const onCommand = (type, commandCode, callback) => {
  bus.on(commandEventPrefix + separator + type + separator + commandCode, callback)
}

const emitCommand = (type, commandCode, e) => {
  bus.emit(commandEventPrefix + separator + type + separator + commandCode, e)
}

const offCommand = (type, commandCode, callback) => {
  bus.off(commandEventPrefix + separator + type + separator + commandCode, callback)
}

export default boot(({ app }) => {
  app.config.globalProperties.$bus = bus
})

export {
  onCommand,
  emitCommand,
  offCommand
}
