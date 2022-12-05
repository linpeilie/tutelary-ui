import { defineComponent } from "vue"

export default defineComponent({
  name: 'DescriptionItem',
  props: {
    label: { type: String, required: true },
    content: { type: String, required: true },
    span: { type: Number, default: 1 },
    align: { type: String, default: 'left' },
    labelAlign: { type: String, default: 'left' },
    className: { type: String, required: false },
    labelClassName: { type: String, required: false },
    width: { type: Number, required: false },
    minWidth: { type: Number, required: false }
  }
})
