<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import TopBar from '@/components/layout/TopBar.vue'
import BottomBar from '@/components/layout/BottomBar.vue'
import MiniPlayer from '@/components/player/MiniPlayer.vue'
import { useLayoutStore } from '@/stores/layout'
import { usePlayerStore } from '@/stores/player'

const layoutStore = useLayoutStore()
const playerStore = usePlayerStore()

// 挂载时监听窗口变化
onMounted(() => {
  layoutStore.handleResize()
  window.addEventListener('resize', layoutStore.handleResize)
})

// 卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', layoutStore.handleResize)
})
</script>

<template>
  <div class="app-layout-wrapper" :class="{ 'has-global-bg': !!playerStore.currentSong }">
    <!-- 全局播放背景 -->
    <template v-if="playerStore.currentSong">
      <!-- 动态模糊背景（使用小图提升性能） -->
      <div
        class="global-bg-blur"
        :style="{ backgroundImage: `url(${playerStore.currentSong.al.picUrl}?param=100y100)` }"
      ></div>
      <!-- 遮罩，保证文字可读性，颜色跟随主题 -->
      <div class="global-bg-mask"></div>
    </template>

    <!-- 侧边栏遮罩层（仅移动端侧边栏展开时出现） -->
    <div
      class="sidebar-overlay"
      :class="{ 'is-active': !layoutStore.isSidebarCollapsed }"
      @click="layoutStore.closeSidebar"
    ></div>

    <!-- 侧边栏 -->
    <Sidebar :collapsed="layoutStore.isSidebarCollapsed" />

    <!-- 主容器 -->
    <div class="layout-main-container">
      <!-- 顶栏 -->
      <TopBar @toggle-sidebar="layoutStore.toggleSidebar" />

      <!-- 内容投影区 -->
      <main class="layout-content-area">
        <slot />
      </main>

      <!-- 底栏 -->
      <BottomBar />

      <!-- 全局浮动迷你播放器 -->
      <MiniPlayer />
    </div>
  </div>
</template>

<style scoped>
/* 全局布局容器 */
.app-layout-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-bg);
  position: relative;
  transition: background-color var(--transition-slow);
}

.app-layout-wrapper.has-global-bg {
  background-color: transparent;
}

/* 全局动态模糊背景：缩放放大提升模糊性能 */
.global-bg-blur {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  background-size: cover;
  background-position: center;
  filter: blur(80px);
  opacity: 0.45;
  z-index: -2;
  transform: translate(-50%, -50%) scale(2.5) translateZ(0);
  will-change: transform;
}

/* 遮罩叠加层：使用主题变量，亮色偏浅，暗色偏深 */
.global-bg-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-glass-mask);
  z-index: -1;
  transition: background-color var(--transition-slow);
}

/* 主内容容器 */
.layout-main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 内容区域 */
.layout-content-area {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* 侧边栏遮罩层（隐形，仅用于捕获点击） */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
  /* 位于内容之上，侧边栏(z=20)之下 */
  z-index: 15;
}

/* 仅在窄屏下激活遮罩层逻辑 */
@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
    pointer-events: none;
  }

  .sidebar-overlay.is-active {
    pointer-events: auto;
  }
}
</style>
