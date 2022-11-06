<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  label: { type: String, default: '' },
  content: { type: String, default: '' },
  span: { type: Number, default: 1 },
})
</script>

<style scoped lang="scss">

</style>
