<script lang="ts">
import { defineComponent, h } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import type { DescriptionItemProps } from 'naive-ui';
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
export type TDescriptionItemProps<T> = {
  value?: (value: T) => string | number;
  render?: (value: T) => VNodeChild;
  hidden?: (value: T) => boolean;
  labelStyle?: Record<string, string>; // 支持 label 样式自定义
  valueStyle?: Record<string, string>; // 支持 value 样式自定义
  labelClass?: string | string[]; // 支持 label class
  contentClass?: string | string[]; // 支持 value class
  itemClass?: string | string[]; // 支持 item class
} & DescriptionItemProps;

export default defineComponent({
  name: 'TDescriptions',
  props: {
    items: {
      type: Array as () => TDescriptionItemProps<any>[],
      required: true
    },
    val: {
      type: Object as () => any,
      required: false
    },
    descriptionsStyle: {
      // 支持整体 Descriptions 样式自定义
      type: Object as () => Record<string, string>,
      default: () => ({})
    },
    descriptionsClass: {
      // 支持整体 Descriptions class
      type: [String, Array] as PropType<string | string[]>,
      default: ''
    }
  },
  setup(props, context) {
    const descriptionsItems: VNodeChild[] = [];
    const { labelClass, contentClass, ...contextAttrs } = context.attrs;
    for (const item of props.items) {
      if (item.hidden && item.hidden(props.val)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const { label, ...rest } = item;
      const descriptionsItem = h(
        NDescriptionsItem,
        {
          ...rest,
          class: item.itemClass // 允许对NDescriptionsItem传class
        },
        {
          label: () =>
            h(
              'span',
              {
                style: { ...((item.labelStyle as Record<string, any>) || {}), color: 'rgb(118, 124, 130)' },
                class: [item.labelClass, labelClass]
              },
              label
            ),
          default: () => {
            if (!props.val) return '-';
            if (item.render) return item.render(props.val);
            return h(
              'span',
              {
                style: {
                  ...item.valueStyle
                },
                class: [item.contentClass, contentClass]
              },
              item.value ? item.value(props.val) : '-'
            );
          }
        }
      );
      descriptionsItems.push(descriptionsItem);
    }
    return () =>
      h(
        NDescriptions,
        {
          ...contextAttrs,
          style: {
            ...(props.descriptionsStyle || {}),
            ...(context.attrs.style as any)
          },
          class: props.descriptionsClass // 支持整体class
        },
        { default: () => descriptionsItems }
      );
  }
});
</script>
