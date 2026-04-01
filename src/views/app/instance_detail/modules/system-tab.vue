<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { fetchSystemInfoCommand, fetchSystemMetricsCommand } from '@/service/api/instance';
import eventBus from '@/utils/eventbus';
import { div, mul, sub } from '@/utils/math';
import { formatMemory } from '@/utils/common';
import { formatTimeDifference } from '@/utils/time';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';
import type { SystemInfoResponse } from '@/proto/command/result/SystemInfoResponse';
import type { SystemMetricsResponse } from '@/proto/command/result/SystemMetricsResponse';
import type { CpuMetrics } from '@/proto/command/domain/CpuMetrics';
import type { TDescriptionItemProps } from '@/components/advanced/t-descriptions.vue';
import type { HostInfo } from '@/proto/command/domain/HostInfo';
import type { MemoryMetrics } from '@/proto/command/domain/MemoryMetrics';
import type { OsFileStore } from '@/proto/command/domain/OsFileStore';
import type { NetworkMetrics } from '@/proto/command/domain/NetworkMetrics';
import type { JvmInfo } from '@/proto/command/domain/JvmInfo';

interface Props {
  instanceId: string;
}

type CpuMetricsType = Omit<
  CpuMetrics,
  'oneMinuteLoadAverage' | 'fiveMinuteLoadAverage' | 'fifteenMinuteLoadAverage'
> & {
  oneMinuteLoadAverage: string;
  fiveMinuteLoadAverage: string;
  fifteenMinuteLoadAverage: string;
  idle: number;
};

type Disk = OsFileStore & {
  usedSpace: number;
  useRatio: number;
};

const props = defineProps<Props>();

const hostInfo: Ref<HostInfo | undefined> = ref(undefined);

const hostInfoDescriptions: Ref<Array<TDescriptionItemProps<HostInfo>>> = ref([
  { label: '主机名', value: val => val.hostName },
  { label: '操作系统', value: val => val.osName },
  { label: '系统版本', value: val => val.systemVersion },
  { label: '系统架构', value: val => val.arch },
  { label: 'CPU核心数', value: val => val.availableProcessors },
  { label: 'CPU型号', value: val => val.cpuModel },
  { label: '物理内存', value: val => formatMemory(val.memorySize) },
  { label: '系统启动时间', value: val => val.systemBootTime }
]);

const cpuMetrics: Ref<CpuMetricsType> = ref({
  cpuLoad: 0,
  processCpuLoad: 0,
  oneMinuteLoadAverage: '-',
  fiveMinuteLoadAverage: '-',
  fifteenMinuteLoadAverage: '-',
  idle: 0
});

const cpuMetricsDescriptions: Ref<Array<TDescriptionItemProps<CpuMetricsType>>> = ref([
  { label: '1分钟负载', value: val => val.oneMinuteLoadAverage },
  { label: '5分钟负载', value: val => val.fiveMinuteLoadAverage },
  { label: '15分钟负载', value: val => val.fifteenMinuteLoadAverage },
  { label: '空闲率', value: val => val.idle }
]);

const memoryMetricsDescriptions: Ref<Array<TDescriptionItemProps<MemoryMetrics>>> = ref([
  {
    label: '可用内存',
    value: val => formatMemory(val.freePhysicalMemorySize)
  },
  { label: '已提交', value: val => formatMemory(val.committedVirtualMemory) }
]);

const memoryMetrics: Ref<MemoryMetrics | undefined> = ref();

const disks: Ref<Disk[]> = ref([]);

const networkMetrics: Ref<NetworkMetrics | undefined> = ref();

const networkMetricsDescriptions: Array<TDescriptionItemProps<NetworkMetrics>> = [
  { label: '总接收', value: val => formatMemory(val.bytesRecv) },
  { label: '总发送', value: val => formatMemory(val.bytesSent) },
  { label: '接收包数', value: val => formatMemory(val.packetsRecv) },
  { label: '发送包数', value: val => formatMemory(val.packetsSent) }
];

// JVM信息
const jvmInfo: Ref<JvmInfo | undefined> = ref();

const jvmInfoDescriptions: Array<TDescriptionItemProps<JvmInfo>> = [
  { label: '虚拟机名称', value: val => val.vmName },
  { label: 'JVM版本号', value: val => val.javaRuntimeVersion },
  { label: 'JVM供应商', value: val => val.vmVendor },
  { label: 'Java版本', value: val => val.jdkVersion },
  { label: 'Java Home', value: val => val.javaHome },
  { label: '启动路径', value: val => val.starter },
  {
    label: '启动时间',
    value: val => dayjs(val.startTime).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    label: '运行时长',
    value: val => formatTimeDifference(dayjs(val.startTime), dayjs())
  },
  { label: '进程ID', value: val => val.pid }
];

