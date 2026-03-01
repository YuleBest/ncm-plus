<script setup lang="ts">
const modelValue = defineModel<string>()
</script>

<template>
  <input v-model="modelValue" class="base-input" v-bind="$attrs" />
</template>

<style scoped lang="scss">
.base-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  background-color: #fff;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(255, 90, 95, 0.1);
  }

  &:disabled {
    background-color: var(--background-color);
    cursor: not-allowed;
  }
}
</style>
