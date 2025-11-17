<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NProgress,
  NTag,
  useMessage
} from 'naive-ui';

interface WatchConfig {
  methods: string;
  count: number;
  minTime: number | null;
  maxTime: number | null;
}

interface WatchResult {
  id: number;
  className: string;
  methodName: string;
  fullName: string;
  timestamp: Date;
  duration: number;
  params: any[];
  target: any;
  returnValue: any;
  exception: {
    type: string;
    message: string;
    stackTrace: string;
  } | null;
  expanded: boolean;
}

defineOptions({
  name: 'WatchTab'
});

interface Props {
  instanceId: string;
}

defineProps<Props>();

const message = useMessage();

const watchFormRef = ref();
const isWatching = ref(false);
const elapsedTime = ref('00:00');

const watchConfig = reactive<WatchConfig>({
  methods: '',
  count: 50,
  minTime: null,
  maxTime: null
});

const watchProgress = reactive({
  captured: 0,
  total: 0,
  percent: 0
});

const watchResults = ref<WatchResult[]>([]);
let watchInterval: NodeJS.Timeout | null = null;
let timeInterval: NodeJS.Timeout | null = null;

const resultInfo = computed(() => {
  if (watchResults.value.length === 0) return '';
  const classes = new Set(watchResults.value.map(r => r.className));
  const methods = new Set(watchResults.value.map(r => r.fullName));
  return `共 ${watchResults.value.length} 条记录,来自 ${classes.size} 个类的 ${methods.size} 个方法`;
});

// 开始观察
function startWatch() {
  if (!watchConfig.methods.trim()) {
    message.warning('请填写方法列表');
    return;
  }

  // 解析方法列表
  const methodEntries = watchConfig.methods
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(s => s);

  const parsedMethods: Array<{ className: string; methodName: string; fullName: string }> = [];

  for (const entry of methodEntries) {
    const lastDotIndex = entry.lastIndexOf('.');
    if (lastDotIndex === -1) {
      message.error(`方法格式错误: "${entry}"。正确格式：类名.method名`);
      return;
    }
    const className = entry.substring(0, lastDotIndex);
    const methodName = entry.substring(lastDotIndex + 1);
    parsedMethods.push({ className, methodName, fullName: entry });
  }

  isWatching.value = true;
  watchResults.value = [];
  watchProgress.captured = 0;
  watchProgress.total = watchConfig.count;
  watchProgress.percent = 0;

  const startTime = Date.now();

  // 计时器
  timeInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    elapsedTime.value = `${minutes}:${seconds}`;
  }, 1000);

  // 捕获数据
  let captured = 0;
  watchInterval = setInterval(() => {
    if (captured >= watchConfig.count) {
      stopWatch();
      return;
    }

    captured += Math.floor(Math.random() * 3) + 1;
    if (captured > watchConfig.count) captured = watchConfig.count;

    watchProgress.captured = captured;
    watchProgress.percent = Math.round((captured / watchConfig.count) * 100);

    // 生成新结果
    const result = generateWatchResult(captured, parsedMethods);
    if (result) {
      watchResults.value.push(result);
    }
  }, 300);
}

// 停止观察
function stopWatch() {
  if (watchInterval) {
    clearInterval(watchInterval);
    watchInterval = null;
  }
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
  isWatching.value = false;
  message.success(`观察完成,共捕获 ${watchProgress.captured} 条记录`);
}

// 生成观察结果
function generateWatchResult(
  id: number,
  parsedMethods: Array<{ className: string; methodName: string; fullName: string }>
): WatchResult | null {
  const methodEntry = parsedMethods[Math.floor(Math.random() * parsedMethods.length)];
  const duration = Math.floor(Math.random() * 1000) + 10;

  // 应用耗时过滤
  if (watchConfig.minTime && duration < watchConfig.minTime) return null;
  if (watchConfig.maxTime && duration > watchConfig.maxTime) return null;

  const hasException = Math.random() > 0.85; // 15% 概率有异常

  return {
    id,
    className: methodEntry.className,
    methodName: methodEntry.methodName,
    fullName: methodEntry.fullName,
    timestamp: new Date(Date.now() - Math.random() * 60000),
    duration,
    params: generateMockParams(methodEntry.methodName),
    target: generateMockTarget(methodEntry.className),
    returnValue: hasException ? null : generateMockReturn(methodEntry.methodName),
    exception: hasException ? generateMockException() : null,
    expanded: false
  };
}

