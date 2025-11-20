import type { SelectBaseOption } from 'naive-ui/es/select/src/interface';

/**
 * 枚举项类
 * 实现了 NaiveUI SelectBaseOption 接口，可直接用于 Select 组件
 */
export class EnumItem implements SelectBaseOption {
  /** 枚举值 */
  readonly value: EnumValue;
  /** 枚举标签（显示文本） */
  readonly label: EnumLabel;
  /** 标签样式（颜色、类型） */
  readonly tag?: EnumValueTag;
  /** 是否禁用（用于 Select 组件） */
  readonly disabled?: boolean;

  private constructor(value: EnumValue, label: EnumLabel, tag?: EnumValueTag, disabled?: boolean) {
    this.value = value;
    this.label = label;
    this.tag = tag;
    this.disabled = disabled;
  }

  /**
   * 创建枚举项
   * @param value 枚举值
   * @param label 枚举标签
   * @param tag 标签样式
   * @param disabled 是否禁用
   */
  public static of(value: EnumValue, label: EnumLabel, tag?: EnumValueTag, disabled?: boolean): EnumItem {
    return Object.freeze(new EnumItem(value, label, tag, disabled));
  }
}

/**
 * 枚举类型
 */
export type Enum = Record<string, EnumItem>;

/**
 * 根据值获取对应的枚举项
 * @param enums 枚举对象
 * @param value 枚举值
 */
function getCorrespondEnumItemByValue(enums: Enum, value: EnumValue): EnumItem | undefined {
  return Object.values(enums).find(item => item.value === value);
}

/**
 * 根据值获取标签
 * @param enums 枚举对象
 * @param value 枚举值
 * @param defaultLabel 默认标签（当找不到时返回）
 */
export function getLabelByValue(enums: Enum, value: EnumValue, defaultLabel = '-'): string {
  return getCorrespondEnumItemByValue(enums, value)?.label || defaultLabel;
}

/**
 * 根据值获取标签样式
 * @param enums 枚举对象
 * @param value 枚举值
 */
export function getTagByValue(enums: Enum, value: EnumValue): EnumValueTag | undefined {
  return getCorrespondEnumItemByValue(enums, value)?.tag;
}

/**
 * 获取枚举选项列表（用于 Select 等组件）
 * @param enums 枚举对象
 */
export function getOptions(enums: Enum): EnumItem[] {
  return Object.values(enums);
}

/**
 * 获取所有枚举值
 * @param enums 枚举对象
 */
export function getValues(enums: Enum): EnumValue[] {
  return Object.values(enums).map(item => item.value);
}

/**
 * 获取所有枚举标签
 * @param enums 枚举对象
 */
export function getLabels(enums: Enum): EnumLabel[] {
  return Object.values(enums).map(item => item.label);
}

/**
 * 判断值是否在枚举中存在
 * @param enums 枚举对象
 * @param value 要检查的值
 */
export function hasValue(enums: Enum, value: EnumValue): boolean {
  return Object.values(enums).some(item => item.value === value);
}

/**
 * 类型守卫：检查值是否为有效的枚举值
 * @param enums 枚举对象
 * @param value 要检查的值
 */
export function isValidEnumValue<T extends Enum>(enums: T, value: unknown): value is T[keyof T]['value'] {
  return hasValue(enums, value as EnumValue);
}

/**
 * 获取枚举项（如果不存在返回 undefined）
 * @param enums 枚举对象
 * @param value 枚举值
 */
export function getEnumItem(enums: Enum, value: EnumValue): EnumItem | undefined {
  return getCorrespondEnumItemByValue(enums, value);
}

/**
 * 根据标签获取值
 * @param enums 枚举对象
 * @param label 标签
 */
export function getValueByLabel(enums: Enum, label: EnumLabel): EnumValue | undefined {
  return Object.values(enums).find(item => item.label === label)?.value;
}
