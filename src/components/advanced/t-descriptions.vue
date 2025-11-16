<script lang="ts">
import { defineComponent, h } from 'vue';
import type { VNodeChild } from 'vue';
import type { DescriptionItemProps } from 'naive-ui';
import { NDescriptions, NDescriptionsItem, NText } from 'naive-ui';
export type TDescriptionItemProps<T> = {
  value?: (value: T) => string | number;
  render?: (value: T) => VNodeChild;
  hidden?: (value: T) => boolean;
} & DescriptionItemProps;

export default defineComponent({
  name: 'TDescriptions',
  props: {
    items: {
      type: Array<TDescriptionItemProps<any>>,
      required: true
    },
    val: {
      type: Object,
      required: true
    }
  },
  setup(props, context) {
    const descriptionsItems: VNodeChild[] = [];
    for (const item of props.items) {
      if (item.hidden && item.hidden(props.val)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const descriptionsItem = h(NDescriptionsItem, item, {
        label: () => {
          return h(NText, { depth: 3 }, () => item.label);
        },
        default: () => {
          if (item.render) return item.render(props.val);

          return h(NText, { style: 'font-weight: 500;--n-text-color: rgb(0 0 0),--n-bezier: linear;' }, () => {
            if (item.value) return item.value(props.val);
            return '-';
          });
        }
      });
      descriptionsItems.push(descriptionsItem);
    }
    return () => {
      return h(
        NDescriptions,
        { ...context.attrs, style: '--n-th-text-color: rgb(118, 124, 130)' },
        { default: () => descriptionsItems }
      );
    };
  }
});
</script>
