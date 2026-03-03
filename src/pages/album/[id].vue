<script setup lang="ts">
defineOptions({ name: 'AlbumDetailPage' })
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Play, Calendar, Building2, Disc } from 'lucide-vue-next'
import { getAlbumDetail, type Album, type Song } from '@/api/album'
import { usePlayerStore } from '@/stores/player'
import { type SongDetail } from '@/api/song/detail'
import HomeLayout from '@/layouts/Home.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import SongItem from '@/components/song/SongItem.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const albumId = computed(() => Number((route.params as Record<string, string>).id))
const isLoading = ref(true)
const albumInfo = ref<Album | null>(null)
const songs = ref<Song[]>([])

// Song[] 与 SongDetail[] 结构兼容，强转用于 playerStore
const tracksForPlayer = computed(() => songs.value as unknown as SongDetail[])

const publishYear = computed(() =>
  albumInfo.value ? new Date(albumInfo.value.publishTime).getFullYear() : '',
)

const artistName = computed(
  () =>
    albumInfo.value?.artists?.map((a) => a.name).join(' / ') ?? albumInfo.value?.artist?.name ?? '',
)

const fetchAlbum = async () => {
  const id = albumId.value
  if (!id) return
  albumInfo.value = null
  songs.value = []
  isLoading.value = true
  try {
    const res = await getAlbumDetail({ id })
    if (res.data?.album) {
      albumInfo.value = res.data.album
      songs.value = res.data.songs ?? []
    }
  } catch (err) {
    console.error('Failed to load album:', err)
  } finally {
    isLoading.value = false
  }
}

const playAll = () => {
  if (tracksForPlayer.value.length > 0) {
    playerStore.playList(tracksForPlayer.value, 0)
    playerStore.openPlayer()
  }
}

const playSong = (index: number) => {
  playerStore.playList(tracksForPlayer.value, index)
  playerStore.openPlayer()
}

watch(
  albumId,
  (id) => {
    if (id) fetchAlbum()
  },
  { immediate: true },
)
</script>

<template>
  <HomeLayout>
    <div class="album-page" :class="{ 'is-loading': isLoading }">
      <!-- 动态模糊背景 -->
      <template v-if="albumInfo">
        <div class="bg-blur" :style="{ backgroundImage: `url(${albumInfo.picUrl}?param=30y30)` }" />
        <div class="bg-mask" />
      </template>

      <!-- 加载态 -->
      <LoadingSpinner v-if="isLoading" text="加载专辑中..." :size="36" class="page-loading" />

      <div v-else-if="albumInfo" class="album-content">
        <!-- 导航栏 -->
        <div class="nav-header">
          <button class="nav-back-btn icon-button" @click="router.back()" title="返回">
            <ChevronLeft :size="22" />
          </button>
          <span class="nav-title">专辑</span>
        </div>

        <!-- 专辑头部信息 -->
        <div class="album-info-header">
          <!-- 封面 -->
          <div class="cover-section">
            <div class="cover-wrapper">
              <img :src="albumInfo.picUrl + '?param=400y400'" alt="cover" class="cover-img" />
            </div>
          </div>

          <!-- 文字信息 -->
          <div class="info-section">
            <!-- 专辑类型角标 -->
            <span v-if="albumInfo.subType" class="album-type-badge">
              <Disc :size="11" />
              {{ albumInfo.subType }}
            </span>

            <h1 class="title">{{ albumInfo.name }}</h1>

            <p v-if="(albumInfo.alias as string[] | undefined)?.length" class="alias">
              {{ (albumInfo.alias as string[]).join(' / ') }}
            </p>

            <!-- 歌手 -->
            <button
              class="artist-link"
              @click="router.push(`/artist/${albumInfo.artist?.id}`)"
              v-if="albumInfo.artist"
            >
              <img
                v-if="albumInfo.artist.picUrl"
                :src="albumInfo.artist.picUrl + '?param=60y60'"
                alt=""
                class="artist-avatar"
              />
              <span>{{ artistName }}</span>
            </button>

            <div class="meta-row">
              <span v-if="publishYear" class="meta-item">
                <Calendar :size="12" />
                {{ publishYear }}
              </span>
              <span v-if="albumInfo.company" class="meta-item">
                <Building2 :size="12" />
                {{ albumInfo.company }}
              </span>
              <span class="meta-item">{{ albumInfo.size }} 首</span>
            </div>

            <p v-if="albumInfo.description" class="desc-text">{{ albumInfo.description }}</p>
          </div>
        </div>

        <!-- 歌曲列表区 -->
        <div class="track-list-sheet">
          <!-- 播放全部吸顶头 -->
          <div class="play-all-header" @click="playAll">
            <div class="play-icon-box">
              <Play :size="14" color="#fff" fill="#fff" />
            </div>
            <div class="play-text">
              <span class="main">播放全部</span>
              <span class="count">{{ songs.length }} 首</span>
            </div>
          </div>

          <!-- 歌曲列表 -->
          <div v-if="songs.length === 0" class="empty-tracks">暂无歌曲</div>
          <div v-else class="tracks-list">
            <SongItem
              v-for="(song, index) in songs"
              :key="song.id"
              :name="song.name"
              :artist-text="
                (song.ar as Array<{ name: string }>)?.map((a) => a.name).join(' / ') ?? ''
              "
              :alia="song.alia?.length ? song.alia : undefined"
              :index="index + 1"
              :duration-ms="song.dt"
              :is-vip="song.fee === 1"
              :playing="playerStore.currentSong?.id === song.id"
              @click="playSong(index)"
            />
          </div>
        </div>
      </div>

      <!-- 错误态 -->
      <div v-else class="error-state">
        <p>专辑加载失败</p>
        <button class="retry-btn" @click="fetchAlbum">重试</button>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
