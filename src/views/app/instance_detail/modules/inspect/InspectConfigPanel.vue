<script setup lang="ts">
import { computed } from 'vue';
import type { InspectFormModel } from './types';

interface Props {
  running: boolean;
}

interface Emits {
  submit: [];
  cancel: [];
  reset: [];
  sample: [];
}

defineProps<Props>();
const emit = defineEmits<Emits>();
const model = defineModel<InspectFormModel>({ required: true });

const methodOptions = computed(() =>
  model.value.methodNames.map(methodName => ({
    label: methodName,
    value: methodName
  }))
);
</script>

<template>
  <NCard size="small" class="id-card inspect-config-card">
    <template #header>
      <div class="inspect-card-head">
        <div class="inspect-card-title">
          <SvgIcon icon="lucide:sliders-horizontal" class="text-16px text-primary" />
          <span>配置</span>
        </div>
        <NTag size="small" :bordered="false" round>method probe</NTag>
      </div>
    </template>

    <NForm :model="model" label-placement="top" :disabled="running">
      <div class="inspect-form-grid">
        <div class="inspect-form-section inspect-form-section--full">
          <NFormItem label="类全限定名" path="className">
            <NInput
              v-model:value="model.className"
              placeholder="com.example.service.UserService"
              clearable
            />
          </NFormItem>
        </div>

        <div class="inspect-form-section inspect-form-section--full">
          <NFormItem label="方法名" path="methodNames">
            <NSelect
              v-model:value="model.methodNames"
              multiple
              filterable
              tag
              :options="methodOptions"
              max-tag-count="responsive"
              placeholder="输入方法名后回车创建，可选择多个"
              clearable
            />
          </NFormItem>
        </div>

        <div class="inspect-form-section">
          <NFormItem label="每方法次数" path="times">
            <NInputNumber v-model:value="model.times" class="w-full" :min="1" :max="1000" />
          </NFormItem>
        </div>

        <div class="inspect-form-section">
          <NFormItem label="最低耗时 (ms)" path="minTime">
            <NInputNumber v-model:value="model.minTime" class="w-full" :min="0" clearable />
          </NFormItem>
        </div>

        <div class="inspect-form-section inspect-form-section--full">
          <NFormItem label="能力">
            <div class="inspect-switches">
              <NCheckbox v-model:checked="model.includeTrace" class="inspect-capability">
                <span class="inspect-capability-icon">
                  <SvgIcon icon="lucide:route" />
                </span>
                <span>Trace</span>
              </NCheckbox>
              <NCheckbox v-model:checked="model.includeStack" class="inspect-capability">
                <span class="inspect-capability-icon">
                  <SvgIcon icon="lucide:layers-3" />
                </span>
                <span>Stack</span>
              </NCheckbox>
              <NCheckbox v-model:checked="model.includeReturn" class="inspect-capability">
                <span class="inspect-capability-icon">
                  <SvgIcon icon="lucide:corner-down-left" />
                </span>
                <span>返回值</span>
              </NCheckbox>
            </div>
          </NFormItem>
        </div>
      </div>
    </NForm>

    <div class="inspect-actions">
      <NButton size="small" :disabled="running" @click="emit('sample')">
        <template #icon>
          <SvgIcon icon="lucide:wand-2" />
        </template>
        示例
      </NButton>
      <NButton size="small" :disabled="running" @click="emit('reset')">
        <template #icon>
          <SvgIcon icon="lucide:rotate-ccw" />
        </template>
        重置
      </NButton>
      <NButton v-if="running" size="small" type="error" @click="emit('cancel')">
        <template #icon>
          <SvgIcon icon="lucide:square" />
        </template>
        停止
      </NButton>
      <NButton v-else size="small" type="primary" @click="emit('submit')">
        <template #icon>
          <SvgIcon icon="lucide:play" />
        </template>
        开始 Inspect
      </NButton>
    </div>
  </NCard>
</template>

<style scoped>
.inspect-config-card {
  position: sticky;
  top: 12px;
}

.inspect-card-head,
.inspect-card-title {
  display: flex;
  align-items: center;
}

.inspect-card-head {
  justify-content: space-between;
  gap: 12px;
}

.inspect-card-title {
  gap: 8px;
  min-width: 0;
  font-weight: 650;
}

.inspect-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
}

.inspect-form-section--full {
  grid-column: 1 / -1;
}

.inspect-switches {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.inspect-capability {
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--n-color);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.inspect-capability:hover {
  border-color: var(--n-primary-color);
  background: rgba(24, 160, 88, 0.06);
}

.inspect-capability-icon {
  display: inline-flex;
  margin: 0 6px 0 2px;
  color: var(--n-primary-color);
}

.inspect-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--n-border-color);
  margin-top: 2px;
}

@media (max-width: 1100px) {
  .inspect-config-card {
    position: static;
  }
}

@media (max-width: 640px) {
  .inspect-form-grid,
  .inspect-switches {
    grid-template-columns: 1fr;
  }

  .inspect-actions {
    flex-wrap: wrap;
  }
}
</style>
