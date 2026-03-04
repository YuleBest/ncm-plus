<script setup lang="ts">
import PlayPage from '@/pages/play.vue'
import { usePlayerStore } from '@/stores/player'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'

// 初始化主题 store，与 index.html 阻塞脚本写入的 class 同步
useThemeStore()

const playerStore = usePlayerStore()
const userStore = useUserStore()

onMounted(() => {
  userStore.checkLogin()
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="['IndexPage', 'SearchPage']">
      <component :is="Component" />
    </keep-alive>
  </router-view>

  <!-- Play 页作为独立 fixed 覆盖层，与 router-view 并列，互不干扰 -->
  <PlayPage v-if="playerStore.isPlayerOpen" />
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-bg);
  color: var(--color-text);
  transition:
    background-color var(--transition-base),
    color var(--transition-base);
}
</style>