// 生成模拟参数
function generateMockParams(methodName: string): any[] {
  const paramSets: Record<string, any[]> = {
    getUserById: [{ name: 'userId', type: 'Long', value: Math.floor(Math.random() * 10000) }],
    createUser: [
      {
        name: 'userDTO',
        type: 'UserDTO',
        value: {
          username: `user_${Math.floor(Math.random() * 1000)}`,
          email: 'user@example.com',
          age: Math.floor(Math.random() * 50) + 20
        }
      }
    ],
    updateUser: [
      { name: 'userId', type: 'Long', value: Math.floor(Math.random() * 10000) },
      { name: 'userDTO', type: 'UserDTO', value: { username: 'updated_user', email: 'updated@example.com' } }
    ],
    deleteUser: [{ name: 'userId', type: 'Long', value: Math.floor(Math.random() * 10000) }],
    default: [
      { name: 'arg0', type: 'String', value: `param_${Math.floor(Math.random() * 100)}` },
      { name: 'arg1', type: 'int', value: Math.floor(Math.random() * 100) }
    ]
  };
  return paramSets[methodName] || paramSets.default;
}

// 生成模拟 Target
function generateMockTarget(className: string): any {
  return {
    '@class': className,
    '@identity': `0x${Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .toUpperCase()}`,
    '@classLoader': 'app',
    instanceField1: `value_${Math.floor(Math.random() * 100)}`,
    instanceField2: Math.floor(Math.random() * 1000)
  };
}

// 生成模拟返回值
function generateMockReturn(methodName: string): any {
  const returnSets: Record<string, any> = {
    getUserById: {
      id: Math.floor(Math.random() * 10000),
      username: `user_${Math.floor(Math.random() * 1000)}`,
      email: 'user@example.com',
      status: 'active'
    },
    createUser: { success: true, userId: Math.floor(Math.random() * 10000), message: 'User created successfully' },
    updateUser: { success: true, message: 'User updated successfully' },
    deleteUser: { success: true, message: 'User deleted successfully' },
    default: { status: 'success', data: `result_${Math.floor(Math.random() * 100)}` }
  };
  return returnSets[methodName] || returnSets.default;
}

// 生成模拟异常
function generateMockException(): { type: string; message: string; stackTrace: string } {
  const exceptions = [
    {
      type: 'java.lang.NullPointerException',
      message: 'Cannot invoke method on null object reference',
      stackTrace: `java.lang.NullPointerException: Cannot invoke method on null object reference
    at com.example.service.UserService.getUserById(UserService.java:${Math.floor(Math.random() * 200) + 50})
    at com.example.controller.UserController.getUser(UserController.java:${Math.floor(Math.random() * 100) + 20})
    at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.lang.reflect.Method.invoke(Method.java:498)`
    },
    {
      type: 'java.sql.SQLException',
      message: 'Connection timeout: Unable to connect to database',
      stackTrace: `java.sql.SQLException: Connection timeout: Unable to connect to database
    at com.mysql.jdbc.SQLError.createSQLException(SQLError.java:${Math.floor(Math.random() * 200) + 1000})
    at com.mysql.jdbc.MysqlIO.checkErrorPacket(MysqlIO.java:${Math.floor(Math.random() * 200) + 3000})
    at com.example.dao.UserDao.findById(UserDao.java:${Math.floor(Math.random() * 100) + 40})
    at com.example.service.UserService.getUserById(UserService.java:${Math.floor(Math.random() * 200) + 50})
    at com.example.controller.UserController.getUser(UserController.java:${Math.floor(Math.random() * 100) + 20})`
    },
    {
      type: 'java.lang.IllegalArgumentException',
      message: 'Invalid user ID: must be positive',
      stackTrace: `java.lang.IllegalArgumentException: Invalid user ID: must be positive
    at com.example.service.UserService.validateUserId(UserService.java:${Math.floor(Math.random() * 50) + 10})
    at com.example.service.UserService.getUserById(UserService.java:${Math.floor(Math.random() * 200) + 50})
    at com.example.controller.UserController.getUser(UserController.java:${Math.floor(Math.random() * 100) + 20})
    at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)`
    }
  ];
  return exceptions[Math.floor(Math.random() * exceptions.length)];
}

// 格式化时间
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN');
}

