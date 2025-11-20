# 枚举功能使用指南

## 📋 问题分析

原枚举实现存在以下问题：

### 1. ❌ 缺少类型导出
`Enum` 类型没有导出，外部无法引用

### 2. ❌ 缺少获取选项列表的方法
NaiveUI 的 Select 组件需要选项数组，但没有 `getOptions()` 方法

### 3. ❌ 索引签名过于宽松
`[key: EnumValue]: any` 允许任意属性，破坏类型安全

### 4. ❌ 缺少类型守卫
没有 `isValidValue()` 来验证值的有效性

### 5. ❌ 缺少工具方法
- 没有 `getValues()` - 获取所有枚举值
- 没有 `getLabels()` - 获取所有标签
- 没有 `hasValue()` - 判断值是否存在
- 没有 `getValueByLabel()` - 根据标签获取值

### 6. ❌ 缺少 disabled 支持
无法禁用某些选项（Select 组件需要）

---

## ✅ 解决方案

### 1. 完善的 EnumItem 类

```typescript
export class EnumItem implements SelectBaseOption {
  readonly value: EnumValue;        // 枚举值
  readonly label: EnumLabel;        // 显示标签
  readonly tag?: EnumValueTag;      // 标签样式（颜色、类型）
  readonly disabled?: boolean;      // 是否禁用

  public static of(
    value: EnumValue,
    label: EnumLabel,
    tag?: EnumValueTag,
    disabled?: boolean
  ): EnumItem {
    return Object.freeze(new EnumItem(value, label, tag, disabled));
  }
}
```

### 2. 导出 Enum 类型

```typescript
export type Enum = Record<string, EnumItem>;
```

### 3. 完整的工具方法

```typescript
// 根据值获取标签
export function getLabelByValue(enums: Enum, value: EnumValue, defaultLabel = '-'): string;

// 根据值获取标签样式
export function getTagByValue(enums: Enum, value: EnumValue): EnumValueTag | undefined;

// 获取选项列表（用于 Select）
export function getOptions(enums: Enum): EnumItem[];

// 获取所有值
export function getValues(enums: Enum): EnumValue[];

// 获取所有标签
export function getLabels(enums: Enum): EnumLabel[];

// 判断值是否存在
export function hasValue(enums: Enum, value: EnumValue): boolean;

// 类型守卫
export function isValidEnumValue<T extends Enum>(
  enums: T,
  value: unknown
): value is T[keyof T]['value'];

// 获取枚举项
export function getEnumItem(enums: Enum, value: EnumValue): EnumItem | undefined;

// 根据标签获取值
export function getValueByLabel(enums: Enum, label: EnumLabel): EnumValue | undefined;
```

---

## 📖 使用示例

### 基础用法

#### 定义枚举

```typescript
import { EnumItem } from '@/utils/enum';

export const enableStatusEnum = Object.freeze({
  ENABLED: EnumItem.of(1, '启用', { type: 'info' }),
  DISABLED: EnumItem.of(0, '未启用', { type: 'error' })
} as const);

export const threadStates = Object.freeze({
  NEW: EnumItem.of('NEW', 'NEW', { type: 'info' }),
  RUNNABLE: EnumItem.of('RUNNABLE', 'RUNNABLE', { type: 'success' }),
  BLOCKED: EnumItem.of('BLOCKED', 'BLOCKED', { type: 'error' }),
  WAITING: EnumItem.of('WAITING', 'WAITING', { type: 'warning' }),
  TERMINATED: EnumItem.of('TERMINATED', 'TERMINATED')
} as const);
```

#### 使用工具函数

```typescript
import { getLabelByValue, getTagByValue, getOptions } from '@/utils/enum';
import { enableStatusEnum } from '@/enum/commonEnums';

// 获取标签
const label = getLabelByValue(enableStatusEnum, 1); // '启用'

// 获取标签样式
const tag = getTagByValue(enableStatusEnum, 1); // { type: 'info' }

// 获取选项列表（用于 Select）
const options = getOptions(enableStatusEnum);
// [
//   { value: 1, label: '启用', tag: { type: 'info' } },
//   { value: 0, label: '未启用', tag: { type: 'error' } }
// ]
```

---

### 在 Vue 组件中使用

#### 方式 1: 直接使用工具函数

