<script setup lang="ts">
defineOptions({ name: 'ArtistPage' })
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Play, Music2, Disc3, Video, Disc } from 'lucide-vue-next'
import { GetArtists, type GetArtistsResponse } from '@/api/artists'
import { getArtistAlbums, type ArtistAlbum } from '@/api/artist/album'
import { usePlayerStore } from '@/stores/player'
import { type SongDetail } from '@/api/song/detail'
import HomeLayout from '@/layouts/Home.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import SongItem from '@/components/song/SongItem.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const artistId = computed(() => Number((route.params as Record<string, string>).id))
const isLoading = ref(true)
const artistData = ref<GetArtistsResponse | null>(null)

const albums = ref<ArtistAlbum[]>([])
const isAlbumsLoading = ref(false)
const hasMoreAlbums = ref(false)
const albumsPage = ref(0)
const ALBUMS_LIMIT = 9
const activeTab = ref<'songs' | 'albums'>('songs')

const artistInfo = computed(() => artistData.value?.artist ?? null)
const hotSongs = computed(() => artistData.value?.hotSongs ?? [])

const tracksForPlayer = computed(() => hotSongs.value as unknown as SongDetail[])

// 别名 + 译名合并为一行副标题
const artistSubTitle = computed(() => {
  const parts: string[] = []
  if (artistInfo.value?.trans) parts.push(artistInfo.value.trans)
  if (artistInfo.value?.alias?.length) parts.push(...artistInfo.value.alias)
  return parts.join(' · ')
})

const fetchArtist = async () => {
  const id = artistId.value
  if (!id) return
  artistData.value = null
  isLoading.value = true
  try {
    const res = await GetArtists({ id })
    if (res.data) artistData.value = res.data
  } catch (err) {
    console.error('Failed to load artist:', err)
  } finally {
    isLoading.value = false
  }
}

const fetchAlbums = async (reset = false) => {
  const id = artistId.value
  if (!id) return
  if (reset) {
    albums.value = []
    albumsPage.value = 0
  }
  isAlbumsLoading.value = true
  try {
    const offset = albumsPage.value * ALBUMS_LIMIT
    const res = await getArtistAlbums({ id, limit: ALBUMS_LIMIT, offset })
    if (res.data?.hotAlbums) {
      albums.value = [...albums.value, ...res.data.hotAlbums]
      hasMoreAlbums.value = res.data.more
    }
  } catch (err) {
    console.error('Failed to load albums:', err)
  } finally {
    isAlbumsLoading.value = false
  }
}

