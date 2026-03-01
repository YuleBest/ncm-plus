<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 侧边栏折叠状态
const isSidebarCollapsed = ref(false)

// 处理窗口大小变化
const handleResize = () => {
  const isNarrowScreen = window.innerWidth < 768
  // 窄屏默认折叠，宽屏默认展开
  isSidebarCollapsed.value = isNarrowScreen
}

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 挂载时监听窗口变化
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

// 卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="app-layout-wrapper">
    <!-- 侧边栏 -->
    <aside class="layout-sidebar glass-effect" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- 针对需求预留的侧边栏空位目前不挂载实质内容 -->
    </aside>

    <!-- 主容器 -->
    <div class="layout-main-container">
      <!-- 顶栏 -->
      <header class="layout-top-bar glass-effect">
        <!-- 切换按钮 -->
        <button class="icon-button" @click="toggleSidebar" title="切换侧边栏">
          <svg class="icon-svg" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        <div class="top-bar-middle"></div>

        <!-- 搜索按钮 -->
        <button class="icon-button" title="搜索">
          <svg class="icon-svg" viewBox="0 0 24 24">
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
        </button>
      </header>

      <!-- 内容投影区 -->
      <main class="layout-content-area">
        <slot />
      </main>

      <!-- 底栏 -->
      <footer class="layout-bottom-bar glass-effect">
        <div class="bottom-nav-item active">
          <svg class="bottom-icon" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span class="bottom-text">首页</span>
        </div>
        <div class="bottom-nav-item">
          <svg class="bottom-icon" viewBox="0 0 24 24">
            <!-- 统一采用简洁通用图表示意该业务分界线 -->
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
            />
          </svg>
          <span class="bottom-text">入口二</span>
        </div>
        <div class="bottom-nav-item">
          <svg class="bottom-icon" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
            />
          </svg>
          <span class="bottom-text">入口三</span>
        </div>
        <div class="bottom-nav-item">
          <svg class="bottom-icon" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
            />
          </svg>
          <span class="bottom-text">入口四</span>
        </div>
      </footer>
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

/* 毛玻璃效果 */
.glass-effect {
  background-color: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* 侧边栏样式 */
.layout-sidebar {
  width: 240px;
  height: 100%;
  border-right: 1px solid rgba(0, 0, 0, 0.04);
  transition:
    width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  z-index: 20;
}

/* 侧边栏折叠 */
.sidebar-collapsed {
  width: 0;
  overflow: hidden;
  border-right: none;
}

/* 窄屏适配 */
@media (max-width: 768px) {
  .layout-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
    transform: translateX(0);
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }

  .layout-sidebar.sidebar-collapsed {
    width: 280px;
    transform: translateX(-100%);
  }
}

/* 主内容容器 */
.layout-main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 顶栏样式 */
.layout-top-bar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  z-index: 10;
  flex-shrink: 0;
}

/* 顶栏中间间距 */
.top-bar-middle {
  flex: 1;
}

/* 图标按钮 */
.icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition:
    background-color 0.25s ease,
    transform 0.2s ease;
}

.icon-button:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.icon-button:active {
  transform: scale(0.92);
}

.icon-svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

/* 内容区域 */
.layout-content-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scroll-behavior: smooth;
}

/* 底栏样式 */
.layout-bottom-bar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  z-index: 10;
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 宽屏隐藏底栏 */
@media (min-width: 768px) {
  .layout-bottom-bar {
    display: none;
  }
}

/* 底栏图标项 */
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 4px 12px;
  border-radius: 8px;
}

/* 激活和悬浮状态 */
.bottom-nav-item:hover,
.bottom-nav-item.active {
  color: #ff5a5f;
}

/* 底部图标 */
.bottom-icon {
  width: 22px;
  height: 22px;
  margin-bottom: 3px;
  fill: currentColor;
}
</style>