```vue
<template>
  <div>
    <NSelect v-model:value="status" :options="statusOptions" />
    <NTag :type="getStatusTag(status)?.type">
      {{ getStatusLabel(status) }}
    </NTag>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NSelect, NTag } from 'naive-ui';
import { getLabelByValue, getTagByValue, getOptions } from '@/utils/enum';
import { enableStatusEnum } from '@/enum/commonEnums';

const status = ref(1);

// 获取选项列表
const statusOptions = computed(() => getOptions(enableStatusEnum));

// 获取标签
const getStatusLabel = (value: number) => getLabelByValue(enableStatusEnum, value);

// 获取标签样式
const getStatusTag = (value: number) => getTagByValue(enableStatusEnum, value);
</script>
```

#### 方式 2: 使用 Composable（推荐）

```vue
<template>
  <div>
    <NSelect v-model:value="status" :options="statusEnum.options.value" />
    <NTag :type="statusEnum.getTag(status)?.type">
      {{ statusEnum.getLabel(status) }}
    </NTag>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NSelect, NTag } from 'naive-ui';
import { useEnum } from '@/composables/useEnum';
import { enableStatusEnum } from '@/enum/commonEnums';

const status = ref(1);

// 使用枚举 Composable
const statusEnum = useEnum(enableStatusEnum);

// statusEnum.options.value - 选项列表（响应式）
// statusEnum.getLabel(value) - 获取标签
// statusEnum.getTag(value) - 获取标签样式
// statusEnum.hasValue(value) - 判断值是否存在
// statusEnum.isValid(value) - 类型守卫
</script>
```

---

### 在数据表格中使用

```vue
<template>
  <NDataTable :columns="columns" :data="tableData" />
</template>

<script setup lang="ts">
import { h } from 'vue';
import { NDataTable, NTag, type DataTableColumns } from 'naive-ui';
import { useEnum } from '@/composables/useEnum';
import { enableStatusEnum } from '@/enum/commonEnums';

const statusEnum = useEnum(enableStatusEnum);

interface TableRow {
  id: number;
  name: string;
  status: number;
}

const tableData = ref<TableRow[]>([
  { id: 1, name: '用户A', status: 1 },
  { id: 2, name: '用户B', status: 0 }
]);

const columns: DataTableColumns<TableRow> = [
  { title: 'ID', key: 'id' },
  { title: '姓名', key: 'name' },
  {
    title: '状态',
    key: 'status',
    render: (row) => {
      const tag = statusEnum.getTag(row.status);
      return h(
        NTag,
        { type: tag?.type },
        { default: () => statusEnum.getLabel(row.status) }
      );
    }
  }
];
</script>
```

---

### 使用多个枚举

```vue
<script setup lang="ts">
import { useEnums } from '@/composables/useEnum';
import { enableStatusEnum } from '@/enum/commonEnums';
import { threadStates } from '@/enum/threadStateEnums';
import { userStateEnum } from '@/enum/userEnums';

// 一次性使用多个枚举
const enums = useEnums({
  status: enableStatusEnum,
  thread: threadStates,
  user: userStateEnum
});

// 使用
enums.status.getLabel(1);           // '启用'
enums.thread.options.value;         // 线程状态选项列表
enums.user.hasValue('00');          // true
</script>
```

---

## 🎯 高级功能

### 1. 类型守卫

```typescript
import { isValidEnumValue } from '@/utils/enum';
import { enableStatusEnum } from '@/enum/commonEnums';

function processStatus(value: unknown) {
  // 类型守卫 - 验证并窄化类型
  if (isValidEnumValue(enableStatusEnum, value)) {
    // 这里 value 的类型已经被窄化为有效的枚举值类型
    const label = getLabelByValue(enableStatusEnum, value);
    console.log(label);
  } else {
    console.error('无效的状态值:', value);
  }
}
```

### 2. 根据标签获取值

```typescript
import { getValueByLabel } from '@/utils/enum';
import { enableStatusEnum } from '@/enum/commonEnums';

const value = getValueByLabel(enableStatusEnum, '启用'); // 1
```

### 3. 禁用选项

```typescript
export const statusEnum = Object.freeze({
  ENABLED: EnumItem.of(1, '启用', { type: 'info' }),
  DISABLED: EnumItem.of(0, '禁用', { type: 'error' }, true) // 禁用这个选项
} as const);
```

### 4. 获取所有值/标签

