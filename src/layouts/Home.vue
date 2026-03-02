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
      <!-- 浅色遮罩，保证文字可读性 -->
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
  background-color: #f7f9fc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  position: relative; /* 确保内部绝对定位元素以此为参考 */
  transition: background-color 0.5s ease;
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
  opacity: 0.5; /* 全局背景可以比播放页稍微淡一点 */
  z-index: -2;
  transform: translate(-50%, -50%) scale(2.5) translateZ(0);
  will-change: transform;
}
/* 全局半透明遮罩叠加层：保证前台深色文字可读性 */
.global-bg-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(247, 249, 252, 0.75); /* 使用原底色带有 0.75 的透明度 */
  z-index: -1;
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
  padding: 16px;
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
