<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="section-header">
    <h3 class="section-title">{{ title }}</h3>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.section-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  transition: color var(--transition-base);
}
</style>
