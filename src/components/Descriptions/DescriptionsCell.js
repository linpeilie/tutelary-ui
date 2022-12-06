import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DescriptionsCell',
  props: {
    cell: { type: Object },
    tag: { type: String },
    type: { type: String }
  },
  render() {
    const item = this.cell
    console.log("-> item", item);
    const label = item.props.label
    const content = this.cell?.children?.default?.() || item.props.content
    const span = item.props.span
    const align = item.props.align ? `text-${item.props.align}` : ''
    const labelAlign = item.props.labelAlign ? `text-${item.props.labelAlign}` : '' || align
    const className = item.props.className
    const labelClassName = item.props.labelClassName
    const style = {
      width: item.props.width,
      minWidth: item.props.minWidth
    }

    switch (this.type) {
      case 'label':
        return h(
          this.tag,
          {
            style,
            class: [
              labelAlign,
              labelClassName
            ],
            colSpan: span
          },
          label
        )
      case 'content':
        return h(
          this.tag,
          {
            style,
            class: [
              align,
              className
            ],
            colSpan: span * 2 - 1
          },
          content
        )
      default:
        return h(
          'td',
          {
            style,
            class: ['row', 'items-center', align],
            colSpan: span
          },
          [
            h(
              'div',
              {
                class: ['description-item-cell__label', labelClassName]
              },
              label
            ),
            h(
              'div',
              {
                class: ['description-item-cell__content', className]
              },
              content
            )
          ]
        )
    }

  }
})
