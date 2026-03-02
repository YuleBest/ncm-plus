<script setup lang="ts"></script>

<template>
  <button class="base-button" v-bind="$attrs">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  height: 44px;
  transition:
    background-color var(--transition-fast),
    opacity var(--transition-fast),
    transform 0.15s ease;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
