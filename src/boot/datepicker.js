import { boot } from 'quasar/wrappers'

import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

export default boot(({ app }) => {
  app.component('Datepicker', Datepicker)
})
