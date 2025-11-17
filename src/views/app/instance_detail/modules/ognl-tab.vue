<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NCard, NInput, NInputNumber, NModal, NStatistic } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  instanceId: string;
}

defineProps<Props>();

// OGNL 配置
interface OGNLConfig {
  expression: string;
  classLoader: string;
  timeout: number;
}

const ognlConfig = ref<OGNLConfig>({
  expression: '',
  classLoader: '',
  timeout: 5000
});

// 执行历史记录
interface OGNLHistory {
  id: number;
  expression: string;
  classLoader: string;
  timeout: number;
  timestamp: Date;
  success: boolean;
  executionTime: number;
  result?: any;
  error?: string;
  stackTrace?: string[];
}

const historyRecords = ref<OGNLHistory[]>([]);
const currentResult = ref<OGNLHistory | null>(null);
const showTemplateLibrary = ref(false);
const showHistoryModal = ref(false);
const selectedHistory = ref<OGNLHistory | null>(null);

let historyIdCounter = 1;

// 表达式模板
interface Template {
  id: string;
  title: string;
  description: string;
  expression: string;
  icon: string;
  color: string;
}

const templates: Template[] = [
  {
    id: 'spring-bean',
    title: '获取 Spring Bean',
    description: '通过名称获取 Spring Bean 实例',
    expression: '@applicationContext.getBean("userService")',
    icon: 'lucide:leaf',
    color: 'success'
  },
  {
    id: 'invoke-method',
    title: '调用实例方法',
    description: '调用对象的方法并传递参数',
    expression: '@userService.findById(1001)',
    icon: 'lucide:play-circle',
    color: 'primary'
  },
  {
    id: 'static-method',
    title: '调用静态方法',
    description: '调用类的静态方法',
    expression: '@java.lang.System@currentTimeMillis()',
    icon: 'lucide:zap',
    color: 'info'
  },
  {
    id: 'static-field',
    title: '获取静态字段',
    description: '获取类的静态字段值',
    expression: '@com.example.Constants@MAX_RETRY_COUNT',
    icon: 'lucide:database',
    color: 'warning'
  },
  {
    id: 'system-property',
    title: '系统属性',
    description: '获取 JVM 系统属性',
    expression: '@java.lang.System@getProperty("java.version")',
    icon: 'lucide:settings',
    color: 'default'
  },
  {
    id: 'complex-expr',
    title: '复杂表达式',
    description: '条件判断和链式调用',
    expression: 'user.age > 18 ? "成年" : "未成年"',
    icon: 'lucide:git-branch',
    color: 'error'
  }
];

// 更多示例
const examples = [
  { expr: '@user.getName().toUpperCase()', desc: '链式方法调用' },
  { expr: '#value1 + #value2', desc: '变量计算' },
  { expr: '@list.{? #this.age > 18}', desc: '集合过滤' },
  { expr: '@map.get("key")', desc: 'Map 操作' }
];

// 统计数据
const stats = computed(() => {
  const total = historyRecords.value.length;
  const success = historyRecords.value.filter((h: OGNLHistory) => h.success).length;
  const error = historyRecords.value.filter((h: OGNLHistory) => !h.success).length;
  const avgTime =
    total > 0
      ? Math.round(historyRecords.value.reduce((sum: number, h: OGNLHistory) => sum + h.executionTime, 0) / total)
      : 0;

  return { total, success, error, avgTime };
});

// 表达式长度
const expressionLength = computed(() => ognlConfig.value.expression.length);

// 切换模板库
const toggleTemplateLibrary = () => {
  showTemplateLibrary.value = !showTemplateLibrary.value;
};

// 加载模板
const loadTemplate = (template: Template) => {
  ognlConfig.value.expression = template.expression;
  window.$message?.success(`已加载模板: ${template.title}`);
};

