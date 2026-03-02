<script setup lang="ts"></script>

<template>
  <!-- 底栏 -->
  <footer class="layout-bottom-bar glass-effect">
    <div class="bottom-nav-item active">
      <svg class="bottom-icon" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
      <span class="bottom-text">首页</span>
    </div>
    <div class="bottom-nav-item">
      <svg class="bottom-icon" viewBox="0 0 24 24">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
        />
      </svg>
      <span class="bottom-text">入口二</span>
    </div>
    <div class="bottom-nav-item">
      <svg class="bottom-icon" viewBox="0 0 24 24">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
        />
      </svg>
      <span class="bottom-text">入口三</span>
    </div>
    <div class="bottom-nav-item">
      <svg class="bottom-icon" viewBox="0 0 24 24">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
        />
      </svg>
      <span class="bottom-text">入口四</span>
    </div>
  </footer>
</template>

<style scoped>
/* 底栏样式 */
.layout-bottom-bar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid var(--color-border-subtle);
  z-index: 10;
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 宽屏隐藏底栏 */
@media (min-width: 768px) {
  .layout-bottom-bar {
    display: none;
  }
}

/* 底栏图标项 */
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition-fast);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  gap: 3px;
}

/* 激活和悬浮状态 */
.bottom-nav-item:hover,
.bottom-nav-item.active {
  color: var(--color-primary);
}

/* 底部图标 */
.bottom-icon {
  width: 22px;
  height: 22px;
  fill: currentColor;
  transition: transform 0.2s ease;
}

.bottom-nav-item.active .bottom-icon {
  transform: scale(1.1);
}
</style>
