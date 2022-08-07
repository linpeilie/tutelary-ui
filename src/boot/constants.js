import { boot } from 'quasar/wrappers'
import { TYPE_ARTHAS, TYPE_TUTELARY } from 'src/proto/commandProto'
import { COMMAND_REQUEST_CMD } from 'src/proto/proto'

export default boot(({ app }) => {
  app.config.globalProperties.$arthasType = TYPE_ARTHAS
  app.config.globalProperties.$tutelaryType = TYPE_TUTELARY
  app.config.globalProperties.$commandRequestCmd = COMMAND_REQUEST_CMD
})
