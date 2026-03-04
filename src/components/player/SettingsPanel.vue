<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Settings } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const playerStore = usePlayerStore()

const offsetVal = ref(playerStore.lyricOffset)

watch(
  () => playerStore.lyricOffset,
  (val) => {
    offsetVal.value = val
  },
)

const handleOffsetChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const val = parseFloat(target.value)
  playerStore.setLyricOffset(val)
}

const resetOffset = () => {
  playerStore.setLyricOffset(0.2)
  offsetVal.value = 0.2
}
</script>

<template>
  <div class="settings-panel-overlay" :class="{ 'is-visible': visible }" @click="emit('close')">
    <div class="settings-panel" @click.stop>
      <div class="panel-header">
        <div class="header-left">
          <Settings :size="18" />
          <span class="mode-text">播放设置</span>
        </div>
        <div class="header-right">
          <button class="icon-btn" @click="emit('close')">
            <X :size="20" />
          </button>
        </div>
      </div>

      <div class="panel-content">
        <!-- 歌词时间调整 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">歌词时间调整</span>
            <span class="setting-desc">提前或延后歌词显示时间（秒）</span>
          </div>
          <div class="setting-control">
            <span class="val-text">{{ offsetVal > 0 ? '+' : '' }}{{ offsetVal.toFixed(1) }}s</span>
            <input
              type="range"
              min="-2.0"
              max="2.0"
              step="0.1"
              :value="offsetVal"
              @input="handleOffsetChange"
              class="range-slider"
            />
            <button class="reset-btn" @click="resetOffset" v-show="offsetVal !== 0.2">重置</button>
          </div>
        </div>

        <!-- 歌词大小调整 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">歌词字体大小</span>
            <span class="setting-desc">调整歌词显示的缩放倍数</span>
          </div>
          <div class="setting-control">
            <span class="val-text">{{ playerStore.lyricScale.toFixed(1) }}x</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              :value="playerStore.lyricScale"
              @input="
                (e) => playerStore.setLyricScale(parseFloat((e.target as HTMLInputElement).value))
              "
              class="range-slider"
            />
            <button
              class="reset-btn"
              @click="playerStore.setLyricScale(1.0)"
              v-show="playerStore.lyricScale !== 1.0"
            >
              重置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 600;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;

  &.is-visible {
    opacity: 1;
    pointer-events: auto;

    .settings-panel {
      transform: translateY(0);
    }
  }
}

.settings-panel {
  background-color: #2b2b2b;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
  color: #fff;
  padding-bottom: env(safe-area-inset-bottom);
}

.panel-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);

  .mode-text {
    font-size: 15px;
    font-weight: 500;
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.icon-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #fff;
  }
}

.panel-content {
  flex: 1;
  padding: 24px 20px;
  overflow-y: auto;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .setting-name {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
  }

  .setting-desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 16px;

  .val-text {
    font-size: 14px;
    color: #ff5a5f;
    min-width: 44px;
    text-align: right;
  }

  .range-slider {
    flex: 1;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    appearance: none;
    outline: none;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #ff5a5f;
      cursor: pointer;
    }
  }

  .reset-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
}
</style>
