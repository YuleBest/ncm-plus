<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getQrKey } from '@/api/login/qr/key'
import { getQrCreate } from '@/api/login/qr/create'
import { getQrCheck } from '@/api/login/qr/check'
import { useUserStore } from '@/stores/user'
import HomeLayout from '@/layouts/Home.vue'
import { Music, RefreshCw, CheckCircle2 } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

const qrImg = ref('')
const qrStatus = ref(0) // 800: 过期, 801: 等待扫码, 802: 待确认, 803: 授权登录成功
const qrMessage = ref('正在加载二维码...')
let checkTimer: number | null = null
let unikey = ''

const initQr = async () => {
  try {
    qrMessage.value = '正在加载二维码...'
    qrStatus.value = 0
    const keyRes = await getQrKey()
    if (keyRes.data?.data?.unikey) {
      unikey = keyRes.data.data.unikey
      const createRes = await getQrCreate({ key: unikey, qrimg: true, timestamp: Date.now() })
      if (createRes.data?.data?.qrimg) {
        qrImg.value = createRes.data.data.qrimg
        qrMessage.value = '请使用网易云音乐 App 扫码登录'
        startCheck()
      }
    }
  } catch {
    qrMessage.value = '加载二维码失败，请重试'
  }
}

const startCheck = () => {
  stopCheck()
  checkTimer = window.setInterval(async () => {
    if (!unikey) return
    try {
      const checkRes = await getQrCheck({ key: unikey, timestamp: Date.now() })
      const code = checkRes.data.code
      qrStatus.value = code
      qrMessage.value = checkRes.data.message

      if (code === 800) {
        // 过期
        stopCheck()
      } else if (code === 803) {
        // 登录成功
        stopCheck()
        // 获取账号信息
        await userStore.checkLogin()

        // 跳转到个人中心或首页
        if (userStore.profile?.userId) {
          router.replace(`/user/${userStore.profile.userId}`)
        } else {
          router.replace('/')
        }
      }
    } catch (error) {
      console.error(error)
    }
  }, 3000)
}

const stopCheck = () => {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
}

onMounted(() => {
  initQr()
})

onUnmounted(() => {
  stopCheck()
})
</script>

<template>
  <HomeLayout>
    <div class="login-wrapper">
      <!-- 动态背景装饰 -->
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>

      <div class="login-container">
        <div class="brand-header">
          <div class="logo-box">
            <Music :size="32" stroke-width="2.5" />
          </div>
          <h2 class="title">登录网易云音乐</h2>
          <p class="subtitle">使用手机 App 扫码登录，畅享无损音质</p>
        </div>

        <div class="qr-content">
          <div class="qr-box-wrapper">
            <!-- 扫码成功时的遮罩提示框 -->
            <transition name="fade">
              <div v-if="qrStatus === 803" class="success-overlay absolute-center">
                <CheckCircle2 :size="48" class="success-icon" />
                <p>授权登录成功</p>
                <p class="small-text">正在跳转...</p>
              </div>
            </transition>

            <div class="qr-wrapper" @click="qrStatus === 800 ? initQr() : null">
              <template v-if="qrImg">
                <img
                  :src="qrImg"
                  alt="Login QR Code"
                  class="qr-code"
                  :class="{ 'is-expired': qrStatus === 800 || qrStatus === 803 }"
                />
                <div v-if="qrStatus === 800" class="expired-overlay">
                  <div class="expired-content">
                    <RefreshCw :size="24" class="refresh-icon" />
                    <p>二维码已过期</p>
                    <p class="refresh-text">点击重新获取</p>
                  </div>
                </div>
              </template>
              <div v-else class="qr-placeholder">
                <div class="loading-ring"></div>
                <p>加载中...</p>
              </div>
            </div>
          </div>

          <div
            class="status-indicator"
            :class="{
              'status-error': qrStatus === 800,
              'status-success': qrStatus === 803,
              'status-waiting': qrStatus === 801 || qrStatus === 0,
              'status-scanning': qrStatus === 802,
            }"
          >
            <span class="status-dot"></span>
            <span class="status-text">{{ qrMessage }}</span>
          </div>
        </div>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
.login-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 140px);
  padding: 20px;
  overflow: hidden;
}

/* 动态背景装饰球 */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.15;
  animation: float 10s infinite ease-in-out alternate;
  pointer-events: none;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: var(--color-primary);
  top: 10%;
  left: 20%;
  animation-delay: 0s;
}

.shape-2 {
  width: 250px;
  height: 250px;
  background: #3b82f6;
  bottom: 10%;
  right: 20%;
  animation-delay: -5s;
}

.shape-3 {
  width: 200px;
  height: 200px;
  background: #8b5cf6;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -2s;
  opacity: 0.1;
}

@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(30px, 50px) scale(1.1);
  }
}

.login-container {
  position: relative;
  z-index: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
  transition:
    background var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.brand-header {
  text-align: center;
  margin-bottom: 40px;

  .logo-box {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, var(--color-primary), #f43f5e);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 10px 20px rgba(236, 65, 65, 0.3);
  }

  .title {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 8px;
    letter-spacing: 0.5px;
  }

  .subtitle {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.qr-box-wrapper {
  position: relative;
  margin-bottom: 30px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) inset;
  border: 1px solid var(--color-border-subtle, var(--color-border));
}

.qr-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff; /* 白底保证在暗色模式下二维码依然好被扫描 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.qr-code {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;

  &.is-expired {
    opacity: 0.15;
    filter: blur(2px);
  }
}

.expired-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-glass-mask);
  z-index: 10;

  .expired-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--color-text);
    font-weight: 600;

    .refresh-icon {
      margin-bottom: 8px;
      color: var(--color-primary);
    }

    p {
      margin: 0;
      font-size: 15px;
    }

    .refresh-text {
      margin-top: 6px;
      font-size: 13px;
      color: var(--color-primary);
      background: var(--color-primary-dim);
      padding: 4px 12px;
      border-radius: 12px;
    }
  }
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #888;

  .loading-ring {
    width: 32px;
    height: 32px;
    border: 3px solid #eee;
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    margin: 0;
    color: #888;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.absolute-center {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border-radius: 12px;

  .success-icon {
    color: var(--color-success, #10b981);
    margin-bottom: 16px;
    animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  p {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
  }

  .small-text {
    margin-top: 8px;
    font-size: 13px;
    font-weight: 400;
    color: var(--color-text-secondary);
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: var(--color-background-soft);
  transition: all 0.3s ease;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-secondary);
    transition: background 0.3s ease;
  }

  .status-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
  }

  &.status-waiting {
    .status-dot {
      background: var(--color-primary);
      animation: pulse 2s infinite;
    }
  }

  &.status-scanning {
    background: rgba(245, 158, 11, 0.1);
    .status-dot {
      background: #f59e0b;
    }
    .status-text {
      color: #d97706;
    }
  }

  &.status-success {
    background: rgba(16, 185, 129, 0.1);
    .status-dot {
      background: #10b981;
    }
    .status-text {
      color: #059669;
    }
  }

  &.status-error {
    background: rgba(239, 68, 68, 0.1);
    .status-dot {
      background: #ef4444;
    }
    .status-text {
      color: #dc2626;
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}
</style>