const loadMoreAlbums = () => {
  albumsPage.value++
  fetchAlbums()
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

const goBack = () => router.back()

watch(
  artistId,
  (id) => {
    if (id) {
      fetchArtist()
      fetchAlbums(true)
    }
  },
  { immediate: true },
)
</script>

<template>
  <HomeLayout>
    <div class="artist-page" :class="{ 'is-loading': isLoading }">
      <!-- ── 全局模糊背景 ────────────────────────────────────── -->
      <template v-if="artistInfo?.picUrl">
        <div
          class="bg-blur"
          :style="{ backgroundImage: `url(${artistInfo.picUrl}?param=100y100)` }"
        ></div>
        <div class="bg-mask"></div>
      </template>

      <!-- ── 加载态 ──────────────────────────────────────────── -->
      <LoadingSpinner v-if="isLoading" text="加载歌手信息..." :size="36" class="page-loading" />

      <!-- ── 主体内容 ────────────────────────────────────────── -->
      <div v-else-if="artistInfo" class="artist-content">
        <!-- 导航栏 -->
        <div class="nav-header">
          <button class="nav-back-btn icon-button" @click="goBack" title="返回">
            <ChevronLeft :size="22" />
          </button>
          <span class="nav-title">歌手</span>
        </div>

        <!-- ────────────────────────────────────────────────────
             移动端：全宽横幅 + 渐变遮罩 + 信息叠层
             ──────────────────────────────────────────────── -->
        <div class="mobile-hero">
          <img
            v-if="artistInfo.picUrl"
            :src="artistInfo.picUrl + '?param=750y400'"
            alt=""
            class="hero-img"
          />
          <div v-else class="hero-img-fallback">
            <Music2 :size="52" />
          </div>
          <div class="hero-overlay"></div>
          <div class="hero-info">
            <h1 class="artist-name">{{ artistInfo.name }}</h1>
            <p v-if="artistSubTitle" class="artist-sub">{{ artistSubTitle }}</p>
          </div>
        </div>

        <!-- 移动端统计 + 简介 -->
        <div class="mobile-meta">
          <div class="artist-stats">
            <div class="stat-item">
              <Music2 :size="13" class="stat-icon" />
              <span class="stat-num">{{ artistInfo.musicSize }}</span>
              <span class="stat-label">单曲</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <Disc3 :size="13" class="stat-icon" />
              <span class="stat-num">{{ artistInfo.albumSize }}</span>
              <span class="stat-label">专辑</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <Video :size="13" class="stat-icon" />
              <span class="stat-num">{{ artistInfo.mvSize }}</span>
              <span class="stat-label">MV</span>
            </div>
          </div>
          <p v-if="artistInfo.briefDesc" class="brief-desc">{{ artistInfo.briefDesc }}</p>
        </div>

        <!-- ────────────────────────────────────────────────────
             PC端：左图右字并排布局
             ──────────────────────────────────────────────── -->
        <div class="desktop-header">
          <!-- 左：肖像图 -->
          <div class="portrait-wrap">
            <img
              v-if="artistInfo.picUrl"
              :src="artistInfo.picUrl + '?param=400y400'"
              alt=""
              class="portrait-img"
            />
            <div v-else class="portrait-fallback">
              <Music2 :size="52" />
            </div>
          </div>

          <!-- 右：信息区 -->
          <div class="desktop-info">
            <h1 class="artist-name">{{ artistInfo.name }}</h1>
            <p v-if="artistSubTitle" class="artist-sub">{{ artistSubTitle }}</p>

            <div class="artist-stats">
              <div class="stat-item">
                <Music2 :size="13" class="stat-icon" />
                <span class="stat-num">{{ artistInfo.musicSize }}</span>
                <span class="stat-label">单曲</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <Disc3 :size="13" class="stat-icon" />
                <span class="stat-num">{{ artistInfo.albumSize }}</span>
                <span class="stat-label">专辑</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <Video :size="13" class="stat-icon" />
                <span class="stat-num">{{ artistInfo.mvSize }}</span>
                <span class="stat-label">MV</span>
              </div>
            </div>

            <p v-if="artistInfo.briefDesc" class="brief-desc">{{ artistInfo.briefDesc }}</p>
          </div>
        </div>

        <!-- ── 标签页白板 ──────────────────────────────────────── -->
        <div class="content-sheet">
          <!-- Tab 导航 -->
          <div class="tab-bar">
            <!-- 播放全部按鈕（仅歌曲标签显示） -->
            <button
              v-if="activeTab === 'songs'"
              class="play-all-btn"
              @click.stop="playAll"
              title="播放全部"
            >
              <div class="play-icon-box">
                <Play :size="13" color="#fff" fill="#fff" />
              </div>
              全部播放
            </button>

            <div class="tab-list">
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'songs' }"
                @click="activeTab = 'songs'"
              >
                热门歌曲
                <span class="tab-count">{{ hotSongs.length }}</span>
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'albums' }"
                @click="activeTab = 'albums'"
              >
                专辑
                <span v-if="artistInfo?.albumSize" class="tab-count">{{
                  artistInfo.albumSize
                }}</span>
              </button>
            </div>
          </div>

          <!-- 歌曲列表 -->
          <div v-show="activeTab === 'songs'">
            <div v-if="hotSongs.length === 0" class="empty-tracks">暂无歌曲</div>
            <div v-else class="tracks-list">
              <SongItem
                v-for="(song, index) in hotSongs"
                :key="song.id"
                :name="song.name"
                :artist-text="song.ar?.map((a) => a.name).join(' / ') ?? ''"
                :album-name="song.al?.name"
                :alia="song.alia ?? undefined"
                :index="index + 1"
                :duration-ms="song.dt"
                :is-vip="song.fee === 1"
                :playing="playerStore.currentSong?.id === song.id"
                @click="playSong(index)"
              />
            </div>
          </div>

          <!-- 专辑列表 -->
          <div v-show="activeTab === 'albums'" class="album-panel">
            <LoadingSpinner v-if="isAlbumsLoading && albums.length === 0" text="加载专辑..." />

            <div v-else-if="albums.length > 0" class="album-grid">
              <div
                v-for="album in albums"
                :key="album.id"
                class="album-card"
                @click="router.push(`/album/${album.id}`)"
              >
                <div class="album-cover-wrap">
                  <img
                    :src="album.picUrl + '?param=300y300'"
                    :alt="album.name"
                    class="album-cover"
                    loading="lazy"
                  />
                </div>
                <!-- 移出 overflow:hidden 容器，避免 backdrop-filter 被截断 -->
                <div class="album-type-tag">{{ album.subType || album.type }}</div>
                <div class="album-info">
                  <p class="album-name" :title="album.name">{{ album.name }}</p>
                  <p class="album-meta">
                    {{ new Date(album.publishTime).getFullYear() }}
                    <template v-if="album.company"> · {{ album.company }}</template>
                  </p>
                </div>
              </div>
            </div>

            <div v-else-if="!isAlbumsLoading" class="empty-albums">暂无专辑</div>

            <button
              v-if="hasMoreAlbums && !isAlbumsLoading"
              class="load-more-btn"
              @click="loadMoreAlbums"
            >
              加载更多专辑
            </button>
            <LoadingSpinner v-if="isAlbumsLoading && albums.length > 0" text="加载中..." />
          </div>
        </div>
      </div>

      <!-- ── 错误态 ──────────────────────────────────────────── -->
      <div v-else class="error-state">
        <p>歌手信息加载失败</p>
        <button class="retry-btn" @click="fetchArtist">重试</button>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
