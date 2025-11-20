import type { SelectBaseOption } from 'naive-ui/es/select/src/interface'

// 枚举类型接口
class EnumItem implements SelectBaseOption {
  [key: EnumValue]: any
  value: EnumValue
  label: EnumLabel
  tag?: EnumValueTag

  private constructor(value: EnumValue, label: EnumLabel, tag?: EnumValueTag) {
    this.value = value
    this.label = label
    this.tag = tag
  }

  public static of(value: EnumValue, label: EnumLabel, tag?: EnumValueTag): EnumItem {
    return Object.freeze(new EnumItem(value, label, tag))
  }
}

type Enum = Record<string, EnumItem>

function getCorrespondEnumItemByValue(enums: Enum, value: EnumValue) {
  return Object.values(enums).find(item => item.value === value)
}

function getLabelByValue(enums: Enum, value: EnumValue) {
  return getCorrespondEnumItemByValue(enums, value)?.label || '-'
}

function getTagByValue(enums: Enum, value: EnumValue): EnumValueTag | undefined {
  return getCorrespondEnumItemByValue(enums, value)?.tag
}

export { EnumItem, getLabelByValue, getTagByValue }