// 环境变量
interface EnvVar {
  name: string;
  value: string;
}

const envVars = ref<EnvVar[]>([]);

const envSearch = ref('');

const filteredEnvVars = computed(() => {
  if (!envSearch.value) return envVars.value;
  const s = envSearch.value.toLowerCase();
  return envVars.value.filter((e: EnvVar) => e.name.toLowerCase().includes(s) || e.value.toLowerCase().includes(s));
});

function getDiskColor(percent: number) {
  if (percent > 80) return 'text-error';
  if (percent > 60) return 'text-warning';
  return 'text-success';
}

function getDiskProgressColor(percent: number) {
  if (percent > 80) return 'from-error to-error/80';
  if (percent > 60) return 'from-warning to-warning/80';
  return 'from-success to-success/80';
}

function copyJvmArgs() {
  const args = jvmInfo.value?.inputArguments;
  if (args && args.length > 0) {
    navigator.clipboard.writeText(args.join('\n'));
    window.$message?.success('已复制到剪贴板');
  } else {
    window.$message?.warning('暂无JVM参数数据');
  }
}

function createSystemInfoCommand() {
  const params = {
    instanceId: props.instanceId,
    param: {}
  };
  fetchSystemInfoCommand(params);
}

function createSystemMetricsMonitoringCommand() {
  const params = {
    instanceId: props.instanceId,
    param: {}
  };
  fetchSystemMetricsCommand(params);
}

function handleCpuMetrics(systemCpuMetrics: undefined | CpuMetrics) {
  if (!systemCpuMetrics) {
    return;
  }
  cpuMetrics.value.cpuLoad = mul(systemCpuMetrics.cpuLoad, 100);
  cpuMetrics.value.processCpuLoad = mul(systemCpuMetrics.processCpuLoad, 100);
  if (systemCpuMetrics.oneMinuteLoadAverage && systemCpuMetrics.oneMinuteLoadAverage >= 0) {
    cpuMetrics.value.oneMinuteLoadAverage = mul(systemCpuMetrics.oneMinuteLoadAverage, 100).toString();
  }
  if (systemCpuMetrics.fiveMinuteLoadAverage && systemCpuMetrics.fiveMinuteLoadAverage >= 0) {
    cpuMetrics.value.fiveMinuteLoadAverage = mul(systemCpuMetrics.fiveMinuteLoadAverage, 100).toString();
  }
  if (systemCpuMetrics.fifteenMinuteLoadAverage && systemCpuMetrics.fifteenMinuteLoadAverage >= 0) {
    cpuMetrics.value.fifteenMinuteLoadAverage = mul(systemCpuMetrics.fifteenMinuteLoadAverage, 100).toString();
  }
  cpuMetrics.value.idle = sub(100, cpuMetrics.value.cpuLoad);
}

onMounted(() => {
  eventBus.on('command:system-info', (data: CommandExecuteResponse<SystemInfoResponse>) => {
    console.log('Received system info : ', data);
    const systemInfo = data.data as SystemInfoResponse;
    hostInfo.value = systemInfo.host;
    jvmInfo.value = systemInfo.jvm;
    if (systemInfo.jvm?.environmentProperties) {
      envVars.value = Object.entries(systemInfo.jvm.environmentProperties).map(([key, value]) => ({
        name: key,
        value: String(value)
      }));
    }
  });
  eventBus.on('command:system-metrics', (data: CommandExecuteResponse<SystemMetricsResponse>) => {
    console.log('Received system metrics : ', data);
    const systemMetrics = data.data as SystemMetricsResponse;
    handleCpuMetrics(systemMetrics.cpuMetrics);
    memoryMetrics.value = systemMetrics.memoryMetrics;
    disks.value = systemMetrics.osFileStores.map(fs => {
      const usedSpace = sub(fs.totalSpace, fs.usableSpace);
      return {
        totalSpace: fs.totalSpace,
        usableSpace: fs.usableSpace,
        usedSpace,
        useRatio: div(mul(usedSpace, 100), fs.totalSpace),
        mount: fs.mount,
        type: fs.type
      };
    });
    networkMetrics.value = systemMetrics.networkMetrics;
  });
  createSystemInfoCommand();
  createSystemMetricsMonitoringCommand();
});
</script>

