<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NCard, NCheckbox, NForm, NFormItem, NGrid, NGridItem, NInput, NTag } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  instanceId: string;
}

defineProps<Props>();

// Class Explorer 模式
type ExplorerMode = 'sc' | 'sm' | 'classloader';
const currentMode = ref<ExplorerMode>('sc');

// SC - Search Class 配置
interface SearchClassConfig {
  pattern: string;
  showDetail: boolean;
  showField: boolean;
  useRegex: boolean;
}

const scConfig = ref<SearchClassConfig>({
  pattern: '',
  showDetail: false,
  showField: false,
  useRegex: false
});

// 类搜索结果
interface ClassInfo {
  name: string;
  classLoader: string;
  superClass: string;
  interfaces: string[];
  fields: number;
  methods: number;
  modifiers: string;
}

const scResults = ref<ClassInfo[]>([]);

// SM - Search Method 配置
interface SearchMethodConfig {
  className: string;
  methodPattern: string;
  showDetail: boolean;
  useRegex: boolean;
}

const smConfig = ref<SearchMethodConfig>({
  className: '',
  methodPattern: '',
  showDetail: true,
  useRegex: false
});

// 方法搜索结果
interface MethodInfo {
  name: string;
  modifiers: string;
  returnType: string;
  parameters: string;
  exceptions: string[];
}

const smResults = ref<MethodInfo[]>([]);

// ClassLoader 树形数据
interface ClassLoaderNode {
  id: string;
  name: string;
  type: string;
  classCount: number;
  children?: ClassLoaderNode[];
  classes?: string[];
  expanded?: boolean;
}

const classLoaderTree = ref<ClassLoaderNode[]>([]);
const selectedClassLoader = ref<ClassLoaderNode | null>(null);

// 切换模式
const switchMode = (mode: ExplorerMode) => {
  currentMode.value = mode;
};

// 模式提示信息
const modeTips = computed(() => {
  const tips = {
    sc: ['支持通配符 *', '支持正则表达式', '显示类的详细信息'],
    sm: ['显示方法签名', '显示方法修饰符', '显示参数和返回值'],
    classloader: ['显示类加载器层级', '显示已加载的类', '显示加载路径']
  };
  return tips[currentMode.value];
});

// SC - 搜索类
const searchClass = () => {
  if (!scConfig.value.pattern.trim()) {
    window.$message?.warning('请输入类名模式');
    return;
  }

  // 生成模拟数据
  const mockClasses: ClassInfo[] = [
    {
      name: 'com.example.service.UserService',
      classLoader: 'AppClassLoader',
      superClass: 'java.lang.Object',
      interfaces: ['com.example.service.IUserService'],
      fields: 5,
      methods: 12,
      modifiers: 'public'
    },
    {
      name: 'com.example.service.OrderService',
      classLoader: 'AppClassLoader',
      superClass: 'com.example.service.BaseService',
      interfaces: [],
      fields: 8,
      methods: 15,
      modifiers: 'public'
    },
    {
      name: 'com.example.controller.UserController',
      classLoader: 'AppClassLoader',
      superClass: 'java.lang.Object',
      interfaces: [],
      fields: 3,
      methods: 8,
      modifiers: 'public'
    },
    {
      name: 'com.example.model.User',
      classLoader: 'AppClassLoader',
      superClass: 'java.lang.Object',
      interfaces: ['java.io.Serializable'],
      fields: 10,
      methods: 20,
      modifiers: 'public'
    },
    {
      name: 'com.example.util.StringUtils',
      classLoader: 'AppClassLoader',
      superClass: 'java.lang.Object',
      interfaces: [],
      fields: 0,
      methods: 25,
      modifiers: 'public final'
    }
  ];

  scResults.value = mockClasses;
  window.$message?.success(`找到 ${mockClasses.length} 个类`);
};

// 加载 SC 示例
const loadSampleSC = () => {
  scConfig.value = {
    pattern: 'com.example.*Service',
    showDetail: true,
    showField: true,
    useRegex: false
  };
  searchClass();
};

