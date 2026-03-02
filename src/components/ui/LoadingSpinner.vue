<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
    size?: number
  }>(),
  {
    text: '',
    size: 32,
  },
)
</script>

<template>
  <div class="loading-spinner">
    <div
      class="spinner"
      :style="{ width: size + 'px', height: size + 'px', borderWidth: size / 10 + 'px' }"
    ></div>
    <span v-if="text" class="spinner-text">{{ text }}</span>
  </div>
</template>

<style scoped lang="scss">
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
}

.spinner {
  border-style: solid;
  border-color: var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  flex-shrink: 0;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: color var(--transition-base);
}
</style>