/* ── 页面容器 ─────────────────────────────────────────────── */
.album-page {
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
  inset: 0;
  background-color: var(--color-glass-mask);
  z-index: 1;
  pointer-events: none;
  transition: background-color var(--transition-slow);
}

/* ── 加载态 ───────────────────────────────────────────────── */
.page-loading {
  position: relative;
  z-index: 10;
  padding: 100px 0;
}

/* ── 内容层 ───────────────────────────────────────────────── */
.album-content {
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

/* ── 头部信息区 ───────────────────────────────────────────── */
.album-info-header {
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

  .cover-wrapper {
    width: 120px;
    height: 120px;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-lg);

    @media (min-width: 768px) {
      width: 200px;
      height: 200px;
      border-radius: var(--radius-lg);
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }
}

.info-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 2px;
}

/* 专辑类型角标 */
.album-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-dim);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  width: fit-content;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
  color: var(--color-text);
  transition: color var(--transition-base);

  @media (min-width: 768px) {
    font-size: 26px;
  }
}

.alias {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-tertiary);
  transition: color var(--transition-base);
}

/* 歌手跳转链接 */
.artist-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-primary);
  }

  .artist-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
  }
}

/* 元信息行 */
.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  transition: color var(--transition-base);
}

.desc-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--color-text-tertiary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-base);

  @media (min-width: 768px) {
    font-size: 13px;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }
}

/* ── 歌曲列表区 ───────────────────────────────────────────── */
.track-list-sheet {
  background-color: var(--color-bg);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  min-height: 50vh;
  padding-bottom: 32px;
  box-shadow: var(--shadow-md);
  transition: background-color var(--transition-slow);
}

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

.empty-tracks {
  text-align: center;
  padding: 60px 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.tracks-list {
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    :deep(.song-item) {
      padding-left: 40px;
      padding-right: 40px;
    }
  }
}

/* ── 错误态 ───────────────────────────────────────────────── */
.error-state {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 100px 20px;
  font-size: 14px;
  color: var(--color-text-tertiary);

  .retry-btn {
    padding: 8px 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast);

    &:hover {
      background-color: var(--color-surface-hover);
      color: var(--color-text);
    }
  }
}
</style>