```typescript
import { getValues, getLabels } from '@/utils/enum';
import { enableStatusEnum } from '@/enum/commonEnums';

const values = getValues(enableStatusEnum);  // [1, 0]
const labels = getLabels(enableStatusEnum);  // ['启用', '未启用']
```

---

## 🛠️ API 参考

### EnumItem 类

#### `EnumItem.of(value, label, tag?, disabled?)`
创建枚举项

- `value`: 枚举值（number | string）
- `label`: 显示标签（string）
- `tag`: 标签样式（可选）
  - `color`: 颜色（string）
  - `type`: 类型（'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'）
- `disabled`: 是否禁用（boolean，可选）

### 工具函数

#### `getLabelByValue(enums, value, defaultLabel?)`
根据值获取标签，找不到时返回 defaultLabel（默认 '-'）

#### `getTagByValue(enums, value)`
根据值获取标签样式

#### `getOptions(enums)`
获取选项列表（用于 Select 等组件）

#### `getValues(enums)`
获取所有枚举值数组

#### `getLabels(enums)`
获取所有标签数组

#### `hasValue(enums, value)`
判断值是否在枚举中存在

#### `isValidEnumValue(enums, value)`
类型守卫 - 验证值的有效性并窄化类型

#### `getEnumItem(enums, value)`
获取完整的枚举项对象

#### `getValueByLabel(enums, label)`
根据标签获取值

### useEnum Composable

```typescript
const enumHelper = useEnum(yourEnum);

// 返回对象包含:
enumHelper.options          // ComputedRef<EnumItem[]> - 选项列表（响应式）
enumHelper.getLabel(value)  // 获取标签
enumHelper.getTag(value)    // 获取标签样式
enumHelper.getValues()      // 获取所有值
enumHelper.getLabels()      // 获取所有标签
enumHelper.hasValue(value)  // 判断值是否存在
enumHelper.isValid(value)   // 类型守卫
enumHelper.getItem(value)   // 获取枚举项
enumHelper.getValueByLabel(label) // 根据标签获取值
```

---

## 📝 最佳实践

### 1. 枚举定义规范

```typescript
// ✅ 推荐 - 使用 Object.freeze 和 as const
export const statusEnum = Object.freeze({
  ENABLED: EnumItem.of(1, '启用', { type: 'info' }),
  DISABLED: EnumItem.of(0, '禁用', { type: 'error' })
} as const);

// ❌ 不推荐 - 缺少 freeze 和 const
export const statusEnum = {
  ENABLED: EnumItem.of(1, '启用'),
  DISABLED: EnumItem.of(0, '禁用')
};
```

### 2. 在组件中使用 Composable

```typescript
// ✅ 推荐 - 使用 Composable
const statusEnum = useEnum(enableStatusEnum);

// ❌ 不推荐 - 每次都调用工具函数
const label = getLabelByValue(enableStatusEnum, value);
```

### 3. 类型安全

```typescript
// ✅ 推荐 - 使用类型守卫
if (isValidEnumValue(statusEnum, value)) {
  // 类型已经被窄化
  processStatus(value);
}

// ❌ 不推荐 - 直接使用未验证的值
processStatus(value as number);
```

---

## 🎨 样式配置

枚举标签样式支持的类型：

- `default` - 默认样式
- `primary` - 主要色
- `info` - 信息色（蓝色）
- `success` - 成功色（绿色）
- `warning` - 警告色（黄色）
- `error` - 错误色（红色）

```typescript
export const statusEnum = Object.freeze({
  SUCCESS: EnumItem.of(1, '成功', { type: 'success' }),
  FAILED: EnumItem.of(0, '失败', { type: 'error' }),
  PENDING: EnumItem.of(2, '处理中', { type: 'warning', color: '#ff6600' })
} as const);
```

---

## 🔍 调试技巧

```typescript
import { getOptions, getValues, getLabels } from '@/utils/enum';

const enum = enableStatusEnum;

console.log('所有选项:', getOptions(enum));
console.log('所有值:', getValues(enum));
console.log('所有标签:', getLabels(enum));
console.log('是否包含值 1:', hasValue(enum, 1));
```

---

## 📚 参考示例

完整示例请查看:
- `src/views/demo/enum-demo.vue` - 枚举使用示例页面
- `src/enum/` - 枚举定义示例
