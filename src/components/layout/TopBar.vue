<script setup lang="ts">
import { useRouter } from 'vue-router'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const goToSearch = () => {
  router.push('/search')
}
</script>

<template>
  <!-- 顶栏 -->
  <header class="layout-top-bar glass-effect">
    <!-- 切换按钮 -->
    <button class="icon-button" @click="$emit('toggle-sidebar')" title="切换侧边栏">
      <svg class="icon-svg" viewBox="0 0 24 24">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
      </svg>
    </button>

    <div class="top-bar-middle"></div>

    <!-- 搜索按钮 -->
    <button class="icon-button" title="搜索" @click="goToSearch">
      <svg class="icon-svg" viewBox="0 0 24 24">
        <path
          d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        />
      </svg>
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

/* 顶栏中间间距 */
.top-bar-middle {
  flex: 1;
}
</style>
