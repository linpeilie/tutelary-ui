<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';

interface StackConfig {
  className: string;
  methodName: string;
  count: number;
  includeArgs: boolean;
  includeReturn: boolean;
  includeException: boolean;
  formatJson: boolean;
}

interface StackResult {
  index: number;
  time: string;
  duration: number;
  hasException: boolean;
  className: string;
  methodName: string;
  args: string;
  returnValue: string | null;
  exception: string | null;
  fullException: string | null;
  stackPreview: string[];
  stackDepth: number;
  fullStack: string;
  threadName: string;
  opacity: number;
}

interface HistoryRecord {
  id: number;
  className: string;
  methodName: string;
  count: number;
  resultCount: number;
  status: 'completed' | 'failed';
  duration: number;
  time: string;
  results: StackResult[];
}

defineOptions({
  name: 'StackTab'
});

interface Props {
  instanceId: string;
}

defineProps<Props>();

const message = useMessage();

const stackFormRef = ref();
const showAdvanced = ref(false);
const isCapturing = ref(false);
const showDetailModal = ref(false);
const showHistoryModal = ref(false);
const selectedStack = ref<StackResult | null>(null);

const stackConfig = reactive<StackConfig>({
  className: '',
  methodName: '',
  count: 5,
  includeArgs: true,
  includeReturn: true,
  includeException: true,
  formatJson: false
});

const captureProgress = reactive({
  captured: 0,
  total: 0,
  percent: 0
});

const stackResults = ref<StackResult[]>([]);
const historyRecords = ref<HistoryRecord[]>([]);
let captureInterval: NodeJS.Timeout | null = null;

const resultInfo = computed(() => {
  if (stackResults.value.length === 0) return '';
  return `捕获: ${stackConfig.className}.${stackConfig.methodName}()`;
});

// 开始捕获
function startCapture() {
  if (!stackConfig.className || !stackConfig.methodName || !stackConfig.count) {
    message.warning('请填写完整的配置信息');
    return;
  }

  isCapturing.value = true;
  stackResults.value = [];
  captureProgress.captured = 0;
  captureProgress.total = stackConfig.count;
  captureProgress.percent = 0;

  const taskStartTime = Date.now();
  const results: StackResult[] = [];

  let captured = 0;
  captureInterval = setInterval(() => {
    captured++;
    captureProgress.captured = captured;
    captureProgress.percent = Math.round((captured / stackConfig.count) * 100);

    // 实时添加结果
    const result = generateStackResult(captured);
    results.push(result);
    stackResults.value.push(result);

    // 淡入动画
    setTimeout(() => {
      result.opacity = 1;
    }, 10);

    if (captured >= stackConfig.count) {
      stopCapture();
      const duration = Date.now() - taskStartTime;

      // 保存历史记录
      historyRecords.value.unshift({
        id: Date.now(),
        className: stackConfig.className,
        methodName: stackConfig.methodName,
        count: stackConfig.count,
        resultCount: captured,
        status: 'completed',
        duration,
        time: new Date().toLocaleString('zh-CN'),
        results
      });

      message.success(`堆栈捕获完成，共捕获 ${captured} 个执行栈快照`);
    }
  }, 300);
}

// 停止捕获
function stopCapture() {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
  isCapturing.value = false;
}

