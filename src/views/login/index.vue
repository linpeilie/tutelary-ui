<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import api from '@/api/auth'
import { getLocal, removeLocal, setLocal, setToken } from '@/utils'
import { addDynamicRoutes } from '@/router'

const title: string = import.meta.env.VITE_APP_TITLE

const router = useRouter()
const route = useRoute()
const query = route.query

interface LoginInfo {
  name: string
  password: string
}

const loginInfo = ref<LoginInfo>({
  name: '',
  password: '',
})

const localLoginInfo = getLocal('loginInfo') as LoginInfo
if (localLoginInfo) {
  loginInfo.value.name = localLoginInfo.name || ''
  loginInfo.value.password = localLoginInfo.password || ''
}

const loging = ref<boolean>(false)
const isRemember = useStorage('isRemember', false)

// 动画装饰元素
const floatingElements = ref([
  { top: '10%', left: '5%', delay: '0s', duration: '20s' },
  { top: '60%', left: '80%', delay: '2s', duration: '25s' },
  { top: '30%', left: '90%', delay: '1s', duration: '22s' },
  { top: '80%', left: '10%', delay: '3s', duration: '28s' },
])

async function handleLogin() {
  const { name, password } = loginInfo.value
  if (!name || !password) {
    window.$message?.warning('请输入用户名和密码')
    return
  }
  try {
    loging.value = true
    const res = await api.login({ username: name, password: password.toString() })
    window.$notification?.success({ title: '登录成功！', duration: 2500 })
    setToken(res.token)
    if (isRemember.value)
      setLocal('loginInfo', { name, password })

    else
      removeLocal('loginInfo')

    await addDynamicRoutes()
    if (query.redirect) {
      const path = query.redirect as string
      Reflect.deleteProperty(query, 'redirect')
      router.push({ path, query })
    }
    else {
      router.push('/')
    }
  }
  catch (error) {
    console.error(error)
  }
  loging.value = false
}
</script>

<template>
  <div class="login-page">
    <!-- 渐变背景 -->
    <div class="gradient-bg" />

    <!-- 浮动装饰元素 -->
    <div
      v-for="(element, index) in floatingElements"
      :key="index"
      class="floating-element"
      :style="{
        top: element.top,
        left: element.left,
        animationDelay: element.delay,
        animationDuration: element.duration,
      }"
    />

    <!-- 登录卡片容器 -->
    <div class="login-container">
      <div class="login-card">
        <!-- Logo 和标题区域 -->
        <div class="login-header">
          <div class="logo-wrapper">
            <img src="@/assets/images/logo.png" alt="Logo" class="logo-image">
          </div>
          <h1 class="login-title">
            {{ title }}
          </h1>
          <p class="login-subtitle">
            欢迎回来,请登录您的账户
          </p>
        </div>

        <!-- 登录表单 -->
        <div class="login-form">
          <div class="form-group">
            <div class="input-label">
              <i class="i-carbon-user" />
              <span>用户名</span>
            </div>
            <n-input
              v-model:value="loginInfo.name"
              autofocus
              size="large"
              placeholder="请输入用户名"
              :maxlength="20"
              class="form-input"
            >
              <template #prefix>
                <i class="i-carbon-user text-18" />
              </template>
            </n-input>
          </div>

          <div class="form-group">
            <div class="input-label">
              <i class="i-carbon-password" />
              <span>密码</span>
            </div>
            <n-input
              v-model:value="loginInfo.password"
              size="large"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              :maxlength="20"
              class="form-input"
              @keydown.enter="handleLogin"
            >
              <template #prefix>
                <i class="i-carbon-password text-18" />
              </template>
            </n-input>
          </div>

          <div class="form-options">
            <n-checkbox
              :checked="isRemember"
              :on-update:checked="(val: boolean) => (isRemember = val)"
            >
              <span class="remember-text">记住我</span>
            </n-checkbox>
          </div>

          <div class="form-actions">
            <n-button
              type="primary"
              size="large"
              block
              :loading="loging"
              class="login-button"
              @click="handleLogin"
            >
              <template v-if="!loging">
                <i class="i-carbon-login mr-2" />
                <span>登 录</span>
              </template>
              <template v-else>
                <span>登录中...</span>
              </template>
            </n-button>
          </div>
        </div>

        <!-- 底部装饰 -->
        <div class="login-footer">
          <div class="footer-text">
            Powered by {{ title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 渐变背景
.gradient-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

// 浮动装饰元素
.floating-element {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  opacity: 0.1;
  animation: float ease-in-out infinite;
  pointer-events: none;

  &:nth-child(2) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &:nth-child(3) {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    width: 200px;
    height: 200px;
  }

  &:nth-child(4) {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    width: 250px;
    height: 250px;
  }

  &:nth-child(5) {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    width: 180px;
    height: 180px;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(20px, -20px) rotate(90deg);
  }
  50% {
    transform: translate(-20px, 20px) rotate(180deg);
  }
  75% {
    transform: translate(20px, 20px) rotate(270deg);
  }
}

// 登录容器
.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
  padding: 20px;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 登录卡片
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
    transform: translateY(-2px);
  }

  html.dark & {
    background: rgba(31, 41, 55, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

// 登录头部
.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.logo-image {
  height: 72px;
  width: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;

  html.dark & {
    background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.login-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;

  html.dark & {
    color: #9ca3af;
  }
}

// 表单样式
.login-form {
  .form-group {
    margin-bottom: 24px;
  }

  .input-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;

    html.dark & {
      color: #d1d5db;
    }

    i {
      font-size: 16px;
      color: #667eea;
    }
  }

  .form-input {
    :deep(.n-input__input-el) {
      font-size: 15px;
    }

    :deep(.n-input) {
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover,
      &:focus-within {
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;

    .remember-text {
      font-size: 14px;
      color: #6b7280;

      html.dark & {
        color: #9ca3af;
      }
    }
  }

  .form-actions {
    .login-button {
      height: 48px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
      }

      &:active {
        transform: translateY(0);
      }

      :deep(.n-button__content) {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

// 底部
.login-footer {
  margin-top: 32px;
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  html.dark & {
    border-top-color: rgba(255, 255, 255, 0.06);
  }

  .footer-text {
    font-size: 13px;
    color: #9ca3af;

    html.dark & {
      color: #6b7280;
    }
  }
}

// 响应式设计
@media (max-width: 640px) {
  .login-container {
    max-width: 100%;
    padding: 16px;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: 20px;
  }

  .logo-image {
    height: 56px;
  }

  .login-title {
    font-size: 24px;
  }

  .login-subtitle {
    font-size: 13px;
  }
}
</style>
