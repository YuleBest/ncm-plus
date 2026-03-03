<script setup lang="ts">
defineOptions({ name: 'PlaylistDetailPage' })
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlaylistDetail, type PlaylistDetail } from '@/api/playlist/detail'
import { getPlaylistTracks } from '@/api/playlist/track/all'
import type { SongDetail } from '@/api/song/detail'
import { usePlayerStore } from '@/stores/player'
import { PlayCircle, Play, ChevronLeft } from 'lucide-vue-next'
import HomeLayout from '@/layouts/Home.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import SongItem from '@/components/song/SongItem.vue'
import { formatPlayCount } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

// 响应式参数：路由切换时自动更新
const PAGE_SIZE = 50

const playlistId = computed(() => (route.params as Record<string, string>).id ?? '')
const isLoading = ref(true)
const isLoadingMore = ref(false)
const playlistInfo = ref<PlaylistDetail | null>(null)
const completeTracks = ref<SongDetail[]>([])
const currentOffset = ref(0)
const hasMore = ref(false)

const fetchPlaylistData = async () => {
  const id = playlistId.value
  if (!id) return

  // 每次加载前先清空旧数据，避免短暂显示上一个歌单的内容
  playlistInfo.value = null
  completeTracks.value = []
  currentOffset.value = 0
  hasMore.value = false

  try {
    isLoading.value = true
    const detailRes = await getPlaylistDetail({ id })
    if (!detailRes.data?.playlist) throw new Error('无法获取歌单详情')

    playlistInfo.value = detailRes.data.playlist
    const totalCount = playlistInfo.value.trackCount ?? 0

    if (totalCount > 0) {
      const res = await getPlaylistTracks({ id: Number(id), limit: PAGE_SIZE, offset: 0 })
      if (res.data?.songs) {
        completeTracks.value = res.data.songs
        currentOffset.value = res.data.songs.length
        hasMore.value = currentOffset.value < totalCount
      }
    }
  } catch (error) {
    console.error('Failed to load playlist:', error)
  } finally {
    isLoading.value = false
  }
}

const loadMoreTracks = async () => {
  const id = playlistId.value
  if (!id || isLoadingMore.value || !hasMore.value) return

  try {
    isLoadingMore.value = true
    const totalCount = playlistInfo.value?.trackCount ?? 0
    const res = await getPlaylistTracks({
      id: Number(id),
      limit: PAGE_SIZE,
      offset: currentOffset.value,
    })
    if (res.data?.songs) {
      completeTracks.value.push(...res.data.songs)
      currentOffset.value += res.data.songs.length
      hasMore.value = currentOffset.value < totalCount
    }
  } catch (error) {
    console.error('Failed to load more tracks:', error)
  } finally {
    isLoadingMore.value = false
  }
}

const playAll = () => {
  if (completeTracks.value.length > 0) {
    playerStore.playList(completeTracks.value, 0)
  }
}

const playSong = (index: number) => {
  playerStore.playList(completeTracks.value, index)
}

const goBack = () => {
  router.back()
}

// 监听路由参数变化，immediate: true 保证首次进入也触发
// 即使将来被放回 keep-alive，切换歌单时也能正确刷新
watch(
  playlistId,
  (id) => {
    if (id) fetchPlaylistData()
  },
  { immediate: true },
)
</script>

