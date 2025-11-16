<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  instanceId: string;
}

defineProps<Props>();

// 主机信息
const hostInfo = ref({
  hostname: 'prod-server-01',
  os: 'Linux',
  osVersion: '5.15.0-91-generic',
  arch: 'amd64',
  cpuCores: 16,
  cpuModel: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
  memory: '32 GB',
  bootTime: '2025-11-01 08:00:00'
});

// CPU使用情况
const cpuUsage = ref({
  system: 45.2,
  process: 12.8,
  load1: 2.45,
  load5: 2.12,
  load15: 1.98,
  idle: 54.8
});

// 内存使用情况
const memUsage = ref({
  used: 18.5,
  total: 32,
  available: 13.5,
  committed: 20.2,
  cache: 5.2,
  buffer: 2.8
});

// 磁盘列表
const disks = ref([
  { name: '/', total: 500, used: 320, percent: 64 },
  { name: '/data', total: 2000, used: 1450, percent: 72.5 },
  { name: '/logs', total: 1000, used: 680, percent: 68 }
]);

// 网络统计
const network = ref({
  rxSpeed: 12.5,
  txSpeed: 8.3,
  totalRx: '1.2 TB',
  totalTx: '856 GB',
  rxPackets: '8.5M',
  txPackets: '7.2M'
});

// JVM信息
const jvmInfo = ref({
  name: 'OpenJDK 64-Bit Server VM',
  version: '11.0.16+8-LTS',
  vendor: 'Oracle Corporation',
  javaVersion: '11.0.16',
  javaHome: '/usr/lib/jvm/java-11-openjdk-amd64',
  classPath: '/app/application.jar',
  startTime: '2025-11-10 10:30:00',
  uptime: '48小时 23分 15秒',
  pid: '12345'
});

// JVM参数
const jvmArgs = ref([
  '-Xms4096m',
  '-Xmx4096m',
  '-XX:MetaspaceSize=256m',
  '-XX:MaxMetaspaceSize=512m',
  '-XX:+UseG1GC',
  '-XX:MaxGCPauseMillis=200',
  '-XX:ParallelGCThreads=8',
  '-XX:ConcGCThreads=2',
  '-XX:InitiatingHeapOccupancyPercent=45',
  '-XX:+HeapDumpOnOutOfMemoryError',
  '-XX:HeapDumpPath=/logs/heapdump.hprof',
  '-XX:+PrintGCDetails',
  '-XX:+PrintGCDateStamps',
  '-Xloggc:/logs/gc.log',
  '-Dspring.profiles.active=prod',
  '-Dserver.port=8080'
]);

// 环境变量
interface EnvVar {
  name: string;
  value: string;
}

const envVars = ref<EnvVar[]>([
  { name: 'JAVA_HOME', value: '/usr/lib/jvm/java-11-openjdk-amd64' },
  { name: 'PATH', value: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' },
  { name: 'SPRING_PROFILES_ACTIVE', value: 'prod' },
  { name: 'SERVER_PORT', value: '8080' },
  { name: 'DATABASE_URL', value: 'jdbc:mysql://mysql-server:3306/mydb' },
  { name: 'REDIS_HOST', value: 'redis-server' },
  { name: 'LOG_LEVEL', value: 'INFO' },
  { name: 'TZ', value: 'Asia/Shanghai' }
]);

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
  navigator.clipboard.writeText(jvmArgs.value.join('\n'));
  window.$message?.success('已复制到剪贴板');
}
</script>

