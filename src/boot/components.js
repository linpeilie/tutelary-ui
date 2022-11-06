import { boot } from 'quasar/wrappers'

import Descriptions from 'src/components/Descriptions/Descriptions.vue'
import DescriptionItem from 'components/DescriptionItem/DescriptionItem.vue'

export default boot(({ app }) => {
  app.component('description-item', DescriptionItem)
  app.component('descriptions', Descriptions)
})