// 重置 SC 配置
const resetSC = () => {
  scConfig.value = {
    pattern: '',
    showDetail: false,
    showField: false,
    useRegex: false
  };
  scResults.value = [];
};

// SM - 搜索方法
const searchMethod = () => {
  if (!smConfig.value.className.trim()) {
    window.$message?.warning('请输入类名');
    return;
  }

  // 生成模拟数据
  const mockMethods: MethodInfo[] = [
    {
      name: 'getUserById',
      modifiers: 'public',
      returnType: 'User',
      parameters: 'Long id',
      exceptions: []
    },
    {
      name: 'getUserByName',
      modifiers: 'public',
      returnType: 'User',
      parameters: 'String name',
      exceptions: ['UserNotFoundException']
    },
    {
      name: 'createUser',
      modifiers: 'public',
      returnType: 'void',
      parameters: 'User user',
      exceptions: ['ValidationException']
    },
    {
      name: 'updateUser',
      modifiers: 'public',
      returnType: 'boolean',
      parameters: 'Long id, User user',
      exceptions: []
    },
    {
      name: 'deleteUser',
      modifiers: 'public',
      returnType: 'void',
      parameters: 'Long id',
      exceptions: []
    },
    {
      name: 'getAllUsers',
      modifiers: 'public',
      returnType: 'List<User>',
      parameters: '',
      exceptions: []
    },
    {
      name: 'findUsersByAge',
      modifiers: 'public',
      returnType: 'List<User>',
      parameters: 'int minAge, int maxAge',
      exceptions: []
    },
    {
      name: 'validateUser',
      modifiers: 'private',
      returnType: 'boolean',
      parameters: 'User user',
      exceptions: []
    }
  ];

  smResults.value = mockMethods;
  window.$message?.success(`找到 ${mockMethods.length} 个方法`);
};

// 加载 SM 示例
const loadSampleSM = () => {
  smConfig.value = {
    className: 'com.example.service.UserService',
    methodPattern: 'get*',
    showDetail: true,
    useRegex: false
  };
  searchMethod();
};

// 重置 SM 配置
const resetSM = () => {
  smConfig.value = {
    className: '',
    methodPattern: '',
    showDetail: true,
    useRegex: false
  };
  smResults.value = [];
};

// 加载 ClassLoader 树
const loadClassLoaderTree = () => {
  const mockTree: ClassLoaderNode[] = [
    {
      id: 'bootstrap',
      name: 'Bootstrap ClassLoader',
      type: 'bootstrap',
      classCount: 156,
      expanded: false,
      children: [],
      classes: ['java.lang.Object', 'java.lang.String', 'java.lang.Integer', 'java.util.ArrayList', 'java.util.HashMap']
    },
    {
      id: 'extension',
      name: 'Extension ClassLoader',
      type: 'extension',
      classCount: 42,
      expanded: false,
      children: [],
      classes: ['javax.crypto.Cipher', 'javax.net.ssl.SSLContext', 'sun.security.provider.SHA']
    },
    {
      id: 'application',
      name: 'Application ClassLoader',
      type: 'application',
      classCount: 328,
      expanded: false,
      children: [
        {
          id: 'spring',
          name: 'Spring ClassLoader',
          type: 'custom',
          classCount: 156,
          expanded: false,
          classes: [
            'org.springframework.context.ApplicationContext',
            'org.springframework.beans.factory.BeanFactory',
            'org.springframework.boot.SpringApplication'
          ]
        },
        {
          id: 'tomcat',
          name: 'Tomcat ClassLoader',
          type: 'custom',
          classCount: 89,
          expanded: false,
          classes: [
            'org.apache.catalina.startup.Tomcat',
            'org.apache.coyote.http11.Http11Processor',
            'org.apache.tomcat.util.threads.ThreadPoolExecutor'
          ]
        }
      ],
      classes: ['com.example.Application', 'com.example.service.UserService', 'com.example.controller.UserController']
    }
  ];

  classLoaderTree.value = mockTree;
  window.$message?.success('ClassLoader 树加载成功');
};