// 生成执行栈结果
function generateStackResult(index: number): StackResult {
  const hasException = Math.random() > 0.8;
  const className = stackConfig.className;
  const methodName = stackConfig.methodName;
  const duration = Math.round(Math.random() * 300 + 50);

  const args = `{userId: ${1000 + index}, amount: ${Math.round(Math.random() * 1000 + 100)}}`;
  const returnValue = hasException ? null : `{orderId: "ORD${Date.now()}", status: "SUCCESS"}`;
  const exception = hasException ? 'InsufficientBalanceException: 余额不足' : null;
  const fullException = hasException
    ? `com.example.exception.InsufficientBalanceException: 账户余额不足，当前余额: 500.00，需要: 850.00
    at com.example.service.AccountService.checkBalance(AccountService.java:${120 + index})
    at ${className}.${methodName}(${className.split('.').pop()}.java:${45 + index})`
    : null;

  const classShortName = className.split('.').pop() || className;
  const stackPreview = [
    `  at ${className}.${methodName}(${classShortName}.java:${45 + index})`,
    `  at com.example.controller.OrderController.create(OrderController.java:${28 + index})`,
    `  at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)`
  ];

  const fullStack = generateFullStack(className, methodName, index, hasException);

  return {
    index,
    time: new Date().toLocaleString('zh-CN'),
    duration,
    hasException,
    className,
    methodName,
    args,
    returnValue,
    exception,
    fullException,
    stackPreview,
    stackDepth: 15,
    fullStack,
    threadName: `http-nio-8080-exec-${index}`,
    opacity: 0
  };
}

// 生成完整执行栈
function generateFullStack(className: string, methodName: string, index: number, hasException: boolean): string {
  const classShortName = className.split('.').pop() || className;
  const exceptionStack = hasException
    ? `com.example.exception.InsufficientBalanceException: 账户余额不足
    at com.example.service.AccountService.checkBalance(AccountService.java:${120 + index})
    at ${className}.${methodName}(${classShortName}.java:${45 + index})
`
    : '';

  return `${exceptionStack}at ${className}.${methodName}(${classShortName}.java:${45 + index})
    at ${className}$$FastClassBySpringCGLIB$$a1b2c3d4.invoke(<generated>)
    at org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218)
    at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.invokeJoinpoint(CglibAopProxy.java:793)
    at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)
    at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:763)
    at org.springframework.transaction.interceptor.TransactionInterceptor$1.proceedWithInvocation(TransactionInterceptor.java:123)
    at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:388)
    at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
    at com.example.controller.OrderController.create(OrderController.java:${28 + index})
    at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.lang.reflect.Method.invoke(Method.java:498)
    at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:205)
    at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:150)
    at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:117)
    at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.invokeHandlerMethod(RequestMappingHandlerAdapter.java:895)
    at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.handleInternal(RequestMappingHandlerAdapter.java:808)
    at org.springframework.web.servlet.mvc.method.AbstractHandlerMethodAdapter.handle(AbstractHandlerMethodAdapter.java:87)
    at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1067)
    at org.springframework.web.servlet.DispatcherServlet.doService(DispatcherServlet.java:963)
    at org.springframework.web.servlet.FrameworkServlet.processRequest(FrameworkServlet.java:1006)
    at org.springframework.web.servlet.FrameworkServlet.doPost(FrameworkServlet.java:909)
    at javax.servlet.http.HttpServlet.service(HttpServlet.java:681)
    at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:883)
    at javax.servlet.http.HttpServlet.service(HttpServlet.java:764)
    at org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:227)
    at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:162)
    at org.apache.tomcat.websocket.server.WsFilter.doFilter(WsFilter.java:53)
    at org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:189)
    at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:162)
    at org.apache.catalina.core.StandardWrapperValve.invoke(StandardWrapperValve.java:197)
    at org.apache.catalina.core.StandardContextValve.invoke(StandardContextValve.java:97)
    at org.apache.catalina.authenticator.AuthenticatorBase.invoke(AuthenticatorBase.java:541)
    at org.apache.catalina.core.StandardHostValve.invoke(StandardHostValve.java:135)
    at org.apache.catalina.valves.ErrorReportValve.invoke(ErrorReportValve.java:92)
    at org.apache.catalina.core.StandardEngineValve.invoke(StandardEngineValve.java:78)
    at org.apache.catalina.connector.CoyoteAdapter.service(CoyoteAdapter.java:377)
    at org.apache.coyote.http11.Http11Processor.service(Http11Processor.java:382)
    at org.apache.coyote.AbstractProcessorLight.process(AbstractProcessorLight.java:65)
    at org.apache.coyote.AbstractProtocol$ConnectionHandler.process(AbstractProtocol.java:893)
    at org.apache.tomcat.util.net.NioEndpoint$SocketProcessor.doRun(NioEndpoint.java:1723)
    at org.apache.tomcat.util.net.SocketProcessorBase.run(SocketProcessorBase.java:49)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
    at org.apache.tomcat.util.threads.TaskThread$WrappingRunnable.run(TaskThread.java:61)
    at java.lang.Thread.run(Thread.java:748)`;
}

