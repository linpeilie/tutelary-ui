<script lang="ts" setup>
import type { Ref, StyleValue } from 'vue';
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { useThemeVars } from 'naive-ui';
import { isFunction, isNullOrUndef } from '@/utils/is';
import type { OptionsType, Props } from './types/t-segmented';

defineOptions({
  name: 'TSegmented'
});

const themeVars = useThemeVars();

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  block: true,
  size: 'medium',
  disabled: false,
  resize: true
});

interface Emits {
  (e: 'change', index: number, option: OptionsType): void;

  (e: 'update:modelValue', value: any): void;
}

const emit = defineEmits<Emits>();

const width = ref(0);
const translateX = ref(0);
const initStatus = ref(false);
const curMouseActive = ref(-1);
const segmentedItembg = ref('');
const instance = getCurrentInstance();
const curIndex: Ref<number> = ref(-1);
const segmentedRef = ref(null);

function handleChange({ option, index }: { option: OptionsType; index: number }, event: Event) {
  if (props.disabled || option.disabled) return;
  event.preventDefault();
  emit('update:modelValue', option.value);
  curIndex.value = index;
  segmentedItembg.value = '';
  emit('change', index, option);
}

function handleMouseenter({ index }: { option: OptionsType; index: number }, event: Event) {
  if (props.disabled) return;
  event.preventDefault();
  curMouseActive.value = index;
}

function handleMouseleave(_: any, event: Event) {
  if (props.disabled) return;
  event.preventDefault();
  curMouseActive.value = -1;
}

function handleInit(index = curIndex.value) {
  nextTick(() => {
    const curLabelRef = instance?.proxy?.$refs[`labelRef${index}`] as HTMLElement[];
    if (!curLabelRef || curLabelRef.length === 0) return;
    width.value = curLabelRef[0].clientWidth;
    translateX.value = curLabelRef[0].offsetLeft;
    initStatus.value = true;
  });
}

function handleResizeInit() {
  useResizeObserver(segmentedRef, () => {
    nextTick(() => {
      handleInit(curIndex.value);
    });
  });
}

if (props.block || props.resize) handleResizeInit();

watch(
  () => curIndex.value,
  index => {
    nextTick(() => {
      handleInit(index);
    });
  },
  { immediate: true }
);

watch(() => props.size, handleResizeInit, { immediate: true });

onMounted(() => {
  if (!isNullOrUndef(props.modelValue)) {
    curIndex.value = props.options.map(option => option.value).indexOf(props.modelValue);
  }
});

watch(
  () => props.modelValue,
  () => {
    curIndex.value = props.options.map(option => option.value).indexOf(props.modelValue);
  }
);

const getLabelStyle = (_option: OptionsType, index: number): StyleValue => {
  const style: Record<string, string> = {};

  if (curMouseActive.value === index && segmentedItembg.value) {
    style.background = segmentedItembg.value;
  }

  return style;
};
</script>

<template>
  <div
    ref="segmentedRef"
    class="t-segmented bg-zinc-100 dark:bg-zinc-500"
    :class="[
      { 't-segmented-block': block, 't-segmented--large': size === 'large', 't-segmented--small': size === 'small' }
    ]"
  >
    <div class="t-segmented-group">
      <div
        class="t-segmented-item-selected bg-white dark:bg-zinc-800"
        :style="{
          width: `${width}px`,
          transform: `translateX(${translateX}px)`,
          display: initStatus ? 'block' : 'none'
        }"
      ></div>
      <label
        v-for="(option, index) in options"
        :key="index"
        :ref="`labelRef${index}`"
        class="t-segmented-item text-black dark:text-white"
        :class="[
          {
            't-segmented-item-disabled': disabled || option.disabled,
            'hover:bg-zinc-300': !disabled,
            'dark:hover:bg-zinc-600': !disabled
          }
        ]"
        :style="getLabelStyle(option, index)"
        @mouseenter="event => handleMouseenter({ option, index }, event)"
        @mouseleave="event => handleMouseleave({}, event)"
        @click="event => handleChange({ option, index }, event)"
      >
        <input type="radio" name="segmented" />
        <div class="t-segmented-item-label">
          <span
            v-if="option.icon && !isFunction(option.label)"
            class="t-segmented-item-icon"
            :style="{ marginRight: option.label ? '6px' : 0 }"
          >
            <SvgIcon v-if="option.iconType === 'iconify'" :icon="option.icon" />
            <SvgIcon v-if="option.iconType === 'iconfont'" :local-icon="option.icon" />
          </span>
          <span v-if="option.label && !isFunction(option.label)">{{ option.label }}</span>
          <component :is="option.label" v-if="option.label && isFunction(option.label)"></component>
        </div>
      </label>
    </div>
  </div>
