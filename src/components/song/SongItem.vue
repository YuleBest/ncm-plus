<script setup lang="ts">
import { MoreVertical } from 'lucide-vue-next'
import { formatDuration } from '@/utils/format'

/**
 * SongItem — 统一歌曲行组件
 *
 * 两种布局模式，由 props 自动决定：
 *  - 封面模式（coverUrl 存在）：左侧显示专辑封面，右侧可选 "更多" 按钮
 *  - 序号模式（index 存在）   ：左侧显示行序号，右侧可选时长
 */
withDefaults(
  defineProps<{
    /** 歌曲名 */
    name: string
    /** 歌手名（已格式化，如 "周杰伦 / 方文山"） */
    artistText: string
    /** 专辑名（可选，显示在歌手后面） */
    albumName?: string
    /** 歌曲别名列表，取第一条展示 */
    alia?: string[]
    /** 专辑封面 URL（存在时进入封面模式） */
    coverUrl?: string
    /** 行序号（无封面时展示，从 1 起） */
    index?: number
    /** 时长（毫秒），传入时右侧显示时长 */
    durationMs?: number
    /** 是否为 VIP 歌曲 */
    isVip?: boolean
    /** 是否正在播放（高亮行） */
    playing?: boolean
    /** 右侧是否显示"更多"按钮 */
    showMore?: boolean
  }>(),
  {
    albumName: undefined,
    alia: undefined,
    coverUrl: undefined,
    index: undefined,
    durationMs: undefined,
    isVip: false,
    playing: false,
    showMore: false,
  },
)

defineEmits<{
  (e: 'click'): void
  (e: 'more-click'): void
}>()
</script>

<template>
  <div
    class="song-item"
    :class="{
      playing,
      'has-cover': !!coverUrl,
      'has-index': index !== undefined && !coverUrl,
    }"
    @click="$emit('click')"
  >
    <!-- ── 左侧：封面 or 序号 ──────────────────────────────── -->
    <div class="song-left">
      <!-- 封面模式 -->
      <div v-if="coverUrl" class="cover-wrapper">
        <img :src="coverUrl" alt="" loading="lazy" class="cover-img" />
        <!-- 正在播放时显示音波动画 -->
        <div v-if="playing" class="playing-indicator" aria-hidden="true">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </div>
      </div>

      <!-- 序号模式 -->
      <div v-else-if="index !== undefined" class="song-index">
        <span v-if="playing" class="index-playing">♫</span>
        <span v-else>{{ index }}</span>
      </div>
    </div>

    <!-- ── 中间：歌曲信息 ──────────────────────────────────── -->
    <div class="song-meta">
      <!-- 第一行：歌名 + 别名 + VIP -->
      <div class="name-row">
        <span class="song-name">{{ name }}</span>
        <span v-if="alia?.length" class="song-alia">({{ alia[0] }})</span>
        <span v-if="isVip" class="vip-badge">VIP</span>
      </div>

      <!-- 第二行：歌手 / 专辑 -->
      <div class="meta-row">
        <span class="artist-text">{{ artistText }}</span>
        <template v-if="albumName">
          <span class="meta-sep">—</span>
          <span class="album-text">{{ albumName }}</span>
        </template>
      </div>
    </div>

    <!-- ── 右侧：时长 or 更多按钮 ─────────────────────────── -->
    <div class="song-right">
      <span v-if="durationMs !== undefined" class="duration">
        {{ formatDuration(durationMs) }}
      </span>
      <button
        v-if="showMore"
        class="more-btn icon-button"
        @click.stop="$emit('more-click')"
        title="更多"
      >
        <MoreVertical :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ── 行容器 ───────────────────────────────────────────────── */
.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  user-select: none;

  &:hover {
    background-color: var(--color-surface-hover);
  }

  &:active {
    background-color: var(--color-surface-active);
  }

  /* 播放中：歌名高亮 */
  &.playing .song-name {
    color: var(--color-primary);
    font-weight: 600;
  }
}

/* ── 左侧 ─────────────────────────────────────────────────── */
.song-left {
  flex-shrink: 0;
}

/* 专辑封面 */
.cover-wrapper {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--color-bg-sunken);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 正在播放时的音波遮罩 */
.playing-indicator {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  padding-bottom: 8px;

  .bar {
    display: block;
    width: 3px;
    border-radius: 2px;
    background: var(--color-primary);
    animation: eq-bar 0.8s ease-in-out infinite alternate;

    &:nth-child(1) {
      height: 10px;
      animation-delay: 0s;
    }
    &:nth-child(2) {
      height: 16px;
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      height: 8px;
      animation-delay: 0.4s;
    }
  }
}

@keyframes eq-bar {
  from {
    transform: scaleY(0.4);
  }
  to {
    transform: scaleY(1);
  }
}

/* 行序号 */
.song-index {
  width: 36px;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-tertiary);
  transition: color var(--transition-base);
  font-variant-numeric: tabular-nums;

  .index-playing {
    color: var(--color-primary);
    font-size: 16px;
  }
}

/* ── 歌曲信息（中间弹性区） ───────────────────────────────── */
.song-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* 第一行 */
.name-row {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
}

.song-name {
  font-size: 15px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
  transition: color var(--transition-base);
}

.song-alia {
  font-size: 13px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
  transition: color var(--transition-base);
}

.vip-badge {
  font-size: 9px;
  font-weight: 700;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 0 3px;
  border-radius: 3px;
  line-height: 1.6;
  flex-shrink: 0;
  opacity: 0.85;
}

/* 第二行 */
.meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
}

.artist-text,
.album-text {
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-base);
}

.artist-text {
  flex-shrink: 1;
  min-width: 0;
}

.album-text {
  flex-shrink: 2;
  min-width: 0;
}

.meta-sep {
  font-size: 12px;
  color: var(--color-text-placeholder);
  flex-shrink: 0;
}

/* ── 右侧 ─────────────────────────────────────────────────── */
.song-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.duration {
  font-size: 13px;
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
  min-width: 42px;
  text-align: right;
  transition: color var(--transition-base);
}

.more-btn {
  opacity: 0.5;
  border-radius: 50%;
  transition:
    opacity var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    opacity: 1;
  }
}

/* ── 响应式 ───────────────────────────────────────────────── */
@media (min-width: 768px) {
  .cover-wrapper {
    width: 50px;
    height: 50px;
    border-radius: var(--radius-md);
  }

  .song-name {
    font-size: 15px;
  }
}

@media (max-width: 768px) {
  .song-item {
    padding: 10px 12px;
    gap: 10px;
  }

  .duration {
    display: none;
  }
}
</style>