// 显示详情
function showDetail(result: StackResult) {
  selectedStack.value = result;
  showDetailModal.value = true;
}

// 显示历史
function showHistory() {
  showHistoryModal.value = true;
}

// 加载历史记录
function loadHistoryRecord(record: HistoryRecord) {
  stackResults.value = record.results.map(r => ({ ...r, opacity: 1 }));
  stackConfig.className = record.className;
  stackConfig.methodName = record.methodName;
  stackConfig.count = record.count;
  showHistoryModal.value = false;
  message.success('已加载历史记录');
}

// 导出结果
function exportResults() {
  if (stackResults.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  message.success('导出功能开发中');
}

// 清空结果
function clearResults() {
  stackResults.value = [];
  message.success('已清空结果');
}

// 加载示例
function loadSample() {
  stackConfig.className = 'com.example.service.OrderService';
  stackConfig.methodName = 'createOrder';
  stackConfig.count = 5;
  message.success('已加载示例配置');
}

// 重置表单
function resetForm() {
  stackConfig.className = '';
  stackConfig.methodName = '';
  stackConfig.count = 5;
  stackConfig.includeArgs = true;
  stackConfig.includeReturn = true;
  stackConfig.includeException = true;
  stackConfig.formatJson = false;
  message.success('已重置表单');
}
</script>

<template>
  <div class="space-y-16px">
    <!-- Stack 配置表单 -->
    <NCard :bordered="false" class="card-wrapper rounded-12px">
      <div class="mb-16px flex-y-center gap-8px">
        <div class="i-lucide:layers text-18px text-purple-500"></div>
        <h4 class="text-14px text-white font-semibold">方法执行栈配置</h4>
      </div>

      <NForm ref="stackFormRef" :model="stackConfig" label-placement="top" require-mark-placement="left">
        <NGrid :cols="24" :x-gap="16" :y-gap="16">
          <!-- 类全限定名 -->
          <NGridItem :span="8">
            <NFormItem label="类全限定名" path="className">
              <NInput
                v-model:value="stackConfig.className"
                placeholder="例如: com.example.service.OrderService"
                class="font-mono"
              />
            </NFormItem>
          </NGridItem>

          <!-- 方法名称 -->
          <NGridItem :span="8">
            <NFormItem label="方法名称" path="methodName">
              <NInput v-model:value="stackConfig.methodName" placeholder="例如: createOrder" class="font-mono" />
            </NFormItem>
          </NGridItem>

          <!-- 捕获次数 -->
          <NGridItem :span="8">
            <NFormItem label="捕获次数" path="count">
              <NInputNumber
                v-model:value="stackConfig.count"
                :min="1"
                :max="100"
                placeholder="例如: 5"
                class="w-full"
              />
              <template #feedback>
                <span class="text-12px text-gray-500">捕获执行栈的次数（1-100）</span>
              </template>
            </NFormItem>
          </NGridItem>

          <!-- 高级选项 -->
          <NGridItem :span="24">
            <div class="border-t border-gray-700 pt-16px">
              <div
                class="mb-12px flex-y-center cursor-pointer gap-8px text-12px text-gray-400 hover:text-purple-400"
                @click="showAdvanced = !showAdvanced"
              >
                <div :class="showAdvanced ? 'i-lucide:chevron-up' : 'i-lucide:chevron-down'" class="text-12px"></div>
                高级选项
              </div>
              <div v-show="showAdvanced">
                <NGrid :cols="24" :x-gap="16">
                  <NGridItem :span="6">
                    <NCheckbox v-model:checked="stackConfig.includeArgs">包含参数值</NCheckbox>
                  </NGridItem>
                  <NGridItem :span="6">
                    <NCheckbox v-model:checked="stackConfig.includeReturn">包含返回值</NCheckbox>
                  </NGridItem>
                  <NGridItem :span="6">
                    <NCheckbox v-model:checked="stackConfig.includeException">包含异常信息</NCheckbox>
                  </NGridItem>
                  <NGridItem :span="6">
                    <NCheckbox v-model:checked="stackConfig.formatJson">JSON格式化</NCheckbox>
                  </NGridItem>
                </NGrid>
              </div>
            </div>
          </NGridItem>

          <!-- 操作按钮 -->
          <NGridItem :span="24">
            <div class="flex-y-center gap-12px pt-8px">
              <NButton type="primary" @click="startCapture">
                <template #icon>
                  <div class="i-lucide:play"></div>
                </template>
                开始捕获
              </NButton>
              <NButton @click="loadSample">
                <template #icon>
                  <div class="i-lucide:file-code"></div>
                </template>
                加载示例
              </NButton>
              <NButton v-if="isCapturing" type="error" @click="stopCapture">
                <template #icon>
                  <div class="i-lucide:square"></div>
                </template>
                停止捕获
              </NButton>
              <NButton @click="resetForm">
                <template #icon>
                  <div class="i-lucide:rotate-ccw"></div>
                </template>
                重置
              </NButton>
            </div>
          </NGridItem>
        </NGrid>
      </NForm>
    </NCard>

    <!-- 捕获状态 -->
    <NCard v-show="isCapturing" :bordered="false" class="card-wrapper rounded-12px">
      <div class="flex-y-center justify-between">
        <div class="flex-y-center gap-16px">
          <div class="flex-y-center gap-8px">
            <div class="h-8px w-8px animate-pulse rounded-full bg-purple-500"></div>
            <span class="text-14px text-white">捕获中...</span>
          </div>
          <div class="text-12px text-gray-400">
            已捕获:
            <span class="text-white font-semibold">{{ captureProgress.captured }}</span>
            /
            <span class="text-white">{{ captureProgress.total }}</span>
          </div>
        </div>
        <div class="flex-y-center gap-8px">
          <NProgress
            type="line"
            :percentage="captureProgress.percent"
            :show-indicator="false"
            status="success"
            :height="8"
            class="w-256px"
          />
          <span class="w-48px text-12px text-gray-400">{{ captureProgress.percent }}%</span>
        </div>
      </div>
    </NCard>

    <!-- 执行栈结果 -->
    <NCard :bordered="false" class="overflow-hidden card-wrapper rounded-12px">
      <template #header>
        <div class="flex-y-center justify-between">
          <div class="flex-y-center gap-8px">
            <div class="i-lucide:file-stack text-16px text-purple-500"></div>
            <h4 class="text-14px text-white font-semibold">方法执行栈列表</h4>
            <span v-if="resultInfo" class="text-12px text-gray-400">{{ resultInfo }}</span>
          </div>
          <div class="flex-y-center gap-8px">
            <NButton size="small" @click="showHistory">
              <template #icon>
                <div class="i-lucide:history"></div>
              </template>
              历史
            </NButton>
            <NButton size="small" @click="exportResults">
              <template #icon>
                <div class="i-lucide:download"></div>
              </template>
              导出
            </NButton>
            <NButton size="small" @click="clearResults">
              <template #icon>
                <div class="i-lucide:trash-2"></div>
              </template>
              清空
            </NButton>
          </div>
        </div>
      </template>

      <div v-if="stackResults.length === 0" class="p-48px text-center">
        <div class="mb-16px flex justify-center">
          <div class="rounded-full bg-gray-800/50 p-16px">
            <div class="i-lucide:layers text-48px text-gray-600"></div>
          </div>
        </div>
        <h5 class="mb-8px text-14px text-gray-400 font-semibold">暂无执行栈数据</h5>
        <p class="text-12px text-gray-500">请配置捕获参数并点击"开始捕获"按钮</p>
      </div>

      <div v-else class="space-y-16px">
        <div
          v-for="result in stackResults"
          :key="result.index"
          class="overflow-hidden border card-wrapper rounded-8px transition-all duration-300"
          :class="[result.hasException ? 'border-red-500/30' : 'border-gray-700']"
          :style="{ opacity: result.opacity }"
        >
          <!-- 执行栈头部 -->
          <div class="border-b border-gray-700 bg-gray-800/30 p-16px">
            <div class="flex-y-center justify-between">
              <div class="flex-y-center gap-12px">
                <div class="rounded bg-purple-500/10 px-8px py-4px text-12px text-purple-400 font-semibold">
                  #{{ result.index }}
                </div>
                <div class="text-12px text-gray-400 font-mono">{{ result.time }}</div>
                <NTag
                  :type="result.hasException ? 'error' : 'success'"
                  size="small"
                  :bordered="false"
                  class="text-12px"
                >
                  {{ result.hasException ? '异常' : '成功' }}
                </NTag>
                <div class="text-12px text-gray-400">
                  耗时:
                  <span class="text-white font-mono">{{ result.duration }}ms</span>
                </div>
              </div>
              <NButton size="small" type="primary" @click="showDetail(result)">
                <template #icon>
                  <div class="i-lucide:maximize-2"></div>
                </template>
                展开详情
              </NButton>
            </div>
          </div>

          <!-- 执行栈预览 -->
          <div class="bg-gray-900/30 p-16px">
            <div class="text-12px font-mono space-y-8px">
              <div class="flex-y-center gap-8px">
                <span class="flex-shrink-0 text-blue-400">调用:</span>
                <span class="text-white">{{ result.className }}.{{ result.methodName }}()</span>
              </div>
              <div class="flex-y-center gap-8px">
                <span class="flex-shrink-0 text-green-400">参数:</span>
                <span class="text-gray-300">{{ result.args }}</span>
              </div>
              <div v-if="result.returnValue" class="flex-y-center gap-8px">
                <span class="flex-shrink-0 text-purple-400">返回:</span>
                <span class="text-gray-300">{{ result.returnValue }}</span>
              </div>
              <div v-if="result.exception" class="flex-y-center gap-8px">
                <span class="flex-shrink-0 text-red-400">异常:</span>
                <span class="text-red-300">{{ result.exception }}</span>
              </div>
              <div class="border-t border-gray-700 pt-8px">
                <div class="mb-4px text-gray-500">执行栈 (前3层):</div>
                <div class="text-gray-400 space-y-2px">
                  <div v-for="(line, idx) in result.stackPreview" :key="idx">{{ line }}</div>
                  <div class="text-gray-600">... {{ result.stackDepth }} more</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 执行栈详情模态框 -->
    <NModal v-model:show="showDetailModal" preset="card" title="执行栈详情" class="w-1200px">
      <template #header-extra>
        <div class="i-lucide:code-2 text-20px text-purple-500"></div>
      </template>

      <div v-if="selectedStack" class="space-y-16px">
        <!-- 执行信息 -->
        <NCard :bordered="false" title="执行信息" class="bg-gray-800/30">
          <NGrid :cols="2" :x-gap="12" :y-gap="12">
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">序号:</span>
                <span class="text-white">#{{ selectedStack.index }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">状态:</span>
                <NTag
                  :type="selectedStack.hasException ? 'error' : 'success'"
                  size="small"
                  :bordered="false"
                  class="ml-8px"
                >
                  {{ selectedStack.hasException ? '异常' : '成功' }}
                </NTag>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">类名:</span>
                <span class="ml-8px text-12px text-white font-mono">{{ selectedStack.className }}</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">方法:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.methodName }}()</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">耗时:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.duration }}ms</span>
              </div>
            </NGridItem>
            <NGridItem>
              <div class="text-12px">
                <span class="text-gray-400">线程:</span>
                <span class="ml-8px text-white font-mono">{{ selectedStack.threadName }}</span>
              </div>
            </NGridItem>
          </NGrid>
        </NCard>

        <!-- 参数 -->
        <NCard :bordered="false" title="方法参数" class="bg-gray-800/30">
          <div class="rounded bg-gray-900/50 p-12px">
            <pre class="text-12px text-green-400 font-mono">{{ selectedStack.args }}</pre>
          </div>
        </NCard>

        <!-- 返回值 -->
        <NCard v-if="selectedStack.returnValue" :bordered="false" title="返回值" class="bg-gray-800/30">
          <div class="rounded bg-gray-900/50 p-12px">
            <pre class="text-12px text-purple-400 font-mono">{{ selectedStack.returnValue }}</pre>
          </div>
        </NCard>

        <!-- 异常信息 -->
        <NCard
          v-if="selectedStack.exception"
          :bordered="false"
          title="异常信息"
          class="border border-red-500/20 bg-red-500/10"
        >
          <template #header-extra>
            <div class="i-lucide:alert-circle text-16px text-red-400"></div>
          </template>
          <div class="rounded bg-gray-900/50 p-12px">
            <pre class="text-12px text-red-300 font-mono">{{ selectedStack.fullException }}</pre>
          </div>
        </NCard>

        <!-- 完整执行栈 -->
        <NCard :bordered="false" title="完整执行栈" class="bg-gray-800/30">
          <div class="max-h-400px overflow-y-auto rounded bg-gray-900/50 p-12px">
            <pre class="text-12px text-gray-300 leading-relaxed font-mono">{{ selectedStack.fullStack }}</pre>
          </div>
        </NCard>
      </div>
    </NModal>

    <!-- 历史记录模态框 -->
    <NModal v-model:show="showHistoryModal" preset="card" title="捕获历史" class="w-1000px">
      <template #header-extra>
        <div class="i-lucide:history text-20px text-purple-500"></div>
      </template>

      <div v-if="historyRecords.length === 0" class="p-48px text-center">
        <div class="mb-16px flex justify-center">
          <div class="rounded-full bg-gray-800/50 p-16px">
            <div class="i-lucide:inbox text-48px text-gray-600"></div>
          </div>
        </div>
        <p class="text-14px text-gray-400">暂无历史记录</p>
      </div>

      <div v-else class="space-y-12px">
        <div
          v-for="record in historyRecords"
          :key="record.id"
          class="cursor-pointer border border-gray-700 card-wrapper rounded-8px p-16px transition hover:border-purple-500/50"
          @click="loadHistoryRecord(record)"
        >
          <div class="mb-8px flex-y-center justify-between">
            <div class="flex-y-center gap-12px">
              <div class="text-14px text-white font-semibold font-mono">
                {{ record.className }}.{{ record.methodName }}()
              </div>
              <NTag size="small" :bordered="false" :type="record.status === 'completed' ? 'success' : 'error'">
                {{ record.status === 'completed' ? '已完成' : '失败' }}
              </NTag>
            </div>
            <div class="text-12px text-gray-400">{{ record.time }}</div>
          </div>
          <div class="flex-y-center gap-16px text-12px text-gray-400">
            <span>
              捕获次数:
              <span class="text-white">{{ record.count }}</span>
            </span>
            <span>
              结果数:
              <span class="text-white">{{ record.resultCount }}</span>
            </span>
            <span>
              耗时:
              <span class="text-white">{{ record.duration }}ms</span>
            </span>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.card-wrapper {
  background: var(--n-color);
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