<template>
  <div class="system-tab">
    <!-- 主机信息 -->
    <NCard size="small" class="card mb-4">
      <h4 class="card-title">
        <SvgIcon icon="mdi:server" class="h-4 w-4 text-primary" />
        主机信息
      </h4>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 md:grid-cols-2">
        <div class="info-box">
          <div class="info-label">主机名</div>
          <div class="info-value font-mono">{{ hostInfo.hostname }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">操作系统</div>
          <div class="info-value">{{ hostInfo.os }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">系统版本</div>
          <div class="info-value font-mono">{{ hostInfo.osVersion }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">系统架构</div>
          <div class="info-value">{{ hostInfo.arch }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">CPU核心数</div>
          <div class="info-value">{{ hostInfo.cpuCores }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">CPU型号</div>
          <div class="info-value truncate" :title="hostInfo.cpuModel">Intel Xeon E5-2680 v4</div>
        </div>
        <div class="info-box">
          <div class="info-label">物理内存</div>
          <div class="info-value">{{ hostInfo.memory }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">系统启动时间</div>
          <div class="info-value">{{ hostInfo.bootTime }}</div>
        </div>
      </div>
    </NCard>

    <!-- 主机资源 -->
    <div class="grid grid-cols-1 mb-4 gap-4 lg:grid-cols-2">
      <!-- CPU使用情况 -->
      <NCard size="small" class="card">
        <h4 class="card-title">
          <SvgIcon icon="mdi:cpu-64-bit" class="h-4 w-4 text-primary" />
          CPU 使用情况
        </h4>
        <div class="space-y-4">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="resource-label">系统CPU</span>
              <span class="resource-value text-primary">{{ cpuUsage.system }}%</span>
            </div>
            <div class="resource-progress">
              <div
                class="resource-progress-fill from-primary to-primary/80 bg-gradient-to-r"
                :style="{ width: `${cpuUsage.system}%` }"
              />
            </div>
          </div>
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="resource-label">进程CPU</span>
              <span class="resource-value text-success">{{ cpuUsage.process }}%</span>
            </div>
            <div class="resource-progress">
              <div
                class="resource-progress-fill from-success to-success/80 bg-gradient-to-r"
                :style="{ width: `${cpuUsage.process}%` }"
              />
            </div>
          </div>
          <div class="divider-line" />
          <div class="grid grid-cols-2 gap-3">
            <div class="stat-item">
              <div class="stat-label">1分钟负载</div>
              <div class="stat-value">{{ cpuUsage.load1 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">5分钟负载</div>
              <div class="stat-value">{{ cpuUsage.load5 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">15分钟负载</div>
              <div class="stat-value">{{ cpuUsage.load15 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">空闲率</div>
              <div class="stat-value text-success">{{ cpuUsage.idle }}%</div>
            </div>
          </div>
        </div>
      </NCard>

      <!-- 内存使用情况 -->
      <NCard size="small" class="card">
        <h4 class="card-title">
          <SvgIcon icon="mdi:memory" class="h-4 w-4 text-purple" />
          内存 使用情况
        </h4>
        <div class="space-y-4">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="resource-label">已使用</span>
              <div class="text-right">
                <span class="resource-value text-purple">{{ memUsage.used }} GB</span>
                <span class="resource-max">/ {{ memUsage.total }} GB</span>
              </div>
            </div>
            <div class="resource-progress">
              <div
                class="resource-progress-fill from-purple to-purple/80 bg-gradient-to-r"
                :style="{ width: `${((memUsage.used / memUsage.total) * 100).toFixed(1)}%` }"
              />
            </div>
          </div>
          <div class="divider-line" />
          <div class="grid grid-cols-2 gap-3">
            <div class="stat-item">
              <div class="stat-label">可用内存</div>
              <div class="stat-value">{{ memUsage.available }} GB</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">已提交</div>
              <div class="stat-value">{{ memUsage.committed }} GB</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">缓存</div>
              <div class="stat-value text-info">{{ memUsage.cache }} GB</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">缓冲</div>
              <div class="stat-value text-success">{{ memUsage.buffer }} GB</div>
            </div>
          </div>
        </div>
      </NCard>

      <!-- 磁盘使用情况 -->
      <NCard size="small" class="card">
        <h4 class="card-title">
          <SvgIcon icon="mdi:harddisk" class="h-4 w-4 text-orange" />
          磁盘 使用情况
        </h4>
        <div class="space-y-3">
          <div v-for="disk in disks" :key="disk.name" class="disk-item">
            <div class="mb-2 flex items-center justify-between">
              <span class="disk-name">{{ disk.name }}</span>
              <div class="text-right">
                <span class="disk-value" :class="getDiskColor(disk.percent)">{{ disk.used }} GB</span>
                <span class="disk-max">/ {{ disk.total }} GB</span>
              </div>
            </div>
            <div class="disk-progress">
              <div
                class="disk-progress-fill bg-gradient-to-r"
                :class="getDiskProgressColor(disk.percent)"
                :style="{ width: `${disk.percent}%` }"
              />
            </div>
            <div class="mt-1.5 flex items-center justify-between text-xs">
              <span class="text-gray">使用率: {{ disk.percent }}%</span>
              <span class="text-gray">可用: {{ disk.total - disk.used }} GB</span>
            </div>
          </div>
        </div>
      </NCard>

      <!-- 网络统计 -->
      <NCard size="small" class="card">
        <h4 class="card-title">
          <SvgIcon icon="mdi:network" class="h-4 w-4 text-cyan" />
          网络 统计
        </h4>
        <div class="space-y-4">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <SvgIcon icon="mdi:arrow-down" class="h-3 w-3 text-success" />
                <span class="resource-label">接收速率</span>
              </div>
              <span class="resource-value text-success">{{ network.rxSpeed }} MB/s</span>
            </div>
            <div class="network-progress">
              <div class="network-progress-fill bg-success" :style="{ width: '62%' }" />
            </div>
          </div>
          <div>
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <SvgIcon icon="mdi:arrow-up" class="h-3 w-3 text-primary" />
                <span class="resource-label">发送速率</span>
              </div>
              <span class="resource-value text-primary">{{ network.txSpeed }} MB/s</span>
            </div>
            <div class="network-progress">
              <div class="network-progress-fill bg-primary" :style="{ width: '41%' }" />
            </div>
          </div>
          <div class="divider-line" />
          <div class="grid grid-cols-2 gap-3">
            <div class="stat-item">
              <div class="stat-label">总接收</div>
              <div class="stat-value">{{ network.totalRx }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">总发送</div>
              <div class="stat-value">{{ network.totalTx }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">接收包数</div>
              <div class="stat-value">{{ network.rxPackets }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">发送包数</div>
              <div class="stat-value">{{ network.txPackets }}</div>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- JVM信息 -->
    <NCard size="small" class="card mb-4">
      <h4 class="card-title">
        <SvgIcon icon="mdi:language-java" class="h-4 w-4 text-orange" />
        JVM 信息
      </h4>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
        <div class="info-box">
          <div class="info-label">JVM 名称</div>
          <div class="info-value">{{ jvmInfo.name }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">JVM 版本</div>
          <div class="info-value font-mono">{{ jvmInfo.version }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">JVM 供应商</div>
          <div class="info-value">{{ jvmInfo.vendor }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Java 版本</div>
          <div class="info-value">{{ jvmInfo.javaVersion }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Java Home</div>
          <div class="info-value truncate text-xs font-mono" :title="jvmInfo.javaHome">
            /usr/lib/jvm/java-11-openjdk
          </div>
        </div>
        <div class="info-box">
          <div class="info-label">类路径</div>
          <div class="info-value truncate text-xs font-mono" :title="jvmInfo.classPath">{{ jvmInfo.classPath }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">启动时间</div>
          <div class="info-value">{{ jvmInfo.startTime }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">运行时长</div>
          <div class="info-value text-success">{{ jvmInfo.uptime }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">进程ID</div>
          <div class="info-value font-mono">{{ jvmInfo.pid }}</div>
        </div>
      </div>
    </NCard>

    <!-- JVM参数 -->
    <NCard size="small" class="card mb-4">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="card-title mb-0">
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
      <NScrollbar style="max-height: 240px">
        <div class="jvm-args">
          <div v-for="(arg, i) in jvmArgs" :key="i" class="jvm-arg">{{ arg }}</div>
        </div>
      </NScrollbar>
    </NCard>

    <!-- 环境变量 -->
    <NCard size="small" class="card">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="card-title mb-0">
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
            { title: '变量名', key: 'name', width: 200, ellipsis: { tooltip: true } },
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

<style scoped lang="scss">
.system-tab {
  padding: 0;
}

.card {
  border-radius: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
  margin-bottom: 16px;
}

.space-y-4 > * + * {
  margin-top: 16px;
}

.space-y-3 > * + * {
  margin-top: 12px;
}

.info-box {
  padding: 16px;
  background-color: rgba(var(--n-color-target-rgb), 0.3);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.info-label {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
}

.resource-label {
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.resource-value {
  font-size: 18px;
  font-weight: bold;
}

.resource-max {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  margin-left: 4px;
}

.resource-progress {
  width: 100%;
  height: 8px;
  background-color: var(--n-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.resource-progress-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.divider-line {
  height: 1px;
  background-color: var(--n-border-color);
  margin: 12px 0;
}

.stat-item {
  text-align: left;
}

.stat-label {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
}

.disk-item {
  padding: 12px;
  background-color: rgba(var(--n-color-target-rgb), 0.3);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.disk-name {
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--n-text-color);
}

.disk-value {
  font-size: 16px;
  font-weight: bold;
}

.disk-max {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  margin-left: 4px;
}

.disk-progress {
  width: 100%;
  height: 6px;
  background-color: var(--n-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.disk-progress-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.network-progress {
  width: 100%;
  height: 6px;
  background-color: var(--n-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.network-progress-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.jvm-args {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.jvm-arg {
  padding: 4px 8px;
  color: var(--n-text-color);
}
</style>
