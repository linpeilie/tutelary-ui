import { boot } from 'quasar/wrappers'
import eventBus from 'vue3-eventbus'

const commandEventPrefix = 'command'
const separator = '#'

const onCommand = (type, command, callback) => {
  eventBus.on(commandEventPrefix + separator + type + separator + command, callback)
}

const emitCommand = (type, command, e) => {
  eventBus.emit(commandEventPrefix + separator + type + separator + command, e)
}

const offCommand = (type, command, callback) => {
  eventBus.off(commandEventPrefix + separator + type + separator + command, callback)
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
