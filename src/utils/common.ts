import { div4Round, mul } from '@/utils/math';
import { $t } from '@/locales';

/**
 * Transform record to option
 *
 * @example
 *   ```ts
 *   const record = {
 *     key1: 'label1',
 *     key2: 'label2'
 *   };
 *   const options = transformRecordToOption(record);
 *   // [
 *   //   { value: 'key1', label: 'label1' },
 *   //   { value: 'key2', label: 'label2' }
 *   // ]
 *   ```;
 *
 * @param record
 */
export function transformRecordToOption<T extends Record<string, string>>(record: T) {
  return Object.entries(record).map(([value, label]) => ({
    value,
    label
  })) as CommonType.Option<keyof T, T[keyof T]>[];
}

/**
 * Translate options
 *
 * @param options
 */
export function translateOptions(options: CommonType.Option<string, App.I18n.I18nKey>[]) {
  return options.map(option => ({
    ...option,
    label: $t(option.label)
  }));
}

/**
 * Toggle html class
 *
 * @param className
 */
export function toggleHtmlClass(className: string) {
  function add() {
    document.documentElement.classList.add(className);
  }

  function remove() {
    document.documentElement.classList.remove(className);
  }

  return {
    add,
    remove
  };
}

const KB = 1024;
const MB = mul(KB, 1024);
const GB = mul(MB, 1024);
const TB = mul(GB, 1024);
const MEMORY_PRECISION = 0;

export function formatMemory(memorySize: number | undefined): string  {
  if (!memorySize) {
    return '0';
  }
  if (memorySize < KB) {
    return `${memorySize}KB`;
  }
  if (memorySize < MB) {
    return `${div4Round(memorySize, KB, MEMORY_PRECISION)}MB`;
  }
  if (memorySize < GB) {
    return `${div4Round(memorySize, MB, MEMORY_PRECISION)}GB`;
  }
  if (memorySize < TB) {
    return `${div4Round(memorySize, GB, MEMORY_PRECISION)}TB`;
  }
  return `${div4Round(memorySize, TB, MEMORY_PRECISION)}PB`;
}