// 执行 OGNL 表达式
const executeOGNL = () => {
  if (!ognlConfig.value.expression.trim()) {
    window.$message?.warning('请输入 OGNL 表达式');
    return;
  }

  // 模拟执行
  const executionTime = Math.floor(Math.random() * 100) + 10;
  const success = Math.random() > 0.2; // 80% 成功率

  const record: OGNLHistory = {
    id: historyIdCounter,
    expression: ognlConfig.value.expression,
    classLoader: ognlConfig.value.classLoader,
    timeout: ognlConfig.value.timeout,
    timestamp: new Date(),
    success,
    executionTime,
    result: success
      ? {
          type: 'java.lang.String',
          value: `Example result for: ${ognlConfig.value.expression}`,
          hashCode: `0x${Math.floor(Math.random() * 0xffffffff).toString(16)}`
        }
      : undefined,
    error: success ? undefined : 'ognl.OgnlException: Could not evaluate expression',
    stackTrace: success
      ? undefined
      : [
          'at ognl.OgnlRuntime.evaluateExpression(OgnlRuntime.java:234)',
          'at ognl.Ognl.getValue(Ognl.java:333)',
          'at com.example.OgnlExecutor.execute(OgnlExecutor.java:45)',
          'at com.example.Controller.executeOgnl(Controller.java:78)'
        ]
  };

  historyIdCounter += 1;

  historyRecords.value.unshift(record);
  currentResult.value = record;

  if (success) {
    window.$message?.success(`执行成功 (${executionTime}ms)`);
  } else {
    window.$message?.error(`执行失败 (${executionTime}ms)`);
  }
};

// 查看历史详情
const viewHistoryDetail = (record: OGNLHistory) => {
  selectedHistory.value = record;
  showHistoryModal.value = true;
};

// 关闭历史详情弹窗
const closeHistoryModal = () => {
  showHistoryModal.value = false;
  selectedHistory.value = null;
};

// 从历史记录复用表达式
const loadHistoryExpression = (record: OGNLHistory) => {
  ognlConfig.value.expression = record.expression;
  ognlConfig.value.classLoader = record.classLoader;
  ognlConfig.value.timeout = record.timeout;
  closeHistoryModal();
  window.$message?.success('已复用历史表达式');
};

// 删除历史记录
const deleteHistoryRecord = (id: number) => {
  const index = historyRecords.value.findIndex((r: OGNLHistory) => r.id === id);
  if (index !== -1) {
    historyRecords.value.splice(index, 1);
    window.$message?.success('已删除历史记录');
  }
};

// 清空表单
const clearForm = () => {
  ognlConfig.value = {
    expression: '',
    classLoader: '',
    timeout: 5000
  };
  currentResult.value = null;
};

// 清空结果
const clearResults = () => {
  currentResult.value = null;
  window.$message?.success('已清空执行结果');
};

// 清空历史
const clearHistory = () => {
  historyRecords.value = [];
  window.$message?.success('已清空执行历史');
};

