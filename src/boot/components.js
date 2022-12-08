import { boot } from 'quasar/wrappers'

import Descriptions from 'src/components/Descriptions/Descriptions.vue'
import DescriptionItem from 'components/DescriptionItem/DescriptionItem.js'

import DatetimePicker from 'src/components/DatetimePicker/DatetimePicker.vue'

export default boot(({ app }) => {
  app.component('description-item', DescriptionItem)
  app.component('descriptions', Descriptions)
  app.component('t-datetime-picker', DatetimePicker)
})

