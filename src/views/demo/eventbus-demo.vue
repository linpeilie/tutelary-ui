<script setup lang="ts">
import { computed, ref } from 'vue';
import { NAlert, NButton, NCard, NDescriptions, NDescriptionsItem, NSpace, NTimeline, NTimelineItem } from 'naive-ui';
import { useEventListener, useWebSocketMessages } from '@/composables/useEventBus';
import eventBus from '@/utils/eventbus';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';

interface EventLog {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
}

// 事件日志
const eventLogs = ref<EventLog[]>([]);

// 连接状态
const isConnected = ref(false);
const hasError = ref(false);

// 添加日志
const addLog = (type: EventLog['type'], title: string, message: string) => {
  eventLogs.value.unshift({
    type,
    title,
    message,
    time: new Date().toLocaleTimeString()
  });

  // 最多保留 50 条
  if (eventLogs.value.length > 50) {
    eventLogs.value.pop();
  }
};

// 监听 WebSocket 连接成功
useEventListener('ws:connected', () => {
  isConnected.value = true;
  hasError.value = false;
  addLog('success', 'WebSocket 连接', '连接成功');
});

// 监听 WebSocket 断开
useEventListener('ws:disconnected', () => {
  isConnected.value = false;
  addLog('warning', 'WebSocket 断开', '连接已断开');
});

// 监听 WebSocket 错误
useEventListener('ws:error', error => {
  hasError.value = true;
  addLog('error', 'WebSocket 错误', error.message);
});

// 监听所有 WebSocket 消息
useWebSocketMessages((response: CommandExecuteResponse<any>) => {
  addLog(
    response.status ? 'info' : 'error',
    `命令响应: ${response.taskId}`,
    `状态: ${response.status ? '成功' : '失败'}, 消息: ${response.message || '无'}`
  );
});

// 监听 JVM 内存命令
useEventListener('command:jvm-memory', response => {
  addLog('success', 'JVM 内存', `收到 JVM 内存信息, taskId: ${response.taskId}`);
});

// 监听线程列表命令
useEventListener('command:thread-list', response => {
  addLog('success', '线程列表', `收到线程列表, taskId: ${response.taskId}`);
});

// 连接状态计算属性
const connectionStatus = computed(() => {
  if (hasError.value) return 'error';
  if (isConnected.value) return 'success';
  return 'warning';
});

const connectionTitle = computed(() => {
  if (hasError.value) return 'WebSocket 异常';
  if (isConnected.value) return 'WebSocket 已连接';
  return 'WebSocket 未连接';
});

const connectionMessage = computed(() => {
  if (hasError.value) return '连接出现错误，请检查网络';
  if (isConnected.value) return '正常通信中';
  return '等待连接...';
});

// 获取已注册的事件
const registeredEvents = computed(() => {
  return eventBus.eventNames();
});

// 获取监听器数量
const getListenerCount = (eventName: string) => {
  return eventBus.listenerCount(eventName as any);
};

// 清空日志
const clearLogs = () => {
  eventLogs.value = [];
};

// 发送测试命令（示例）
const sendTestCommand = () => {
  // 这里演示如何触发事件（实际应该由 WebSocket Store 触发）
  const testResponse: CommandExecuteResponse<any> = {
    taskId: `test-${Date.now()}`,
    code: 200,
    timestamp: Date.now(),
    data: undefined,
    status: true,
    message: '测试命令',
    metadata: undefined
  };

  eventBus.emit('ws:message', testResponse);
  window.$message?.success('已发送测试命令');
};
</script>

<template>
  <div class="h-full p-4">
    <NCard title="EventBus 使用示例" class="h-full">
      <!-- WebSocket 连接状态 -->
      <NSpace vertical>
        <NAlert :type="connectionStatus" :title="connectionTitle">
          {{ connectionMessage }}
        </NAlert>

        <!-- 事件日志 -->
        <NCard title="事件日志" size="small">
          <div class="h-400px overflow-y-auto">
            <NTimeline>
              <NTimelineItem
                v-for="(log, index) in eventLogs"
                :key="index"
                :type="log.type"
                :title="log.title"
                :time="log.time"
              >
                {{ log.message }}
              </NTimelineItem>
            </NTimeline>
          </div>
          <template #footer>
            <NSpace>
              <NButton size="small" @click="clearLogs">清空日志</NButton>
              <NButton size="small" @click="sendTestCommand">发送测试命令</NButton>
            </NSpace>
          </template>
        </NCard>

        <!-- 监听器统计 -->
        <NCard title="监听器统计" size="small">
          <NDescriptions :column="2" size="small">
            <NDescriptionsItem v-for="eventName in registeredEvents" :key="eventName" :label="eventName">
              {{ getListenerCount(eventName) }} 个监听器
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
/* 可以添加自定义样式 */
</style>
