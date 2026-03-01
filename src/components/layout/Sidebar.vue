<script setup lang="ts">
defineProps<{
  collapsed: boolean
}>()
</script>

<template>
  <!-- 侧边栏 -->
  <aside class="layout-sidebar glass-effect" :class="{ 'sidebar-collapsed': collapsed }">
    <!-- 针对需求预留的侧边栏空位目前不挂载实质内容 -->
  </aside>
</template>

<style scoped>
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
</style>