/* ── 页面容器 ─────────────────────────────────────────────── */
.artist-page {
  position: relative;
  min-height: 100%;
  padding-bottom: 100px;
  overflow-x: hidden;

  &.is-loading {
    background-color: var(--color-bg);
  }
}

/* ── 全局模糊背景 ─────────────────────────────────────────── */
.bg-blur {
  position: fixed;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background-size: cover;
  background-position: center top;
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

/* ── 加载 ─────────────────────────────────────────────────── */
.page-loading {
  position: relative;
  z-index: 10;
  padding: 120px 0;
}

/* ── 内容层 ───────────────────────────────────────────────── */
.artist-content {
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

/* ══════════════════════════════════════════════════════════
   移动端：全宽横幅（>768px 时隐藏）
   ══════════════════════════════════════════════════════════ */
.mobile-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: var(--color-bg-sunken);
  margin-top: -56px; /* 向上延伸，覆盖导航栏高度，造成沉浸感 */

  @media (min-width: 769px) {
    display: none;
  }

  .hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
  }

  .hero-img-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-tertiary);
    background: linear-gradient(135deg, var(--color-bg-sunken), var(--color-bg-elevated));
  }

  /* 底部渐变遮罩，保证文字可读 */
  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.12) 0%,
      rgba(0, 0, 0, 0) 28%,
      rgba(0, 0, 0, 0.5) 70%,
      rgba(0, 0, 0, 0.85) 100%
    );
  }

  /* 叠在图片底部的文字 */
  .hero-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 20px 16px;
  }
}

/* 移动端统计栏 + 简介（>768px 时隐藏） */
.mobile-meta {
  padding: 12px 20px 4px;

  @media (min-width: 769px) {
    display: none;
  }
}

/* ══════════════════════════════════════════════════════════
   PC端：并排布局（≤768px 时隐藏）
   ══════════════════════════════════════════════════════════ */
.desktop-header {
  display: none;

  @media (min-width: 769px) {
    display: flex;
    align-items: flex-start;
    gap: 28px;
    padding: 20px 40px 28px;
  }
}

/* 左侧：肖像图 */
.portrait-wrap {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background-color: var(--color-bg-sunken);

  .portrait-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
  }

  .portrait-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-tertiary);
    background: linear-gradient(135deg, var(--color-bg-sunken), var(--color-bg-elevated));
  }
}

/* 右侧：文字信息 */
.desktop-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

/* ── 公共：歌手名 / 副标题 ────────────────────────────────── */
.artist-name {
  margin: 0;
  font-weight: 800;
  line-height: 1.2;

  /* 移动端：白色叠在图片上 */
  .mobile-hero & {
    font-size: 26px;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
    margin-bottom: 4px;
  }

  /* PC端：跟随主题色 */
  .desktop-info & {
    font-size: 30px;
    color: var(--color-text);
    transition: color var(--transition-base);
  }
}

.artist-sub {
  margin: 0;
  font-size: 13px;

  .mobile-hero & {
    color: rgba(255, 255, 255, 0.65);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
  }

  .desktop-info & {
    color: var(--color-text-tertiary);
    transition: color var(--transition-base);
  }
}

