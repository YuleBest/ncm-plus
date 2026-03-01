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
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    opacity 0.2s;
  height: 44px; /* Default uniform height */

  &:hover:not(:disabled) {
    background-color: var(--primary-color);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
