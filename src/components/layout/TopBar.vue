<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Menu as iMenu, Search as iSearch, Home as iHome, Moon, Sun } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const themeStore = useThemeStore()

const goToSearch = () => router.push('/search')
const goToHome = () => router.push('/')
</script>

<template>
  <!-- 顶栏 -->
  <header class="layout-top-bar glass-effect">
    <div class="left-actions">
      <!-- 切换侧边栏 -->
      <button class="icon-button" @click="$emit('toggle-sidebar')" title="切换侧边栏">
        <iMenu :size="20" />
      </button>

      <!-- 首页 -->
      <button class="icon-button" @click="goToHome" title="回到首页">
        <iHome :size="20" />
      </button>
    </div>

    <div class="top-bar-middle"></div>

    <div class="right-actions">
      <!-- 暗色 / 亮色切换 -->
      <button
        class="icon-button theme-toggle"
        @click="themeStore.toggleTheme"
        :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
      >
        <Transition name="theme-icon" mode="out-in">
          <Sun v-if="themeStore.isDark" :size="20" key="sun" />
          <Moon v-else :size="20" key="moon" />
        </Transition>
      </button>

      <!-- 搜索 -->
      <button class="icon-button" title="搜索" @click="goToSearch">
        <iSearch :size="20" />
      </button>
    </div>
  </header>
</template>

<style scoped>
/* 顶栏样式 */
.layout-top-bar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  z-index: 10;
  flex-shrink: 0;
}

.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 顶栏中间弹性间距 */
.top-bar-middle {
  flex: 1;
}

/* 主题切换图标过渡动画 */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-30deg) scale(0.7);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(30deg) scale(0.7);
}
</style>
