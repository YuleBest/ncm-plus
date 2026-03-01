<script setup lang="ts">
import HomeLayout from '@/layouts/Home.vue'
</script>

<template>
  <HomeLayout>
    <div class="index-page">
      <div class="welcome-card">
        <h2>欢迎来到网易云音乐 Plus</h2>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
.index-page {
  padding: 8px;

  .welcome-card {
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}
</style>
