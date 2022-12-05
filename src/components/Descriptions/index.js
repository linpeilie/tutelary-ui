export default {
  name: 'TDescriptions',
  props: {
    border: { type: Boolean, default: false },
    column: { type: Number, default: 3 },
    size: { type: String, default: 'md' },
    title: { type: String, default: '' },
    labelStyle: { type: Object },
    contentStyle: { type: Object },
    labelClassName: { type: String, default: '' },
    contentClassName: { type: String, default: '' },
    colon: { type: Boolean, default: true }
  },
  provide() {
    return {
      tDescriptions: this
    }
  },
  methods: {
    getOptionProps(vnode) {
      if (vnode.componentOptions) {
        const componentOptions = vnode.componentOptions
        const { propsData = {}, Ctor = {} } = componentOptions
        const props = (Ctor.options || {}).props || {}
        const res = {}
        for (const k of props) {
          const v = props[k]
          const defaultValue = v.default
          if (defaultValue !== undefined) {
            res[k] = defaultValue
          }
        }
        return { ...res, ...propsData }
      }
    },
    getSlots(vnode) {
      let componentOptions = vnode.componentOptions || {}
      const children = vnode.children || componentOptions.children || []
      const slots = {}
      children.forEach(child => {
        if (!this.isEmptyElement(child)) {
          const name = (child.data && child.data.slot) || 'default'
          slots[name] = slots[name] || []
          if (child.tag === 'template') {
            slots[name].push(child.children)
          } else {
            slots[name].push(child)
          }
        }
      })
      return { ...slots }
    },
    isEmptyElement(vnode) {
      return !(vnode.tag || (vnode.text && vnode.text.trim() !== ''))
    },
    filledNode(node, span, count, isLast = false) {
      if (!node.props) {
        node.props = {}
      }
      if (span > count) {
        node.props.span = count
      }
      if (isLast) {
        node.props.span = count
      }
      return node
    },
    getRows() {
      const children = ((this.$slots.default || [])
        .filter(vnode => vnode.tag && vnode.componentOptions && vnode.componentOptions.Ctor.options.name === 'TDescriptionsItem'))
      const nodes = children.map(vnode => {
        return {
          props: this.getOptionProps(vnode),
          slots: this.getSlots(vnode),
          vnode
        }
      })
      const rows = []
      let temp = []
      let count = this.column
      nodes.forEach((node, index) => {
        const span = node.props.span || 1
        if(index === children.length - 1) {
          temp.push(this.filledNode(node, span, count, true))
          rows.push(temp)
          return
        }
        if (span < count) {
          count -= span
          tmep.push(node)
        } else {
          temp.push(this.filledNode(node, span, count))
          rows.push(temp)
          count = this.column
          temp = []
        }
      })
      return rows
    }
  },
  render() {
    const { title, border, descriptionsSize, $slots } = this
    const rows = this.getRows()

    return (
      <div class="t-descriptions">
        // Header
        {
          (title || $slots.title )
            ? <div class="t-descriptions__header">
                <div class="t-descriptions__title">
                  { $slots.title ? $slots.title : title }
                </div>
            </div>
            : null
        }

        // Body
        <div class="t-descriptions__body">
          <q-markup-table class={['']}
        </div>
      </div>
    )
  }
}
