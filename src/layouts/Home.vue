<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import TopBar from '@/components/layout/TopBar.vue'
import BottomBar from '@/components/layout/BottomBar.vue'
import { useLayoutStore } from '@/stores/layout'

const layoutStore = useLayoutStore()

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
  <div class="app-layout-wrapper">
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
</style>
