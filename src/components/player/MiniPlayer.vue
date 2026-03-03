<script setup lang="ts">
import { computed } from 'vue'
import { Play, Pause, Loader2, SkipForward, SkipBack } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()

const goDetail = () => {
  if (playerStore.currentSong) playerStore.openPlayer()
}

const progressPercent = computed(() => {
  if (!playerStore.duration) return 0
  return (playerStore.currentTime / playerStore.duration) * 100
})

const artistName = computed(() => playerStore.currentSong?.ar?.map((a) => a.name).join(' / ') ?? '')

const canSkip = computed(() => playerStore.playlist.length > 1)

// 环形进度参数
const RING_R = 20 // 圆半径（SVG 坐标系）
const RING_STROKE = 2.5 // 线宽
const circumference = computed(() => 2 * Math.PI * RING_R)
// dashoffset: 0 = 满圈，circumference = 零
const dashOffset = computed(() => circumference.value * (1 - progressPercent.value / 100))
</script>

<template>
  <Teleport to="body">
    <Transition name="mp">
      <div class="mini-player" v-if="playerStore.currentSong" @click="goDetail">
        <!-- 封面（静态圆角矩形） -->
        <div class="mp-cover">
          <img :src="playerStore.currentSong.al.picUrl + '?param=80y80'" alt="cover" />
        </div>

        <!-- 歌曲信息 -->
        <div class="mp-info">
          <p class="mp-name">{{ playerStore.currentSong.name }}</p>
          <p class="mp-artist" v-if="artistName">{{ artistName }}</p>
        </div>

        <!-- 控制按钮 -->
        <div class="mp-controls">
          <button
            class="ctrl-btn"
            @click.stop="playerStore.prevSong"
            :disabled="!canSkip"
            title="上一首"
          >
            <SkipBack :size="17" />
          </button>

          <!-- 播放/暂停 + 环形进度 -->
          <div class="play-ring-wrap" @click.stop="playerStore.togglePlay" title="播放/暂停">
            <!-- SVG 环形进度 -->
            <svg class="ring-svg" viewBox="0 0 48 48" aria-hidden="true">
              <!-- 轨道 -->
              <circle
                class="ring-track"
                cx="24"
                cy="24"
                :r="RING_R"
                fill="none"
                :stroke-width="RING_STROKE"
              />
              <!-- 进度 -->
              <circle
                class="ring-progress"
                cx="24"
                cy="24"
                :r="RING_R"
                fill="none"
                :stroke-width="RING_STROKE"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
                stroke-linecap="round"
                transform="rotate(-90 24 24)"
              />
            </svg>

            <!-- 图标 -->
            <div class="play-icon-wrap">
              <Loader2 v-if="playerStore.isLoading" :size="18" class="icon-spin" />
              <Pause v-else-if="playerStore.isPlaying" :size="18" fill="currentColor" />
              <Play v-else :size="18" fill="currentColor" class="play-icon" />
            </div>
          </div>

          <button
            class="ctrl-btn"
            @click.stop="playerStore.nextSong"
            :disabled="!canSkip"
            title="下一首"
          >
            <SkipForward :size="17" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
/* ── 容器 ─────────────────────────────────────────────────── */
.mini-player {
  position: absolute;
  bottom: 20px; /* BottomBar 已移除，统一为 20px */
  left: 12px;
  right: 12px;
  height: 64px;
  border-radius: 18px;
  /* 不写 overflow:hidden / clip-path，两者均会在 WebKit 上禁用子层的 backdrop-filter */

  display: flex;
  align-items: center;
  padding: 0 6px 0 8px;
  gap: 10px;

  cursor: pointer;
  z-index: 100;

  border: 1px solid var(--color-glass-border);
  box-shadow: var(--shadow-md), var(--shadow-inset-top);

  transition:
    box-shadow 0.2s ease,
    border-color var(--transition-base),
    bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* 毛玻璃层独立为 ::before */
  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 18px;
    background-color: var(--color-glass);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    transition: background-color var(--transition-base);
    pointer-events: none;
    z-index: -1;
  }

  &:hover {
    box-shadow: var(--shadow-lg), var(--shadow-inset-top);
  }

  &:active {
    transform: scale(0.985);
  }
}

/* ── 封面（静态圆角矩形） ─────────────────────────────────── */
.mp-cover {
  width: 44px;
  height: 44px;
  border-radius: 10px; /* 圆角矩形 */
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

/* ── 歌曲信息 ─────────────────────────────────────────────── */
.mp-info {
  flex: 1;
  min-width: 0;

  .mp-name {
    margin: 0 0 3px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    transition: color var(--transition-base);
  }

  .mp-artist {
    margin: 0;
    font-size: 12px;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    transition: color var(--transition-base);
  }
}

/* ── 控制按钮区 ───────────────────────────────────────────── */
.mp-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.ctrl-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text);

  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;

  transition:
    background-color var(--transition-fast),
    color var(--transition-base),
    opacity var(--transition-fast);

  &:hover:not(:disabled) {
    background-color: var(--color-surface-hover);
  }

  &:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  &:disabled {
    opacity: 0.28;
    cursor: default;
  }
}

/* ── 环形进度 + 播放按钮 ──────────────────────────────────── */
.play-ring-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 50%;

  &:hover .play-icon-wrap {
    background-color: var(--color-surface-active);
  }

  &:active .play-icon-wrap {
    transform: scale(0.92);
  }
}

.ring-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  .ring-track {
    stroke: var(--color-border);
  }

  .ring-progress {
    stroke: var(--color-primary);
    transition: stroke-dashoffset 0.5s linear;
  }
}

.play-icon-wrap {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: var(--color-surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);

  .play-icon {
    translate: 1px 0;
  }
}

/* ── Loading 旋转 ─────────────────────────────────────────── */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon-spin {
  animation: spin 1s linear infinite;
}

/* ── 宽屏布局 ─────────────────────────────────────────────── */
@media (min-width: 768px) {
  .mini-player {
    bottom: 20px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: min(480px, calc(100% - 32px));

    &:active {
      transform: translateX(-50%) scale(0.985);
    }
  }
}

/* ── 入场 / 退场动画 ──────────────────────────────────────── */
.mp-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.mp-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

/* 移动端：从下方弹入 */
.mp-enter-from,
.mp-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

/* 宽屏：保持 translateX(-50%) 叠加 */
@media (min-width: 768px) {
  .mp-enter-from,
  .mp-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(16px);
  }
}
</style>
