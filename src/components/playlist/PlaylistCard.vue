<script setup lang="ts">
import { PlayCircle, Disc } from 'lucide-vue-next'
import { formatPlayCount } from '@/utils/format'

defineProps<{
  id: number
  name: string
  coverImgUrl: string
  playCount: number
  creatorNickname?: string
}>()

defineEmits<{
  (e: 'click', id: number): void
}>()
</script>

<template>
  <div class="playlist-card" @click="$emit('click', id)">
    <div class="cover-wrapper">
      <img :src="coverImgUrl + '?param=300y300'" :alt="name" class="cover-img" loading="lazy" />

      <!-- 播放量角标 -->
      <div class="play-count">
        <PlayCircle :size="11" class="count-icon" />
        {{ formatPlayCount(playCount) }}
      </div>

      <!-- 悬浮播放遮罩 -->
      <div class="play-overlay" aria-hidden="true">
        <PlayCircle :size="44" color="#fff" fill="rgba(0,0,0,0.25)" />
      </div>
    </div>

    <div class="playlist-info">
      <div class="playlist-name" :title="name">{{ name }}</div>
      <div v-if="creatorNickname" class="creator-name">
        <Disc :size="11" class="creator-icon" />
        {{ creatorNickname }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ── 卡片容器 ─────────────────────────────────────────────── */
.playlist-card {
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: transform 0.22s ease;

  &:hover {
    transform: translateY(-4px);

    .play-overlay {
      opacity: 1;
    }

    .cover-img {
      transform: scale(1.06);
    }

    .cover-wrapper {
      box-shadow: var(--shadow-lg);
    }
  }

  &:active {
    transform: translateY(-2px) scale(0.98);
  }
}

/* ── 封面区域 ─────────────────────────────────────────────── */
.cover-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 10px;
  background-color: var(--color-bg-sunken);
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--transition-base);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

/* ── 播放量角标 ───────────────────────────────────────────── */
.play-count {
  position: absolute;
  top: 6px;
  right: 7px;
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(0, 0, 0, 0.42);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  line-height: 1.6;

  .count-icon {
    flex-shrink: 0;
    opacity: 0.9;
  }
}

/* ── 悬浮遮罩 ─────────────────────────────────────────────── */
.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
}

/* ── 文字信息 ─────────────────────────────────────────────── */
.playlist-info {
  padding: 0 2px;
}

.playlist-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.45;
  margin-bottom: 4px;
  /* 两行省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-base);
}

.creator-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-base);

  .creator-icon {
    flex-shrink: 0;
    opacity: 0.7;
  }
}
</style>
