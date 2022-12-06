<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  label: { type: String, default: '' },
  content: { type: String, default: '' },
  span: { type: Number, default: 1 },
  align: { type: String, default: 'left' },
  labelAlign: { type: String, default: 'left' },
  className: { type: String, default: '' },
  labelClassName: { type: String, default: '' },
  width: { type: Number, required: false },
  minWidth: { type: Number, required: false }
})
</script>

<style scoped lang="scss">

</style>