/* ── 统计栏（移动端 + PC端公共样式） ─────────────────────── */
.artist-stats {
  display: flex;
  align-items: center;

  /* 移动端：居中排列 */
  .mobile-meta & {
    justify-content: center;
    padding: 2px 0 0;
  }

  /* PC端：左对齐 */
  .desktop-info & {
    justify-content: flex-start;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 16px;

  &:first-child {
    padding-left: 0;
  }

  .mobile-meta & {
    flex: 1;
    justify-content: center;
    padding: 0;
  }

  .stat-icon {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .stat-num {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text);
    transition: color var(--transition-base);
  }

  .stat-label {
    font-size: 12px;
    color: var(--color-text-tertiary);
    transition: color var(--transition-base);
  }
}

.stat-divider {
  width: 1px;
  height: 18px;
  background-color: var(--color-border);
  flex-shrink: 0;

  .desktop-info & {
    display: none;
  }
}

/* ── 简介 ─────────────────────────────────────────────────── */
.brief-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--color-text-secondary);
  transition: color var(--transition-base);

  /* 移动端：最多显示 3 行，可展开（此处先限制行数） */
  .mobile-meta & {
    margin-top: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* PC端：最多 4 行 */
  .desktop-info & {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* ── 标签页白板 ────────────────────────────────────────────── */
.content-sheet {
  background-color: var(--color-bg);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  min-height: 50vh;
  padding-bottom: 32px;
  box-shadow: var(--shadow-md);
  transition: background-color var(--transition-slow);
  margin-top: 4px;
}

/* ── Tab 导航栏 ────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  position: sticky;
  top: 56px;
  background-color: var(--color-bg);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border-bottom: 1px solid var(--color-border-subtle);
  z-index: 40;
  transition:
    background-color var(--transition-slow),
    border-color var(--transition-base);

  @media (min-width: 769px) {
    padding: 14px 40px;
    top: 0;
  }
}

/* 播放全部按钮 */
.play-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px 6px 8px;
  border: none;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);

  &:hover {
    background-color: var(--color-primary-hover);
  }
  &:active {
    transform: scale(0.96);
  }

  .play-icon-box {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

/* Tab 标签列表 */
.tab-list {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: flex-end;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-text);
  }

  &.active {
    background-color: var(--color-primary-dim);
    color: var(--color-primary);
    font-weight: 600;
  }

  .tab-count {
    font-size: 11px;
    opacity: 0.7;
    font-weight: 400;
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
}

/* ── 专辑面板 ─────────────────────────────────────────────── */
.album-panel {
  padding: 20px 16px 32px;

  @media (min-width: 769px) {
    padding: 20px 40px 40px;
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
/* ── 右栏：专辑区块 ─────────────────────────────────────────────── */
.album-section {
  padding: 24px 20px 32px;
  background-color: var(--color-bg);
  transition: background-color var(--transition-slow);

  @media (min-width: 769px) {
    flex: 1;
    min-width: 0;
    padding: 20px 24px 40px;
    background-color: var(--color-bg-elevated);
    border-radius: 0 var(--radius-xl) 0 0;
    min-height: 60vh;
    box-shadow: var(--shadow-md);
  }
}

.album-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 18px;
  transition: color var(--transition-base);

  .album-section-icon {
    color: var(--color-primary);
  }
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px 16px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px 10px;
  }
}

.album-card {
  position: relative; /* 类型标签绝对定位基准 */
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: transform 0.22s ease;

  &:hover {
    transform: translateY(-4px);

    .album-cover-wrap {
      box-shadow: var(--shadow-lg);
    }

    .album-cover {
      transform: scale(1.06);
    }
  }

  &:active {
    transform: translateY(-2px) scale(0.98);
  }
}

.album-cover-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 8px;
  background-color: var(--color-bg-sunken);
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--transition-base);
}

.album-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

/* 定位相对于 .album-card（非 cover-wrap），脱离 overflow:hidden */
.album-type-tag {
  position: absolute;
  bottom: 6px;
  left: 6px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  backdrop-filter: blur(6px) saturate(120%);
  -webkit-backdrop-filter: blur(6px) saturate(120%);
  line-height: 1.5;
  pointer-events: none;
  z-index: 1;
}

.album-info {
  padding: 0 2px;
}

.album-name {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-base);
}

.album-meta {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-base);
}

.empty-albums {
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.load-more-btn {
  display: block;
  margin: 20px auto 0;
  padding: 8px 24px;
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
</style>
