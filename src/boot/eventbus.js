import { boot } from 'quasar/wrappers'
import eventBus from 'vue3-eventbus'

const commandEventPrefix = 'command'
const separator = '#'

const onCommand = (type, commandCode, callback) => {
  eventBus.on(commandEventPrefix + separator + type + separator + commandCode, callback)
}

const emitCommand = (type, commandCode, e) => {
  eventBus.emit(commandEventPrefix + separator + type + separator + commandCode, e)
}

const offCommand = (type, commandCode, callback) => {
  eventBus.off(commandEventPrefix + separator + type + separator + commandCode, callback)
}

export default boot(({ app }) => {
  app.use(eventBus, {
    global: true,
    globalPropertyName: '$eventBus'
  })
})

export {
  onCommand,
  emitCommand,
  offCommand
}
