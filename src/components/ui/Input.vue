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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 16px;
  outline: none;
  background-color: var(--color-bg-elevated);
  color: var(--color-text);
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-base),
    color var(--transition-base),
    box-shadow var(--transition-fast);

  &::placeholder {
    color: var(--color-text-placeholder);
  }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-dim);
  }

  &:disabled {
    background-color: var(--color-bg-sunken);
    color: var(--color-text-tertiary);
    cursor: not-allowed;
  }
}
</style>
