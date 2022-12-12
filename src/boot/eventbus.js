import { boot } from 'quasar/wrappers'
import { EventBus } from 'quasar'

const commandEventPrefix = 'command'
const separator = '#'

const errorEventKey = 'command-error-event'

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

const onError = (callback) => {
  bus.on(errorEventKey, callback)
}

const emitError = (message) => {
  bus.emit(errorEventKey, message)
}

const offError = (callback) => {
  bus.off(errorEventKey, callback)
}

export default boot(({ app }) => {
  app.provide('$bus', bus)
  app.provide('onCommand', onCommand)
  app.provide('emitCommand', emitCommand)
  app.provide('offCommand', offCommand)
  app.provide('onError', onError)
  app.provide('emitError', emitError)
  app.provide('offError', offError)
})

export {
  onCommand,
  emitCommand,
  offCommand,
  emitError
}