// 格式化 JSON
function formatJson(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

// 获取耗时标签类型
function getDurationTagType(duration: number): 'success' | 'warning' | 'error' {
  if (duration > 500) return 'error';
  if (duration > 200) return 'warning';
  return 'success';
}

// 加载示例
function loadSample() {
  watchConfig.methods = `com.example.service.UserService.getUserById
com.example.service.UserService.createUser
com.example.service.UserService.updateUser
com.example.service.UserService.deleteUser
com.example.service.OrderService.createOrder
com.example.service.OrderService.getOrderById
com.example.controller.ApiController.handleRequest`;
  watchConfig.count = 30;
  watchConfig.minTime = 50;
  watchConfig.maxTime = 800;
  message.success('已加载示例配置');
}

// 重置表单
function resetForm() {
  watchConfig.methods = '';
  watchConfig.count = 50;
  watchConfig.minTime = null;
  watchConfig.maxTime = null;
  message.success('已重置表单');
}

// 导出结果
function exportResults() {
  if (watchResults.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  message.success('导出功能开发中');
}

// 清空结果
function clearResults() {
  watchResults.value = [];
  watchProgress.captured = 0;
  watchProgress.total = 0;
  watchProgress.percent = 0;
  message.success('已清空结果');
}
</script>

<template>
  <div class="flex flex-col gap-16px">
    <!-- Watch 配置表单 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center gap-8px">
          <SvgIcon icon="lucide:eye" class="text-18px" />
          <span class="font-semibold">方法观察配置</span>
        </div>
      </template>

      <NForm ref="watchFormRef" :model="watchConfig" label-placement="top">
        <NGrid :cols="24" :x-gap="16" :y-gap="16">
          <!-- 方法列表 -->
          <NGridItem :span="24">
            <NFormItem path="methods">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:package" class="text-14px" />
                  <span>方法列表</span>
                  <span class="text-12px text-gray-400">(支持多行,每行一个完整方法名)</span>
                </div>
              </template>
              <NInput
                v-model:value="watchConfig.methods"
                type="textarea"
                :rows="5"
                placeholder="例如:&#10;com.example.service.UserService.getUserById&#10;com.example.service.UserService.createUser&#10;com.example.service.OrderService.createOrder&#10;com.example.controller.ApiController.handleRequest"
                class="font-mono"
              />
            </NFormItem>
          </NGridItem>

          <!-- 观察次数 -->
          <NGridItem :span="8">
            <NFormItem label="观察次数" path="count">
              <NInputNumber
                v-model:value="watchConfig.count"
                :min="1"
                :max="10000"
                placeholder="例如: 50"
                class="w-full"
              >
                <template #suffix>
                  <span class="text-12px text-gray-400">次</span>
                </template>
              </NInputNumber>
            </NFormItem>
          </NGridItem>

          <!-- 最低耗时过滤 -->
          <NGridItem :span="8">
            <NFormItem path="minTime">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:timer" class="text-14px" />
                  <span>最低耗时 (ms)</span>
                </div>
              </template>
              <NInputNumber v-model:value="watchConfig.minTime" :min="0" placeholder="例如: 50" class="w-full">
                <template #suffix>
                  <span class="text-12px text-gray-400">ms</span>
                </template>
              </NInputNumber>
            </NFormItem>
          </NGridItem>

          <!-- 最高耗时过滤 -->
          <NGridItem :span="8">
            <NFormItem path="maxTime">
              <template #label>
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:timer" class="text-14px" />
                  <span>最高耗时 (ms)</span>
                </div>
              </template>
              <NInputNumber v-model:value="watchConfig.maxTime" :min="0" placeholder="例如: 1000" class="w-full">
                <template #suffix>
                  <span class="text-12px text-gray-400">ms</span>
                </template>
              </NInputNumber>
            </NFormItem>
          </NGridItem>

          <!-- 操作按钮 -->
          <NGridItem :span="24">
            <div class="flex-y-center gap-12px">
              <NButton v-if="!isWatching" type="primary" @click="startWatch">
                <template #icon>
                  <SvgIcon icon="lucide:play" />
                </template>
                开始观察
              </NButton>
              <NButton v-if="isWatching" type="error" @click="stopWatch">
                <template #icon>
                  <SvgIcon icon="lucide:square" />
                </template>
                停止观察
              </NButton>
              <NButton @click="loadSample">
                <template #icon>
                  <SvgIcon icon="lucide:file-text" />
                </template>
                加载示例
              </NButton>
              <NButton @click="resetForm">
                <template #icon>
                  <SvgIcon icon="lucide:refresh-cw" />
                </template>
                重置表单
              </NButton>
            </div>
          </NGridItem>
        </NGrid>
      </NForm>
    </NCard>

    <!-- 观察状态 -->
    <NCard v-show="isWatching" size="small">
      <div class="mb-12px flex-y-center justify-between">
        <div class="flex-y-center gap-16px">
          <div class="flex-y-center gap-8px">
            <div class="h-8px w-8px animate-pulse rounded-full bg-primary"></div>
            <span class="text-14px">观察中...</span>
          </div>
          <div class="text-14px text-gray">
            已捕获:
            <span class="text-primary font-semibold">{{ watchProgress.captured }}</span>
            /
            <span>{{ watchProgress.total }}</span>
          </div>
        </div>
        <div class="flex-y-center gap-8px text-12px text-gray">
          <SvgIcon icon="lucide:clock" class="text-12px" />
          <span>{{ elapsedTime }}</span>
        </div>
      </div>
      <NProgress type="line" :percentage="watchProgress.percent" status="success" :show-indicator="false" />
    </NCard>

    <!-- 观察结果 -->
    <NCard size="small">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <SvgIcon icon="lucide:list" class="text-16px" />
            <span class="font-semibold">观察结果</span>
            <span v-if="resultInfo" class="text-12px text-gray">{{ resultInfo }}</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NButton size="small" @click="exportResults">
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

      <div v-if="watchResults.length === 0" class="py-48px text-center text-gray">
        <div class="mb-12px flex justify-center">
          <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
        </div>
        <div class="text-14px">暂无观察结果</div>
        <div class="mt-4px text-12px text-gray">填写配置并点击"开始观察"</div>
      </div>

      <div v-else class="flex flex-col gap-12px">
        <div
          v-for="result in watchResults"
          :key="result.id"
          class="overflow-hidden border border-container rounded-8px bg-container"
        >
          <!-- 标题栏 -->
          <div class="flex-y-center justify-between border-b border-container p-16px">
            <div class="flex-y-center gap-12px">
              <NTag size="small" :bordered="false">
                <span class="font-mono">#{{ result.id }}</span>
              </NTag>
              <div class="text-14px font-mono">
                <span class="text-primary">{{ result.className }}</span>
                <span class="text-gray">.</span>
                <span class="text-success">{{ result.methodName }}</span>
                <span class="text-gray">()</span>
              </div>
            </div>
            <div class="flex-y-center gap-16px text-12px">
              <div class="flex-y-center gap-6px">
                <SvgIcon icon="lucide:clock" class="text-12px text-gray" />
                <span class="text-gray">{{ formatTime(result.timestamp) }}</span>
              </div>
              <div class="flex-y-center gap-6px">
                <SvgIcon icon="lucide:zap" class="text-12px" />
                <NTag :type="getDurationTagType(result.duration)" size="small" :bordered="false">
                  {{ result.duration }}ms
                </NTag>
              </div>
              <div
                class="flex-y-center cursor-pointer text-gray transition hover:text-primary"
                @click="result.expanded = !result.expanded"
              >
                <SvgIcon :icon="result.expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="text-16px" />
              </div>
            </div>
          </div>

          <!-- 详细内容 -->
          <div v-show="result.expanded" class="flex flex-col gap-16px p-16px">
            <!-- 入参 -->
            <div>
              <div class="mb-8px flex-y-center gap-6px text-12px text-gray font-semibold">
                <SvgIcon icon="lucide:arrow-right" class="text-12px" />
                入参 (Parameters)
              </div>
              <div class="border border-container rounded-8px bg-layout p-12px">
                <pre class="text-12px font-mono">{{ formatJson(result.params) }}</pre>
              </div>
            </div>

            <!-- Target 对象 -->
            <div>
              <div class="mb-8px flex-y-center gap-6px text-12px text-gray font-semibold">
                <SvgIcon icon="lucide:target" class="text-12px" />
                Target 对象
              </div>
              <div class="border border-container rounded-8px bg-layout p-12px">
                <pre class="text-12px font-mono">{{ formatJson(result.target) }}</pre>
              </div>
            </div>

            <!-- 异常信息 -->
            <div v-if="result.exception">
              <div class="mb-8px flex-y-center gap-6px text-12px text-error font-semibold">
                <SvgIcon icon="lucide:alert-circle" class="text-12px" />
                异常 (Exception)
              </div>
              <div class="border border-error rounded-8px bg-error/10 p-12px">
                <div class="mb-8px text-12px text-error font-semibold">{{ result.exception.type }}</div>
                <div class="mb-12px text-12px text-error/80">{{ result.exception.message }}</div>
                <div class="mb-4px text-12px text-gray font-semibold">堆栈信息:</div>
                <pre class="max-h-200px overflow-y-auto text-12px text-gray font-mono">{{
                  result.exception.stackTrace
                }}</pre>
              </div>
            </div>

            <!-- 返回值 -->
            <div v-else>
              <div class="mb-8px flex-y-center gap-6px text-12px text-gray font-semibold">
                <SvgIcon icon="lucide:arrow-left" class="text-12px" />
                返回值 (Return Value)
              </div>
              <div class="border border-container rounded-8px bg-layout p-12px">
                <pre class="text-12px font-mono">{{ formatJson(result.returnValue) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
