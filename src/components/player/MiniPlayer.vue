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
</script>

<template>
  <Transition name="mp">
    <div class="mini-player" v-if="playerStore.currentSong" @click="goDetail">
      <!-- 封面 -->
      <div class="mp-cover" :class="{ rotating: playerStore.isPlaying }">
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

        <button class="ctrl-btn play-btn" @click.stop="playerStore.togglePlay" title="播放/暂停">
          <Loader2 v-if="playerStore.isLoading" :size="20" class="icon-spin" />
          <Pause v-else-if="playerStore.isPlaying" :size="20" fill="currentColor" />
          <Play v-else :size="20" fill="currentColor" class="play-icon" />
        </button>

        <button
          class="ctrl-btn"
          @click.stop="playerStore.nextSong"
          :disabled="!canSkip"
          title="下一首"
        >
          <SkipForward :size="17" />
        </button>
      </div>

      <!-- 底部进度条 -->
      <div class="mp-progress">
        <div class="mp-progress-fill" :style="{ width: progressPercent + '%' }" />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
/* ── 容器 ─────────────────────────────────────────────────── */
.mini-player {
  position: absolute;
  bottom: 72px; /* 移动端：BottomBar(60px) + 12px 间距 */
  left: 12px;
  right: 12px;
  height: 64px;
  border-radius: 18px;
  overflow: hidden;

  display: flex;
  align-items: center;
  padding: 0 6px 0 8px;
  gap: 10px;

  cursor: pointer;
  z-index: 100;

  background-color: var(--color-glass);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--color-glass-border);
  box-shadow: var(--shadow-md), var(--shadow-inset-top);

  transition:
    box-shadow 0.2s ease,
    background-color var(--transition-base),
    border-color var(--transition-base),
    bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: var(--shadow-lg), var(--shadow-inset-top);
  }

  &:active {
    transform: scale(0.985);
  }
}

/* ── 封面 ─────────────────────────────────────────────────── */
.mp-cover {
  width: 44px;
  height: 44px;
  border-radius: 50%;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: spin 10s linear infinite;
}

.icon-spin {
  animation: spin 1s linear infinite;
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

  /* Play 图标居中微调 */
  .play-icon {
    translate: 1px 0;
  }

  /* 播放/暂停按钮：更大更突出 */
  &.play-btn {
    width: 40px;
    height: 40px;
    background-color: var(--color-surface-hover);

    &:hover {
      background-color: var(--color-surface-active);
    }
  }
}

/* ── 进度条 ───────────────────────────────────────────────── */
.mp-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: var(--color-border);

  .mp-progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 0 1px 1px 0;
    transition: width 0.5s linear;
  }
}

/* ── 宽屏布局 ─────────────────────────────────────────────── */
@media (min-width: 768px) {
  .mini-player {
    bottom: 20px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: min(480px, calc(100% - 32px));

    /* 宽屏 active 需叠加 translateX(-50%) */
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
