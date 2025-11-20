/**
 * 枚举 Composable
 * 提供在 Vue 组件中使用枚举的便捷方法
 */

import { type ComputedRef, computed } from 'vue';
import type { Enum, EnumItem } from '@/utils/enum';
import {
  getEnumItem,
  getLabelByValue,
  getLabels,
  getOptions,
  getTagByValue,
  getValueByLabel,
  getValues,
  hasValue,
  isValidEnumValue
} from '@/utils/enum';

/**
 * 枚举 Hook 返回类型
 */
export interface UseEnumReturn {
  /** 获取选项列表 */
  options: ComputedRef<EnumItem[]>;
  /** 根据值获取标签 */
  getLabel: (value: EnumValue, defaultLabel?: string) => string;
  /** 根据值获取标签样式 */
  getTag: (value: EnumValue) => EnumValueTag | undefined;
  /** 获取所有值 */
  getValues: () => EnumValue[];
  /** 获取所有标签 */
  getLabels: () => EnumLabel[];
  /** 判断值是否存在 */
  hasValue: (value: EnumValue) => boolean;
  /** 类型守卫 */
  isValid: (value: unknown) => boolean;
  /** 获取枚举项 */
  getItem: (value: EnumValue) => EnumItem | undefined;
  /** 根据标签获取值 */
  getValueByLabel: (label: EnumLabel) => EnumValue | undefined;
}

/**
 * 使用枚举
 * @param enumObj 枚举对象
 * @example
 * const { options, getLabel, getTag } = useEnum(enableStatusEnum);
 */
export function useEnum(enumObj: Enum): UseEnumReturn {
  // 计算选项列表（缓存）
  const options = computed(() => getOptions(enumObj));

  return {
    options,
    getLabel: (value: EnumValue, defaultLabel?: string) => getLabelByValue(enumObj, value, defaultLabel),
    getTag: (value: EnumValue) => getTagByValue(enumObj, value),
    getValues: () => getValues(enumObj),
    getLabels: () => getLabels(enumObj),
    hasValue: (value: EnumValue) => hasValue(enumObj, value),
    isValid: (value: unknown) => isValidEnumValue(enumObj, value),
    getItem: (value: EnumValue) => getEnumItem(enumObj, value),
    getValueByLabel: (label: EnumLabel) => getValueByLabel(enumObj, label)
  };
}

/**
 * 使用多个枚举
 * @param enums 枚举对象数组
 * @example
 * const enums = useEnums({
 *   status: enableStatusEnum,
 *   state: threadStates
 * });
 * enums.status.getLabel(1); // '启用'
 * enums.state.options; // 线程状态选项列表
 */
export function useEnums<T extends Record<string, Enum>>(enums: T): { [K in keyof T]: UseEnumReturn } {
  const result = {} as { [K in keyof T]: UseEnumReturn };

  for (const key in enums) {
    if (Object.hasOwn(enums, key)) {
      result[key] = useEnum(enums[key]);
    }
  }

  return result;
}