// 导出结果
const exportResult = () => {
  if (!currentResult.value) {
    window.$message?.warning('暂无执行结果');
    return;
  }

  const data = JSON.stringify(currentResult.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ognl-result.json';
  a.click();
  URL.revokeObjectURL(url);

  window.$message?.success('导出成功');
};

// 复制结果
const copyResult = () => {
  if (!currentResult.value?.result) {
    window.$message?.warning('暂无结果可复制');
    return;
  }

  const valueStr =
    typeof currentResult.value.result.value === 'object'
      ? JSON.stringify(currentResult.value.result.value, null, 2)
      : String(currentResult.value.result.value);

  navigator.clipboard
    .writeText(valueStr)
    .then(() => {
      window.$message?.success('已复制到剪贴板');
    })
    .catch(() => {
      window.$message?.error('复制失败');
    });
};

// 显示帮助
const showHelp = () => {
  window.$message?.info('OGNL 表达式帮助文档 (功能开发中)');
};

// 格式化完整时间
const formatFullTime = (date: Date) => {
  return date.toLocaleString('zh-CN');
};
</script>

<template>
  <div class="h-full flex flex-col gap-16px">
    <!-- 头部统计 -->
    <div class="grid grid-cols-1 gap-16px md:grid-cols-4">
      <NCard size="small" class="border-warning/20 bg-warning/10">
        <NStatistic label="执行次数" :value="stats.total">
          <template #prefix>
            <SvgIcon icon="lucide:terminal" class="text-warning" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small" class="border-success/20 bg-success/10">
        <NStatistic label="成功执行" :value="stats.success">
          <template #prefix>
            <SvgIcon icon="lucide:check-circle" class="text-success" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small" class="border-error/20 bg-error/10">
        <NStatistic label="执行失败" :value="stats.error">
          <template #prefix>
            <SvgIcon icon="lucide:alert-circle" class="text-error" />
          </template>
        </NStatistic>
      </NCard>

      <NCard size="small" class="border-info/20 bg-info/10">
        <NStatistic label="平均耗时" :value="stats.avgTime">
          <template #prefix>
            <SvgIcon icon="lucide:clock" class="text-info" />
          </template>
          <template #suffix>
            <span class="ml-4px text-14px">ms</span>
          </template>
        </NStatistic>
      </NCard>
    </div>

    <!-- 表达式模板库 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:book-marked" class="text-16px text-warning" />
            <span class="font-semibold">表达式模板库</span>
          </div>
          <NButton text @click="toggleTemplateLibrary">
            <template #icon>
              <SvgIcon :icon="showTemplateLibrary ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
            </template>
            {{ showTemplateLibrary ? '收起' : '展开' }}
          </NButton>
        </div>
      </template>

      <div v-if="showTemplateLibrary">
        <div class="grid grid-cols-1 mb-16px gap-12px lg:grid-cols-3 md:grid-cols-2">
          <div
            v-for="template in templates"
            :key="template.id"
            class="cursor-pointer border border-gray/20 rounded-8px bg-container/50 p-16px transition hover:border-warning/50"
            @click="loadTemplate(template)"
          >
            <div class="flex items-start gap-12px">
              <div class="h-32px w-32px flex-center flex-shrink-0 rounded-8px" :class="[`bg-${template.color}/20`]">
                <SvgIcon :icon="template.icon" :class="`text-${template.color}`" class="text-16px" />
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="mb-4px text-14px font-semibold">{{ template.title }}</h4>
                <p class="mb-8px text-12px text-gray">{{ template.description }}</p>
                <code class="block overflow-x-auto rounded-4px bg-black/20 px-8px py-4px text-11px text-warning">
                  {{ template.expression }}
                </code>
              </div>
            </div>
          </div>
        </div>

        <!-- 更多示例 -->
        <div class="border border-gray/20 rounded-8px bg-container/30 p-16px">
          <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
            <SvgIcon icon="lucide:lightbulb" class="text-16px text-warning" />
            更多示例
          </h4>
          <div class="text-12px space-y-8px">
            <div v-for="(example, index) in examples" :key="index" class="flex items-start gap-8px">
              <span class="text-gray">•</span>
              <div class="flex-1">
                <code class="text-warning">{{ example.expr }}</code>
                <span class="ml-8px text-gray">- {{ example.desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 表达式输入区 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center gap-8px">
          <SvgIcon icon="lucide:code" class="text-16px text-warning" />
          <span class="font-semibold">OGNL 表达式</span>
        </div>
      </template>

      <div class="space-y-16px">
        <div>
          <label class="mb-8px block text-14px font-medium">表达式</label>
          <NInput
            v-model:value="ognlConfig.expression"
            type="textarea"
            :rows="4"
            placeholder='输入 OGNL 表达式,例如:
@applicationContext.getBean("userService")
@java.lang.System@currentTimeMillis()
@userService.findById(1001)'
            class="font-mono"
          />
          <div class="mt-8px flex-y-center justify-between text-12px text-gray">
            <span>支持 Spring Bean、静态方法、实例方法、字段访问等</span>
            <span>{{ expressionLength }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-16px md:grid-cols-2">
          <div>
            <label class="mb-8px block text-14px font-medium">
              ClassLoader Hash
              <span class="ml-4px text-12px text-gray">(可选)</span>
            </label>
            <NInput v-model:value="ognlConfig.classLoader" placeholder="例如: 3d4eac69" />
          </div>

          <div>
            <label class="mb-8px block text-14px font-medium">超时时间 (ms)</label>
            <NInputNumber v-model:value="ognlConfig.timeout" :min="100" :max="60000" class="w-full" />
          </div>
        </div>

        <div class="flex-y-center gap-8px">
          <NButton type="warning" @click="executeOGNL">
            <template #icon>
              <SvgIcon icon="lucide:play" />
            </template>
            执行表达式
          </NButton>
          <NButton @click="clearForm">
            <template #icon>
              <SvgIcon icon="lucide:rotate-ccw" />
            </template>
            重置
          </NButton>
          <NButton @click="showHelp">
            <template #icon>
              <SvgIcon icon="lucide:help-circle" />
            </template>
            帮助
          </NButton>
        </div>
      </div>
    </NCard>

    <!-- 执行结果 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:file-output" class="text-16px text-success" />
            <span class="font-semibold">执行结果</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NButton size="small" @click="exportResult">
              <template #icon>
                <SvgIcon icon="lucide:download" />
              </template>
              导出
            </NButton>
            <NButton size="small" @click="clearResults">
              <template #icon>
                <SvgIcon icon="lucide:trash-2" />
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="!currentResult" class="py-48px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
        </div>
        <p class="text-14px">暂无执行结果</p>
        <p class="mt-4px text-12px">输入 OGNL 表达式并执行后，结果将显示在这里</p>
      </div>

      <div
        v-else
        class="border rounded-8px p-16px"
        :class="[currentResult.success ? 'border-success/30 bg-container/50' : 'border-error/30 bg-container/50']"
      >
        <!-- 顶部状态栏 -->
        <div class="mb-12px flex items-start justify-between">
          <div class="flex items-center gap-8px">
            <div class="h-8px w-8px rounded-full" :class="[currentResult.success ? 'bg-success' : 'bg-error']" />
            <span class="text-14px font-semibold" :class="[currentResult.success ? 'text-success' : 'text-error']">
              {{ currentResult.success ? '执行成功' : '执行失败' }}
            </span>
            <span class="text-12px text-gray">耗时: {{ currentResult.executionTime }}ms</span>
            <span class="text-12px text-gray">· {{ formatFullTime(currentResult.timestamp) }}</span>
          </div>
          <div class="flex items-center gap-8px">
            <span
              v-if="currentResult.success && currentResult.result"
              class="rounded-4px bg-info/20 px-8px py-4px text-12px text-info"
            >
              {{ currentResult.result.type }}
            </span>
            <NButton v-if="currentResult.success" text size="small" @click="copyResult">
              <template #icon>
                <SvgIcon icon="lucide:copy" class="text-14px" />
              </template>
            </NButton>
          </div>
        </div>

        <!-- 执行参数 -->
        <div class="mb-12px border border-gray/20 rounded-6px bg-black/10 p-12px">
          <div class="mb-8px flex-y-center gap-6px text-12px text-gray font-semibold">
            <SvgIcon icon="lucide:arrow-down-to-line" class="text-14px text-info" />
            执行参数:
          </div>
          <div class="text-11px space-y-6px">
            <div class="flex items-start gap-8px">
              <span class="min-w-80px text-gray">表达式:</span>
              <code class="flex-1 text-warning">{{ currentResult.expression }}</code>
            </div>
            <div v-if="currentResult.classLoader" class="flex items-start gap-8px">
              <span class="min-w-80px text-gray">ClassLoader:</span>
              <code class="flex-1 text-gray-400">{{ currentResult.classLoader }}</code>
            </div>
            <div class="flex items-start gap-8px">
              <span class="min-w-80px text-gray">超时时间:</span>
              <span class="text-gray-400">{{ currentResult.timeout }}ms</span>
            </div>
          </div>
        </div>

        <!-- 执行结果 -->
        <div v-if="currentResult.success && currentResult.result">
          <div class="mb-8px text-12px text-gray font-semibold">执行结果:</div>
          <div class="overflow-x-auto rounded-6px bg-black/20 p-12px">
            <pre class="text-11px text-gray-300 font-mono">{{ currentResult.result.value }}</pre>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="!currentResult.success && currentResult.error">
          <div class="mb-8px text-12px text-gray font-semibold">错误信息:</div>
          <div class="mb-12px rounded-6px bg-error/10 p-12px">
            <div class="text-12px text-error">{{ currentResult.error }}</div>
          </div>

          <details v-if="currentResult.stackTrace" class="text-11px">
            <summary class="cursor-pointer text-gray hover:text-gray-300">查看堆栈跟踪</summary>
            <div class="mt-8px overflow-x-auto rounded-6px bg-black/20 p-12px">
              <pre class="text-11px text-gray-400 font-mono">{{ currentResult.stackTrace.join('\n') }}</pre>
            </div>
          </details>
        </div>
      </div>
    </NCard>

    <!-- 执行历史 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:history" class="text-16px text-info" />
            <span class="font-semibold">执行历史</span>
          </div>
          <NButton size="small" @click="clearHistory">
            <template #icon>
              <SvgIcon icon="lucide:trash-2" />
            </template>
            清空历史
          </NButton>
        </div>
      </template>

      <div v-if="historyRecords.length === 0" class="py-32px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:clock" class="text-40px opacity-50" />
        </div>
        <p class="text-14px">暂无执行历史</p>
      </div>

      <div v-else class="space-y-8px">
        <div
          v-for="record in historyRecords"
          :key="record.id"
          class="cursor-pointer border border-gray/20 rounded-8px bg-container/30 p-12px transition hover:border-warning/50"
          @click="viewHistoryDetail(record)"
        >
          <div class="mb-8px flex-y-center justify-between">
            <div class="flex items-center gap-8px">
              <div class="h-6px w-6px rounded-full" :class="[record.success ? 'bg-success' : 'bg-error']" />
              <span class="text-12px text-gray">{{ formatFullTime(record.timestamp) }}</span>
              <span class="text-12px text-gray">{{ record.executionTime }}ms</span>
            </div>
            <div class="flex items-center gap-4px">
              <NButton text size="tiny" title="复用表达式" @click.stop="loadHistoryExpression(record)">
                <template #icon>
                  <SvgIcon icon="lucide:code" class="text-14px" />
                </template>
              </NButton>
              <NButton text size="tiny" title="删除" @click.stop="deleteHistoryRecord(record.id)">
                <template #icon>
                  <SvgIcon icon="lucide:x" class="text-14px" />
                </template>
              </NButton>
            </div>
          </div>
          <code class="block overflow-x-auto truncate text-12px text-warning font-mono">{{ record.expression }}</code>
        </div>
      </div>
    </NCard>

    <!-- 历史详情弹窗 -->
    <NModal
      v-model:show="showHistoryModal"
      preset="card"
      title="OGNL 执行详情"
      class="max-w-4xl w-90%"
      :segmented="{
        content: true,
        footer: 'soft'
      }"
    >
      <template #header-extra>
        <span class="text-12px text-gray">历史记录查看</span>
      </template>

      <div v-if="selectedHistory" class="space-y-16px">
        <!-- 执行参数 -->
        <div class="border border-gray/20 rounded-8px bg-container/50 p-16px">
          <h4 class="mb-12px flex-y-center gap-8px text-14px font-semibold">
            <SvgIcon icon="lucide:arrow-down-to-line" class="text-16px text-info" />
            执行参数
          </h4>
          <div class="text-12px space-y-10px">
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">表达式:</span>
              <code class="flex-1 rounded-4px bg-black/20 px-8px py-4px text-warning font-mono">
                {{ selectedHistory.expression }}
              </code>
            </div>
            <div v-if="selectedHistory.classLoader" class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">ClassLoader:</span>
              <code class="flex-1 rounded-4px bg-black/20 px-8px py-4px text-gray-400 font-mono">
                {{ selectedHistory.classLoader }}
              </code>
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">超时时间:</span>
              <span class="text-gray-400">{{ selectedHistory.timeout }}ms</span>
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">执行时间:</span>
              <span class="text-gray-400">{{ formatFullTime(selectedHistory.timestamp) }}</span>
            </div>
            <div class="flex items-start gap-12px">
              <span class="min-w-90px flex-shrink-0 text-gray">执行耗时:</span>
              <span class="text-gray-400">{{ selectedHistory.executionTime }}ms</span>
            </div>
          </div>
        </div>

        <!-- 执行结果 -->
        <div
          v-if="selectedHistory.success && selectedHistory.result"
          class="border border-success/30 rounded-8px bg-container/50 p-16px"
        >
          <h4 class="mb-12px flex items-center justify-between text-14px text-success font-semibold">
            <div class="flex-y-center gap-8px">
              <SvgIcon icon="lucide:arrow-up-from-line" class="text-16px" />
              执行结果
            </div>
            <span class="ml-auto rounded-4px bg-info/20 px-8px py-4px text-12px text-info">
              {{ selectedHistory.result.type }}
            </span>
          </h4>
          <div class="max-h-96 overflow-x-auto rounded-6px bg-black/20 p-12px">
            <pre class="text-12px text-gray-300 font-mono">{{ selectedHistory.result.value }}</pre>
          </div>
        </div>

        <!-- 执行错误 -->
        <div v-if="!selectedHistory.success" class="border border-error/30 rounded-8px bg-container/50 p-16px">
          <h4 class="mb-12px flex-y-center gap-8px text-14px text-error font-semibold">
            <SvgIcon icon="lucide:alert-circle" class="text-16px" />
            执行错误
          </h4>
          <div class="mb-12px rounded-6px bg-error/10 p-12px">
            <div class="text-12px text-error">{{ selectedHistory.error }}</div>
          </div>

          <details v-if="selectedHistory.stackTrace" class="text-12px">
            <summary class="cursor-pointer text-gray hover:text-gray-300">查看堆栈跟踪</summary>
            <div class="mt-8px max-h-64 overflow-x-auto rounded-6px bg-black/20 p-12px">
              <pre class="text-11px text-gray-400 font-mono">{{ selectedHistory.stackTrace.join('\n') }}</pre>
            </div>
          </details>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-12px">
          <NButton v-if="selectedHistory" type="warning" @click="loadHistoryExpression(selectedHistory)">
            <template #icon>
              <SvgIcon icon="lucide:code" />
            </template>
            复用此表达式
          </NButton>
          <NButton @click="closeHistoryModal">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped></style>
