<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Menu as iMenu, Search as iSearch, Home as iHome } from 'lucide-vue-next'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const goToSearch = () => {
  router.push('/search')
}
const goToHome = () => {
  router.push('/')
}
</script>

<template>
  <!-- 顶栏 -->
  <header class="layout-top-bar glass-effect">
    <div class="left-actions">
      <!-- 切换按钮 -->
      <button class="icon-button" @click="$emit('toggle-sidebar')" title="切换侧边栏">
        <iMenu />
      </button>

      <!-- 首页按钮 -->
      <button class="icon-button" @click="goToHome" title="回到首页">
        <iHome />
      </button>
    </div>

    <div class="top-bar-middle"></div>

    <!-- 搜索按钮 -->
    <button class="icon-button" title="搜索" @click="goToSearch">
      <iSearch />
    </button>
  </header>
</template>

<style scoped>
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

.left-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 顶栏中间间距 */
.top-bar-middle {
  flex: 1;
}
</style>