<template>
  <HomeLayout>
    <div class="playlist-page" :class="{ 'is-loading': isLoading }">
      <!-- 动态模糊背景 -->
      <div
        v-if="playlistInfo"
        class="bg-blur"
        :style="{ backgroundImage: `url(${playlistInfo.coverImgUrl}?param=30y30)` }"
      ></div>
      <!-- 遮罩层：颜色跟随主题 -->
      <div v-if="playlistInfo" class="bg-mask"></div>

      <!-- 加载状态 -->
      <LoadingSpinner v-if="isLoading" text="加载歌单中..." :size="36" class="page-loading" />

      <div v-else-if="playlistInfo" class="playlist-content">
        <!-- 导航栏 -->
        <div class="nav-header">
          <button class="nav-back-btn icon-button" @click="goBack" title="返回">
            <ChevronLeft :size="22" />
          </button>
          <span class="nav-title">歌单</span>
        </div>

        <!-- 歌单信息头部 -->
        <div class="playlist-info-header">
          <div class="cover-section">
            <div class="cover-wrapper">
              <img
                :src="playlistInfo.coverImgUrl + '?param=300y300'"
                alt="cover"
                class="cover-img"
              />
            </div>
            <!-- 移出 overflow:hidden 的 cover-wrapper，避免 backdrop-filter 被截断 -->
            <div class="play-count">
              <PlayCircle :size="11" class="play-count-icon" />
              {{ formatPlayCount(playlistInfo.playCount) }}
            </div>
          </div>

          <div class="info-section">
            <h1 class="title">{{ playlistInfo.name }}</h1>
            <div class="creator-box">
              <img
                :src="playlistInfo.creator?.avatarUrl + '?param=60y60'"
                alt="avatar"
                class="avatar"
              />
              <span class="nickname">{{ playlistInfo.creator?.nickname }}</span>
              <span v-if="playlistInfo.tags?.length" class="tag-divider">·</span>
              <span v-if="playlistInfo.tags?.length" class="tags">{{ playlistInfo.tags[0] }}</span>
            </div>
            <div class="desc-box">
              <p class="desc-text">{{ playlistInfo.description || '暂无简介' }}</p>
            </div>
          </div>
        </div>

        <!-- 歌曲列表主容器 -->
        <div class="track-list-sheet">
          <!-- 播放全部吸顶头 -->
          <div class="play-all-header" @click="playAll">
            <div class="play-icon-box">
              <Play :size="14" color="#fff" fill="#fff" />
            </div>
            <div class="play-text">
              <span class="main">播放全部</span>
              <span class="count">{{ playlistInfo.trackCount ?? completeTracks.length }} 首</span>
            </div>
          </div>

          <!-- 列表区 -->
          <div v-if="completeTracks.length === 0" class="empty-tracks">暂无歌曲</div>
          <div v-else class="tracks-list">
            <SongItem
              v-for="(song, index) in completeTracks"
              :key="song.id"
              :name="song.name"
              :artist-text="song.ar?.map((a) => a.name).join(' / ') ?? ''"
              :album-name="song.al?.name"
              :alia="song.alia"
              :cover-url="song.al?.picUrl + '?param=50y50'"
              :is-vip="song.fee === 1"
              :playing="playerStore.currentSong?.id === song.id"
              :show-more="true"
              @click="playSong(index)"
            />
          </div>

          <!-- 加载更多 -->
          <div v-if="hasMore || isLoadingMore" class="load-more-area">
            <button class="load-more-btn" :disabled="isLoadingMore" @click="loadMoreTracks">
              <span v-if="isLoadingMore" class="load-more-spinner"></span>
              <span>{{
                isLoadingMore
                  ? '加载中...'
                  : `加载更多（已加载 ${completeTracks.length} / ${playlistInfo?.trackCount ?? '?'} 首）`
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
/* ── 页面容器 ─────────────────────────────────────────────── */
.playlist-page {
  position: relative;
  min-height: 100%;
  padding-bottom: 100px;
  overflow-x: hidden;

  &.is-loading {
    background-color: var(--color-bg);
  }
}

/* ── 模糊背景 ─────────────────────────────────────────────── */
.bg-blur {
  position: fixed;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background-size: cover;
  background-position: center;
  filter: blur(60px);
  opacity: 0.3;
  z-index: 0;
  transform: translateZ(0);
  will-change: filter;
  pointer-events: none;
}

.bg-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-glass-mask);
  z-index: 1;
  pointer-events: none;
  transition: background-color var(--transition-slow);
}

/* ── 加载状态 ─────────────────────────────────────────────── */
.page-loading {
  position: relative;
  z-index: 10;
  padding: 100px 0;
}

/* ── 内容层级 ─────────────────────────────────────────────── */
.playlist-content {
  position: relative;
  z-index: 10;
}

/* ── 导航栏 ───────────────────────────────────────────────── */
.nav-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 8px 0 4px;
  position: sticky;
  top: 0;
  z-index: 50;

  .nav-back-btn {
    margin-right: 4px;
    border-radius: var(--radius-full);
  }

  .nav-title {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text);
    transition: color var(--transition-base);
  }
}

