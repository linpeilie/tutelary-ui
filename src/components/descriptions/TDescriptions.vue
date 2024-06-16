<script lang="ts">
import type { DescriptionItemProps } from 'naive-ui'
import { NDescriptions, NDescriptionsItem, NText } from 'naive-ui'
import type { VNodeChild } from 'vue'

export type TDescriptionItemProps<T> = {
  value?: (value: T) => Object
  render?: (value: T) => VNodeChild
  hidden?: (value: T) => boolean
} & DescriptionItemProps
export default defineComponent({
  name: 'TDescriptions',
  props: {
    items: {
      type: Array<TDescriptionItemProps<any>>,
      required: true,
    },
    val: {
      type: Object
    },
  },
  setup(props, context) {
    const descriptionsItems: VNodeChild[] = []
    for (const item of props.items) {
      if (item.hidden && item.hidden(props.val))
        continue

      const descriptionsItem = h(
        NDescriptionsItem,
        item,
        {
          label: () => {
            return h(NText, { depth: 3 }, () => item.label)
          },
          default: () => {
            if (item.render)
              return item.render(props.val)

            return h(NText, { strong: true }, () => {
              if (item.value)
                return item.value(props.val)
              else
                return ''
            })
          },
        },
      )
      descriptionsItems.push(descriptionsItem)
    }
    return () => {
      return h(
        NDescriptions,
        context.attrs,
        { default: () => descriptionsItems },
      )
    }
  },
})
</script>