</template>

<style scoped>
.t-segmented {
  --t-control-padding-horizontal: 12px;
  --t-control-padding-horizontal-sm: 8px;
  --t-segmented-track-padding: 2px;
  --t-segmented-line-width: 1px;

  --t-segmented-border-radius-small: 6px;
  --t-segmented-border-radius-base: 8px;
  --t-segmented-border-radius-large: 10px;

  box-sizing: border-box;
  display: inline-block;
  padding: var(--t-segmented-track-padding);
  font-size: v-bind('themeVars.fontSize');

  border-radius: var(--t-segmented-border-radius-base);
}

.t-segmented-block {
  display: flex;
}

.t-segmented-block .t-segmented-item {
  flex: 1 1 auto;
  min-width: fit-content;
}

.t-segmented-block .t-segmented-item > .t-segmented-item-label > span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* small */
.t-segmented.t-segmented--small {
  border-radius: var(--t-segmented-border-radius-small);
}

.t-segmented.t-segmented--small .t-segmented-item {
  border-radius: v-bind('themeVars.borderRadiusSmall');
}

.t-segmented.t-segmented--small .t-segmented-item > div {
  min-height: calc(v-bind('themeVars.heightMedium') - var(--t-segmented-track-padding) * 2);
  line-height: calc(v-bind('themeVars.heightMedium') - var(--t-segmented-track-padding) * 2);
  padding: 0 calc(var(--t-control-padding-horizontal-sm) - var(--t-segmented-line-width));
}

/* large */
.t-segmented.t-segmented--large {
  border-radius: var(--t-segmented-border-radius-large);
}

.t-segmented.t-segmented--large .t-segmented-item {
  border-radius: calc(v-bind('themeVars.borderRadius') + v-bind('themeVars.borderRadiusSmall'));
}

.t-segmented.t-segmented--large .t-segmented-item > div {
  min-height: calc(v-bind('themeVars.heightLarge') - var(--t-segmented-track-padding) * 2);
  line-height: calc(v-bind('themeVars.heightLarge') - var(--t-segmented-track-padding) * 2);
  padding: 0 calc(var(--t-control-padding-horizontal) - var(--t-segmented-line-width));
  font-size: v-bind('themeVars.fontSizeLarge');
}

/* default */
.t-segmented-item {
  position: relative;
  text-align: center;
  cursor: pointer;
  border-radius: v-bind('themeVars.borderRadius');
  transition: all 0.1s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.t-segmented .t-segmented-item > div {
  min-height: calc(v-bind('themeVars.heightMedium') - var(--t-segmented-track-padding) * 2);
  line-height: calc(v-bind('themeVars.heightMedium') - var(--t-segmented-track-padding) * 2);
  padding: 0 calc(var(--t-control-padding-horizontal) - var(--t-segmented-line-width));
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: 0.1s;
}

.t-segmented-group {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-items: flex-start;
  width: 100%;
}

.t-segmented-item-selected {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  display: none;
  width: 0;
  height: 100%;
  padding: 4px 0;
  border-radius: 8px;
  box-shadow:
    0 2px 8px -2px rgb(0 0 0 / 5%),
    0 1px 4px -1px rgb(0 0 0 / 7%),
    0 0 1px rgb(0 0 0 / 7%);
  transition:
    transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1),
    width 0.5s cubic-bezier(0.645, 0.045, 0.355, 1);
  will-change: transform, width;
}

.t-segmented-item > input {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.t-segmented-item-label {
  display: flex;
  align-items: center;
  justify-content: center;
}

.t-segmented-item-icon {
  width: 20px;
  height: 20px;
  line-height: 20px;
}

.t-segmented-item-disabled {
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
}
</style>