/* ── 歌单头部信息 ─────────────────────────────────────────── */
.playlist-info-header {
  display: flex;
  padding: 8px 20px 24px;
  gap: 16px;
  align-items: flex-start;

  @media (min-width: 768px) {
    padding: 24px 40px 32px;
    gap: 28px;
  }
}

.cover-section {
  flex-shrink: 0;
  position: relative; /* 播放量角标绝对定位基准 */

  .cover-wrapper {
    width: 110px;
    height: 110px;
    border-radius: var(--radius-md);
    overflow: hidden;
    position: relative;
    box-shadow: var(--shadow-lg);

    @media (min-width: 768px) {
      width: 190px;
      height: 190px;
      border-radius: var(--radius-lg);
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  /* 定位相对于 .cover-section（非 cover-wrapper），脱离 overflow:hidden */
  .play-count {
    position: absolute;
    top: 5px;
    right: 6px;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    background: rgba(0, 0, 0, 0.45);
    padding: 2px 7px;
    border-radius: var(--radius-full);
    backdrop-filter: blur(6px) saturate(120%);
    -webkit-backdrop-filter: blur(6px) saturate(120%);
    pointer-events: none;
    z-index: 1;
  }
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 8px;
  padding-top: 2px;

  .title {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
    color: var(--color-text);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color var(--transition-base);

    @media (min-width: 768px) {
      font-size: 22px;
      -webkit-line-clamp: 2;
      line-clamp: 2;
    }
  }

  .creator-box {
    display: flex;
    align-items: center;
    gap: 6px;

    .avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
    }

    .nickname {
      font-size: 12px;
      color: var(--color-text-secondary);
      transition: color var(--transition-base);
    }

    .tag-divider {
      font-size: 12px;
      color: var(--color-text-placeholder);
    }

    .tags {
      font-size: 12px;
      color: var(--color-primary);
      font-weight: 500;
    }
  }

  .desc-box {
    .desc-text {
      font-size: 12px;
      margin: 0;
      line-height: 1.6;
      color: var(--color-text-tertiary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color var(--transition-base);

      @media (min-width: 768px) {
        font-size: 14px;
        -webkit-line-clamp: 3;
        line-clamp: 3;
      }
    }
  }
}

/* ── 歌曲列表卡片容器 ─────────────────────────────────────── */
.track-list-sheet {
  background-color: var(--color-bg);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  min-height: 50vh;
  position: relative;
  padding-bottom: 32px;
  box-shadow: var(--shadow-md);
  transition: background-color var(--transition-slow);
}

/* ── 播放全部固定头 ───────────────────────────────────────── */
.play-all-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  position: sticky;
  top: 56px;
  background-color: var(--color-bg);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  z-index: 40;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-subtle);
  transition:
    background-color var(--transition-slow),
    border-color var(--transition-base);

  &:hover {
    background-color: var(--color-bg-elevated);
  }

  @media (min-width: 768px) {
    padding: 18px 40px;
  }

  .play-icon-box {
    width: 30px;
    height: 30px;
    background-color: var(--color-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px var(--color-primary-dim);
    transition: background-color var(--transition-fast);
  }

  .play-text {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 8px;

    .main {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text);
      transition: color var(--transition-base);
    }

    .count {
      font-size: 12px;
      color: var(--color-text-tertiary);
      transition: color var(--transition-base);
    }
  }
}

/* ── 空列表 ───────────────────────────────────────────────── */
.empty-tracks {
  text-align: center;
  padding: 60px 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

/* ── 歌曲列表 ─────────────────────────────────────────────── */
.tracks-list {
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    /* 桌面端歌曲行左右增加缩进，与播放全部头对齐 */
    :deep(.song-item) {
      padding-left: 40px;
      padding-right: 40px;
    }
  }
}

/* ── 加载更多 ─────────────────────────────────────────────── */
.load-more-area {
  display: flex;
  justify-content: center;
  padding: 20px 20px 8px;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 24px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);

  &:hover:not(:disabled) {
    background-color: var(--color-bg-elevated);
    color: var(--color-text);
    border-color: var(--color-border-strong, var(--color-border));
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.load-more-spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── 加载动画（icon-spin 供 Loader2 使用） ─────────────────── */
.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