<template>
  <div class="system-tab">
    <!-- 主机信息 -->
    <NCard size="small" class="id-card mb-4">
      <h4 class="id-card-title-lg">
        <SvgIcon icon="mdi:server" class="h-4 w-4 text-primary" />
        主机信息
      </h4>
      <NSkeleton v-if="!hostInfo" text :repeat="4" round />
      <TDescriptions
        v-else
        :column="4"
        :items="hostInfoDescriptions"
        :val="hostInfo"
        label-class="id-info-label"
        content-class="id-info-value font-mono"
      />
    </NCard>

    <!-- 主机资源 -->
    <div class="grid grid-cols-1 mb-4 gap-4 lg:grid-cols-2">
      <!-- CPU使用情况 -->
      <NCard size="small" class="id-card">
        <h4 class="id-card-title-lg">
          <SvgIcon icon="mdi:cpu-64-bit" class="h-4 w-4 text-primary" />
          CPU 使用情况
        </h4>
        <div class="space-y-4">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="id-resource-label">系统CPU</span>
              <span class="id-resource-value text-primary">{{ cpuMetrics.cpuLoad }}%</span>
            </div>
            <div class="id-progress">
              <div
                class="id-progress-fill from-primary to-primary/80 bg-gradient-to-r"
                :style="{ width: `${cpuMetrics.cpuLoad}%` }"
              />
            </div>
          </div>
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="id-resource-label">进程CPU</span>
              <span class="id-resource-value text-success">{{ cpuMetrics.processCpuLoad }}%</span>
            </div>
            <div class="id-progress">
              <div
                class="id-progress-fill from-success to-success/80 bg-gradient-to-r"
                :style="{ width: `${cpuMetrics.processCpuLoad}%` }"
              />
            </div>
          </div>
          <div class="id-divider" />
          <TDescriptions
            :items="cpuMetricsDescriptions"
            :val="cpuMetrics"
            :columns="2"
            label-class="id-info-label"
            content-class="id-info-value font-mono"
          />
        </div>
      </NCard>

      <!-- 内存使用情况 -->
      <NCard size="small" class="id-card">
        <h4 class="id-card-title-lg">
          <SvgIcon icon="mdi:memory" class="h-4 w-4 text-purple" />
          内存 使用情况
        </h4>
        <div class="space-y-4">
          <div v-if="memoryMetrics">
            <div class="mb-2 flex items-center justify-between">
              <span class="id-resource-label">物理内存（已使用）</span>
              <div class="text-right">
                <span class="id-resource-value text-purple">
                  {{ formatMemory(memoryMetrics.totalPhysicalMemorySize - memoryMetrics.freePhysicalMemorySize) }}
                </span>
                <span class="id-resource-max">/ {{ formatMemory(memoryMetrics.totalPhysicalMemorySize) }}</span>
              </div>
            </div>
            <div class="id-progress">
              <div
                class="id-progress-fill from-purple to-purple/80 bg-gradient-to-r"
                :style="{
                  width: `${100 - mul(memoryMetrics.freePhysicalMemorySize / memoryMetrics.totalPhysicalMemorySize, 100)}%`
                }"
              />
            </div>
          </div>
          <div v-if="memoryMetrics">
            <div class="mb-2 flex items-center justify-between">
              <span class="id-resource-label">Swap内存（已使用）</span>
              <div class="text-right">
                <span class="id-resource-value text-success">
                  {{ formatMemory(memoryMetrics.totalSwapSpaceSize - memoryMetrics.freeSwapSpaceSize) }}
                </span>
                <span class="id-resource-max">/ {{ formatMemory(memoryMetrics.totalSwapSpaceSize) }}</span>
              </div>
            </div>
            <div class="id-progress">
              <div
                class="id-progress-fill from-success to-purple/80 bg-gradient-to-r"
                :style="{
                  width: `${100 - mul(memoryMetrics.freeSwapSpaceSize / memoryMetrics.totalSwapSpaceSize, 100)}%`
                }"
              />
            </div>
          </div>
          <div class="id-divider" />
          <TDescriptions
            :items="memoryMetricsDescriptions"
            :val="memoryMetrics"
            label-class="id-info-label"
            content-class="id-info-value font-mono"
          />
        </div>
      </NCard>

      <!-- 磁盘使用情况 -->
      <NCard size="small" class="id-card">
        <h4 class="id-card-title-lg">
          <SvgIcon icon="mdi:harddisk" class="h-4 w-4 text-orange" />
          磁盘 使用情况
        </h4>
        <div class="space-y-3">
          <div v-for="disk in disks" :key="disk.mount" class="id-disk-item">
            <div class="mb-2 flex items-center justify-between">
              <NSpace justify="center">
                <span class="id-disk-name">{{ disk.mount }}</span>
                <NTag size="small" :bordered="false">{{ disk.type }}</NTag>
              </NSpace>
              <div class="text-right">
                <span class="id-disk-value" :class="getDiskColor(disk.useRatio)">
                  {{ formatMemory(disk.usedSpace) }}
                </span>
                <span class="id-disk-max">/ {{ formatMemory(disk.totalSpace) }}</span>
              </div>
            </div>
            <div class="id-progress id-progress-sm">
              <div
                class="id-progress-fill bg-gradient-to-r"
                :class="getDiskProgressColor(disk.useRatio)"
                :style="{ width: `${disk.useRatio}%` }"
              />
            </div>
            <div class="mt-1.5 flex items-center justify-between text-xs">
              <span class="text-gray">使用率: {{ disk.useRatio }}%</span>
              <span class="text-gray">可用: {{ formatMemory(disk.usableSpace) }}</span>
            </div>
          </div>
        </div>
      </NCard>

      <!-- 网络统计 -->
      <NCard size="small" class="id-card">
        <h4 class="id-card-title-lg">
          <SvgIcon icon="mdi:network" class="h-4 w-4 text-cyan" />
          网络 统计
        </h4>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <SvgIcon icon="mdi:arrow-down" class="h-3 w-3 text-success" />
              <span class="id-resource-label">接收速率</span>
            </div>
            <span class="id-resource-value text-success">{{ formatMemory(networkMetrics?.recvSpeed) }}/s</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <SvgIcon icon="mdi:arrow-up" class="h-3 w-3 text-primary" />
              <span class="id-resource-label">发送速率</span>
            </div>
            <span class="id-resource-value text-primary">{{ formatMemory(networkMetrics?.sendSpeed) }}/s</span>
          </div>
          <div class="id-divider" />
          <TDescriptions
            :items="networkMetricsDescriptions"
            :val="networkMetrics"
            :columns="2"
            label-class="id-label"
            content-class="id-value"
          />
        </div>
      </NCard>
    </div>

    <!-- JVM信息 -->
    <NCard size="small" class="id-card mb-4">
      <h4 class="id-card-title-lg">
        <SvgIcon icon="mdi:language-java" class="h-4 w-4 text-orange" />
        JVM 信息
      </h4>
      <NSkeleton v-if="!jvmInfo" text :repeat="4" round />
      <TDescriptions
        v-else
        :items="jvmInfoDescriptions"
        :val="jvmInfo"
        :columns="3"
        label-class="id-info-label"
        content-class="id-info-value font-mono"
      />
    </NCard>

    <!-- JVM参数 -->
    <NCard size="small" class="id-card mb-4">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="id-card-title-lg mb-0">
          <SvgIcon icon="mdi:console" class="h-4 w-4 text-success" />
          JVM 启动参数
        </h4>
        <NButton size="tiny" @click="copyJvmArgs">
          <template #icon>
            <SvgIcon icon="mdi:content-copy" />
          </template>
          复制
        </NButton>
      </div>
      <NScrollbar style="max-height: 400px">
        <div class="id-jvm-args-container">
          <div v-for="(arg, i) in jvmInfo?.inputArguments" :key="i" class="id-jvm-arg-line">
            <span class="id-jvm-arg-number">{{ i + 1 }}</span>
            <span class="id-jvm-arg-content">{{ arg }}</span>
          </div>
        </div>
      </NScrollbar>
    </NCard>

    <!-- 环境变量 -->
    <NCard size="small" class="id-card">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="id-card-title-lg mb-0">
          <SvgIcon icon="mdi:cog" class="h-4 w-4 text-purple" />
          环境变量
        </h4>
        <NInput v-model:value="envSearch" size="small" placeholder="搜索..." clearable style="width: 200px">
          <template #prefix>
            <SvgIcon icon="mdi:magnify" />
          </template>
        </NInput>
      </div>
      <NScrollbar style="max-height: 400px">
        <NDataTable
          :columns="[
            {
              title: '变量名',
              key: 'name',
              width: 200,
              ellipsis: { tooltip: true }
            },
            { title: '变量值', key: 'value', ellipsis: { tooltip: true } }
          ]"
          :data="filteredEnvVars"
          :bordered="false"
          size="small"
        />
      </NScrollbar>
    </NCard>
  </div>
</template>

<style lang="scss">
.system-tab {
  padding: 0;
}

.space-y-4 > * + * {
  margin-top: 16px;
}

.space-y-3 > * + * {
  margin-top: 12px;
}
</style>