// 切换 ClassLoader 节点展开状态
const toggleClassLoader = (node: ClassLoaderNode) => {
  node.expanded = !node.expanded;
};

// 选择 ClassLoader
const selectClassLoader = (node: ClassLoaderNode) => {
  selectedClassLoader.value = node;
};

// 导出结果
const exportResults = (mode: ExplorerMode) => {
  let data: any[] = [];
  let filename = '';

  if (mode === 'sc') {
    data = scResults.value;
    filename = 'class-search-results.json';
  } else if (mode === 'sm') {
    data = smResults.value;
    filename = 'method-search-results.json';
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  window.$message?.success('导出成功');
};

// 查看类的方法
const viewClassMethods = (className: string) => {
  smConfig.value.className = className;
  currentMode.value = 'sm';
  searchMethod();
};

// 反编译类
const decompileClass = (className: string) => {
  window.$message?.info(`反编译 ${className} (功能开发中)`);
};

// Watch 方法
const watchMethod = (className: string, methodName: string) => {
  window.$message?.info(`Watch ${className}.${methodName} (功能开发中)`);
};

// Trace 方法
const traceMethod = (className: string, methodName: string) => {
  window.$message?.info(`Trace ${className}.${methodName} (功能开发中)`);
};

// 获取方法修饰符颜色
const getModifierColor = (modifiers: string) => {
  if (modifiers.includes('private')) return 'error';
  if (modifiers.includes('protected')) return 'warning';
  return 'success';
};
</script>

<template>
  <div class="h-full flex flex-col gap-16px">
    <NGrid cols="1 l:4" responsive="screen" :x-gap="16" :y-gap="16">
      <!-- 左侧功能面板 -->
      <NGridItem span="1 l:1">
        <NCard size="small" class="sticky top-16px">
          <template #header>
            <div class="flex-y-center gap-8px">
              <SvgIcon icon="lucide:layers" class="text-16px text-primary" />
              <span class="font-semibold">功能选择</span>
            </div>
          </template>

          <!-- 模式按钮 -->
          <div class="flex flex-col gap-8px">
            <NButton
              :type="currentMode === 'sc' ? 'primary' : 'default'"
              block
              class="h-auto! py-12px!"
              @click="switchMode('sc')"
            >
              <div class="w-full flex-y-center gap-12px">
                <SvgIcon icon="lucide:search" class="text-20px" />
                <div class="flex-1 text-left">
                  <div class="text-14px font-semibold">Search Class</div>
                  <div class="text-12px opacity-80">搜索已加载的类</div>
                </div>
              </div>
            </NButton>

            <NButton
              :type="currentMode === 'sm' ? 'primary' : 'default'"
              block
              class="h-auto! py-12px!"
              @click="switchMode('sm')"
            >
              <div class="w-full flex-y-center gap-12px">
                <SvgIcon icon="lucide:list" class="text-20px" />
                <div class="flex-1 text-left">
                  <div class="text-14px font-semibold">Search Method</div>
                  <div class="text-12px opacity-80">搜索类的方法</div>
                </div>
              </div>
            </NButton>

            <NButton
              :type="currentMode === 'classloader' ? 'primary' : 'default'"
              block
              class="h-auto! py-12px!"
              @click="switchMode('classloader')"
            >
              <div class="w-full flex-y-center gap-12px">
                <SvgIcon icon="lucide:folder-tree" class="text-20px" />
                <div class="flex-1 text-left">
                  <div class="text-14px font-semibold">ClassLoader</div>
                  <div class="text-12px opacity-80">类加载器层级</div>
                </div>
              </div>
            </NButton>
          </div>

          <!-- 快捷提示 -->
          <div class="mt-16px border border-info/20 rounded-8px bg-info/10 p-12px">
            <div class="mb-8px flex-y-center gap-8px">
              <SvgIcon icon="lucide:info" class="text-12px text-info" />
              <div class="text-12px text-info font-semibold">快捷提示</div>
            </div>
            <div class="text-12px text-gray space-y-4px">
              <div v-for="(tip, index) in modeTips" :key="index">• {{ tip }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>

      <!-- 右侧内容区域 -->
      <NGridItem span="1 l:3">
        <!-- SC - Search Class -->
        <div v-show="currentMode === 'sc'" class="flex flex-col gap-16px">
          <!-- 搜索表单 -->
          <NCard size="small">
            <template #header>
              <div class="flex-y-center gap-8px">
                <SvgIcon icon="lucide:search" class="text-16px text-primary" />
                <span class="font-semibold">搜索类 (Search Class)</span>
              </div>
            </template>

            <NForm label-placement="top" label-width="auto" require-mark-placement="left">
              <NFormItem label="类名模式" required>
                <template #label>
                  <span>
                    类名模式
                    <span class="text-error">*</span>
                  </span>
                  <span class="ml-8px text-12px text-gray font-normal">(支持通配符 * 和正则表达式)</span>
                </template>
                <NInput
                  v-model:value="scConfig.pattern"
                  placeholder="例如: com.example.* 或 *Service 或 com\.example\..*Service"
                  class="font-mono"
                />
              </NFormItem>

              <NGrid cols="1 m:3" responsive="screen" :x-gap="16" :y-gap="8">
                <NGridItem>
                  <NCheckbox v-model:checked="scConfig.showDetail">显示详细信息</NCheckbox>
                </NGridItem>
                <NGridItem>
                  <NCheckbox v-model:checked="scConfig.showField">显示字段</NCheckbox>
                </NGridItem>
                <NGridItem>
                  <NCheckbox v-model:checked="scConfig.useRegex">使用正则表达式</NCheckbox>
                </NGridItem>
              </NGrid>

              <div class="mt-16px flex-y-center gap-8px">
                <NButton type="primary" @click="searchClass">
                  <template #icon>
                    <SvgIcon icon="lucide:search" />
                  </template>
                  搜索类
                </NButton>
                <NButton @click="loadSampleSC">
                  <template #icon>
                    <SvgIcon icon="lucide:file-code" />
                  </template>
                  加载示例
                </NButton>
                <NButton @click="resetSC">
                  <template #icon>
                    <SvgIcon icon="lucide:rotate-ccw" />
                  </template>
                  重置
                </NButton>
              </div>
            </NForm>
          </NCard>

          <!-- 搜索结果 -->
          <NCard size="small">
            <template #header>
              <div class="flex-y-center justify-between">
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:list" class="text-16px text-primary" />
                  <span class="font-semibold">搜索结果</span>
                  <span v-if="scResults.length > 0" class="text-12px text-gray">
                    (找到 {{ scResults.length }} 个类)
                  </span>
                </div>
                <NButton size="small" @click="exportResults('sc')">
                  <template #icon>
                    <SvgIcon icon="lucide:download" />
                  </template>
                  导出
                </NButton>
              </div>
            </template>

            <div v-if="scResults.length === 0" class="py-48px text-center text-gray">
              <div class="mb-12px flex justify-center">
                <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
              </div>
              <div class="text-14px">暂无搜索结果</div>
              <div class="mt-4px text-12px text-gray">输入类名模式并点击"搜索类"</div>
            </div>

            <div v-else class="flex flex-col gap-12px">
              <div
                v-for="cls in scResults"
                :key="cls.name"
                class="border border-gray/20 rounded-8px bg-container p-16px transition hover:border-primary"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="mb-8px flex-y-center gap-8px">
                      <SvgIcon icon="lucide:file-code" class="text-16px text-primary" />
                      <code class="text-14px text-primary font-mono">{{ cls.name }}</code>
                    </div>

                    <div v-if="scConfig.showDetail" class="ml-24px text-12px text-gray space-y-4px">
                      <div class="flex-y-center gap-8px">
                        <span class="text-gray/60">ClassLoader:</span>
                        <span class="text-info">{{ cls.classLoader }}</span>
                      </div>
                      <div class="flex-y-center gap-8px">
                        <span class="text-gray/60">Super Class:</span>
                        <span class="text-warning">{{ cls.superClass }}</span>
                      </div>
                      <div v-if="cls.interfaces.length > 0" class="flex-y-center gap-8px">
                        <span class="text-gray/60">Interfaces:</span>
                        <span class="text-success">{{ cls.interfaces.join(', ') }}</span>
                      </div>
                      <div class="flex-y-center gap-16px">
                        <span>
                          <span class="text-gray/60">Modifiers:</span>
                          <span class="text-purple">{{ cls.modifiers }}</span>
                        </span>
                        <span>
                          <span class="text-gray/60">Fields:</span>
                          <span>{{ cls.fields }}</span>
                        </span>
                        <span>
                          <span class="text-gray/60">Methods:</span>
                          <span>{{ cls.methods }}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex-y-center gap-8px">
                    <NButton size="small" type="info" @click="viewClassMethods(cls.name)">
                      <template #icon>
                        <SvgIcon icon="lucide:list" />
                      </template>
                      查看方法
                    </NButton>
                    <NButton size="small" type="warning" @click="decompileClass(cls.name)">
                      <template #icon>
                        <SvgIcon icon="lucide:code" />
                      </template>
                      反编译
                    </NButton>
                  </div>
                </div>
              </div>
            </div>
          </NCard>
        </div>

        <!-- SM - Search Method -->
        <div v-show="currentMode === 'sm'" class="flex flex-col gap-16px">
          <!-- 搜索表单 -->
          <NCard size="small">
            <template #header>
              <div class="flex-y-center gap-8px">
                <SvgIcon icon="lucide:list" class="text-16px text-success" />
                <span class="font-semibold">搜索方法 (Search Method)</span>
              </div>
            </template>

            <NForm label-placement="top" label-width="auto" require-mark-placement="left">
              <NFormItem label="类名" required>
                <template #label>
                  <span>
                    类名
                    <span class="text-error">*</span>
                  </span>
                </template>
                <NInput
                  v-model:value="smConfig.className"
                  placeholder="例如: com.example.service.UserService"
                  class="font-mono"
                />
              </NFormItem>

              <NFormItem label="方法名模式">
                <template #label>
                  <span>方法名模式</span>
                  <span class="ml-8px text-12px text-gray font-normal">(可选，留空显示所有方法)</span>
                </template>
                <NInput v-model:value="smConfig.methodPattern" placeholder="例如: get* 或 findById" class="font-mono" />
              </NFormItem>

              <NGrid cols="1 m:2" responsive="screen" :x-gap="16" :y-gap="8">
                <NGridItem>
                  <NCheckbox v-model:checked="smConfig.showDetail">显示详细信息</NCheckbox>
                </NGridItem>
                <NGridItem>
                  <NCheckbox v-model:checked="smConfig.useRegex">使用正则表达式</NCheckbox>
                </NGridItem>
              </NGrid>

              <div class="mt-16px flex-y-center gap-8px">
                <NButton type="success" @click="searchMethod">
                  <template #icon>
                    <SvgIcon icon="lucide:search" />
                  </template>
                  搜索方法
                </NButton>
                <NButton @click="loadSampleSM">
                  <template #icon>
                    <SvgIcon icon="lucide:file-code" />
                  </template>
                  加载示例
                </NButton>
                <NButton @click="resetSM">
                  <template #icon>
                    <SvgIcon icon="lucide:rotate-ccw" />
                  </template>
                  重置
                </NButton>
              </div>
            </NForm>
          </NCard>

          <!-- 方法列表 -->
          <NCard size="small">
            <template #header>
              <div class="flex-y-center justify-between">
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:list" class="text-16px text-success" />
                  <span class="font-semibold">方法列表</span>
                  <span v-if="smResults.length > 0" class="text-12px text-gray">
                    (找到 {{ smResults.length }} 个方法)
                  </span>
                </div>
                <NButton size="small" @click="exportResults('sm')">
                  <template #icon>
                    <SvgIcon icon="lucide:download" />
                  </template>
                  导出
                </NButton>
              </div>
            </template>

            <div v-if="smResults.length === 0" class="py-48px text-center text-gray">
              <div class="mb-12px flex justify-center">
                <SvgIcon icon="lucide:inbox" class="text-48px opacity-50" />
              </div>
              <div class="text-14px">暂无方法数据</div>
              <div class="mt-4px text-12px text-gray">输入类名并点击"搜索方法"</div>
            </div>

            <div v-else class="flex flex-col gap-8px">
              <!-- 类名显示 -->
              <div class="mb-8px border border-gray/20 rounded-8px bg-container p-12px">
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:package" class="text-16px text-primary" />
                  <span class="text-12px text-gray">类名:</span>
                  <code class="text-14px text-primary font-mono">{{ smConfig.className }}</code>
                </div>
              </div>

              <!-- 方法列表 -->
              <div
                v-for="method in smResults"
                :key="method.name"
                class="border border-gray/20 rounded-8px bg-container/50 p-12px text-12px font-mono transition hover:border-success"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-y-center flex-1 gap-8px">
                    <SvgIcon icon="lucide:function-square" class="text-16px text-success" />
                    <div class="flex-y-center flex-wrap gap-8px">
                      <NTag :type="getModifierColor(method.modifiers)" size="small">{{ method.modifiers }}</NTag>
                      <span class="text-info">{{ method.returnType }}</span>
                      <span class="font-semibold">{{ method.name }}</span>
                      <span class="text-gray">({{ method.parameters }})</span>
                      <span v-if="method.exceptions.length > 0" class="text-warning">
                        throws {{ method.exceptions.join(', ') }}
                      </span>
                    </div>
                  </div>

                  <div class="flex-y-center gap-4px">
                    <NButton size="tiny" type="primary" @click="watchMethod(smConfig.className, method.name)">
                      <template #icon>
                        <SvgIcon icon="lucide:eye" />
                      </template>
                    </NButton>
                    <NButton size="tiny" type="info" @click="traceMethod(smConfig.className, method.name)">
                      <template #icon>
                        <SvgIcon icon="lucide:git-branch" />
                      </template>
                    </NButton>
                  </div>
                </div>
              </div>
            </div>
          </NCard>
        </div>

        <!-- ClassLoader -->
        <div v-show="currentMode === 'classloader'" class="flex flex-col gap-16px">
          <!-- ClassLoader 树 -->
          <NCard size="small">
            <template #header>
              <div class="flex-y-center justify-between">
                <div class="flex-y-center gap-8px">
                  <SvgIcon icon="lucide:folder-tree" class="text-16px text-info" />
                  <span class="font-semibold">ClassLoader 层级</span>
                </div>
                <NButton type="info" size="small" @click="loadClassLoaderTree">
                  <template #icon>
                    <SvgIcon icon="lucide:refresh-cw" />
                  </template>
                  刷新
                </NButton>
              </div>
            </template>

            <div v-if="classLoaderTree.length === 0" class="py-48px text-center text-gray">
              <div class="mb-12px flex justify-center">
                <SvgIcon icon="lucide:folder-tree" class="text-48px opacity-50" />
              </div>
              <div class="text-14px">暂无 ClassLoader 数据</div>
              <div class="mt-4px text-12px text-gray">点击"刷新"加载 ClassLoader 树</div>
            </div>

            <!-- ClassLoader 树形展示 -->
            <div v-else class="flex flex-col gap-8px">
              <template v-for="node in classLoaderTree" :key="node.id">
                <div class="border border-gray/20 rounded-8px bg-container">
                  <!-- 节点标题 -->
                  <div
                    class="flex-y-center cursor-pointer justify-between p-12px transition hover:bg-primary/5"
                    @click="toggleClassLoader(node)"
                  >
                    <div class="flex-y-center flex-1 gap-8px">
                      <SvgIcon
                        :icon="node.expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                        class="text-16px text-gray"
                      />
                      <SvgIcon icon="lucide:folder" class="text-16px text-warning" />
                      <span class="text-14px font-semibold">{{ node.name }}</span>
                      <NTag size="small" type="info">{{ node.classCount }} classes</NTag>
                    </div>
                    <NButton size="tiny" type="info" @click.stop="selectClassLoader(node)">
                      <template #icon>
                        <SvgIcon icon="lucide:info" />
                      </template>
                      详情
                    </NButton>
                  </div>

                  <!-- 类列表 -->
                  <div v-if="node.expanded" class="border-t border-gray/10 p-12px space-y-4px">
                    <div
                      v-for="cls in node.classes"
                      :key="cls"
                      class="flex-y-center gap-8px pl-24px text-12px font-mono"
                    >
                      <SvgIcon icon="lucide:file-code" class="text-12px text-primary" />
                      <span class="text-gray">{{ cls }}</span>
                    </div>

                    <!-- 子节点 -->
                    <template v-if="node.children && node.children.length > 0">
                      <div v-for="child in node.children" :key="child.id" class="ml-24px mt-8px">
                        <div
                          class="flex-y-center cursor-pointer justify-between rounded-6px bg-container/50 p-8px transition hover:bg-primary/5"
                          @click="toggleClassLoader(child)"
                        >
                          <div class="flex-y-center flex-1 gap-8px">
                            <SvgIcon
                              :icon="child.expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                              class="text-14px text-gray"
                            />
                            <SvgIcon icon="lucide:folder" class="text-14px text-success" />
                            <span class="text-12px font-semibold">{{ child.name }}</span>
                            <NTag size="tiny" type="success">{{ child.classCount }}</NTag>
                          </div>
                        </div>

                        <div v-if="child.expanded" class="ml-16px mt-4px space-y-2px">
                          <div
                            v-for="cls in child.classes"
                            :key="cls"
                            class="flex-y-center gap-6px pl-16px text-11px font-mono"
                          >
                            <SvgIcon icon="lucide:file-code" class="text-10px text-primary" />
                            <span class="text-gray">{{ cls }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </NCard>

          <!-- 选中的 ClassLoader 详情 -->
          <NCard v-if="selectedClassLoader" size="small">
            <template #header>
              <div class="flex-y-center gap-8px">
                <SvgIcon icon="lucide:info" class="text-16px text-info" />
                <span class="font-semibold">ClassLoader 详情</span>
              </div>
            </template>

            <div class="space-y-12px">
              <div class="flex-y-center gap-8px">
                <span class="w-100px text-12px text-gray">名称:</span>
                <span class="text-14px font-semibold">{{ selectedClassLoader.name }}</span>
              </div>
              <div class="flex-y-center gap-8px">
                <span class="w-100px text-12px text-gray">类型:</span>
                <NTag size="small" type="info">{{ selectedClassLoader.type }}</NTag>
              </div>
              <div class="flex-y-center gap-8px">
                <span class="w-100px text-12px text-gray">已加载类数:</span>
                <span class="text-14px text-primary font-semibold">{{ selectedClassLoader.classCount }}</span>
              </div>
              <div>
                <div class="mb-8px text-12px text-gray">已加载的类:</div>
                <div class="max-h-200px overflow-y-auto space-y-4px">
                  <div
                    v-for="cls in selectedClassLoader.classes"
                    :key="cls"
                    class="rounded-6px bg-container/50 p-8px text-12px text-gray font-mono"
                  >
                    {{ cls }}
                  </div>
                </div>
              </div>
            </div>
          </NCard>
        </div>
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped></style>
