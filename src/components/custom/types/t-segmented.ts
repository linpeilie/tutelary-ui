import type { Component, VNode } from 'vue';

type IconType = 'iconify' | 'iconfont';

export interface OptionsType {
  /** 文字 */
  label?: string | (() => VNode | Component);
  icon?: string;
  /** 图标属性、样式配置 */
  iconType?: IconType;
  /** 值 */
  value?: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** `tooltip` 提示 */
  tip?: string;
}

export type Size = 'small' | 'medium' | 'large';

export interface Props {
  options: Array<OptionsType>;
  /** 默认选中，按照第一个索引为 `0` 的模式，可选(`modelValue`只有传`number`类型时才为响应式) */
  modelValue?: any;
  /** 将宽度调整为父元素宽度 */
  block?: boolean;
  /** 控件尺寸 */
  size?: Size;
  /** 是否全局禁用，默认 `false` */
  disabled?: boolean;
  /** 当内容发生变化时，设置 `resize` 可使其自适应容器位置 */
  resize?: boolean;
  /** 默认值 */
  defaultValue?: any;
}
