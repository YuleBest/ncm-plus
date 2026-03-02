<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlaylistDetail, type PlaylistDetail } from '@/api/playlist/detail'
import { getSongDetail, type SongDetail } from '@/api/song/songDetail'
import { usePlayerStore } from '@/stores/player'
import { PlayCircle, Play, Loader2, ChevronLeft, MoreVertical } from 'lucide-vue-next'
import HomeLayout from '@/layouts/Home.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const playlistId = (route.params as Record<string, string>).id as string | undefined
const isLoading = ref(true)
const playlistInfo = ref<PlaylistDetail | null>(null)
const completeTracks = ref<SongDetail[]>([])

const fetchPlaylistData = async () => {
  if (!playlistId) return

  try {
    isLoading.value = true
    // 1. 获取歌单详情，包含了基本的 info 和完整的 trackIds
    const detailRes = await getPlaylistDetail({ id: playlistId })
    if (!detailRes.data?.playlist) throw new Error('无法获取歌单详情')

    playlistInfo.value = detailRes.data.playlist
    const trackIdsObj = playlistInfo.value.trackIds || []

    // 2. 提取所有的 trackId，用逗号拼接
    const trackIds = trackIdsObj.map((t) => t.id)
    if (trackIds.length > 0) {
      // 鉴于网易云接口对单次获取的 ids 数量有限制，我们分批获取（这里为了简化先假设总量可一次获取，通常 500 首以内无问题，超过需切片）
      // 生产环境可以根据 trackIds.length > 500 做 slice 分批请求并 concat
      const chunks = []
      const chunkSize = 500
      for (let i = 0; i < trackIds.length; i += chunkSize) {
        chunks.push(trackIds.slice(i, i + chunkSize))
      }

      const requests = chunks.map((chunk) => getSongDetail({ ids: chunk.join(',') }))
      const responses = await Promise.all(requests)

      const allSongs: SongDetail[] = []
      responses.forEach((res) => {
        if (res.data?.songs) {
          allSongs.push(...res.data.songs)
        }
      })

      completeTracks.value = allSongs
    }
  } catch (error) {
    console.error('Failed to load playlist:', error)
  } finally {
    isLoading.value = false
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

// 格式化播放量
const formatPlayCount = (count: number) => {
  if (!count) return '0'
  if (count > 100000000) return (count / 100000000).toFixed(1) + '亿'
  if (count > 10000) return (count / 10000).toFixed(1) + '万'
  return count.toString()
}

onMounted(() => {
  if (playlistId) {
    fetchPlaylistData()
  }
})
</script>

<template>
  <HomeLayout>
    <div class="playlist-page" :class="{ 'is-loading': isLoading }">
      <!-- 动态模糊背景 -->
      <div
        v-if="playlistInfo"
        class="bg-blur"
        :style="{ backgroundImage: `url(${playlistInfo.coverImgUrl}?param=50y50)` }"
      ></div>

      <div v-if="isLoading" class="loading-state">
        <Loader2 class="icon-spin" :size="40" color="#666" />
        <span>加载歌单中...</span>
      </div>

      <div v-else-if="playlistInfo" class="playlist-content">
        <!-- 导航栏 (透明) -->
        <div class="nav-header">
          <button class="icon-button back-btn" @click="goBack" title="返回">
            <ChevronLeft color="#fff" />
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
              <div class="play-count">
                <PlayCircle :size="12" class="mr-1" />
                {{ formatPlayCount(playlistInfo.playCount) }}
              </div>
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
              <span v-if="playlistInfo.tags?.length" class="tag-divider">|</span>
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
              <Play :size="16" color="#fff" fill="#ff3a3a" />
            </div>
            <div class="play-text">
              <span class="main">播放全部</span>
              <span class="count">{{ completeTracks.length }}首</span>
            </div>
          </div>

          <!-- 列表区 -->
          <div v-if="completeTracks.length === 0" class="empty-tracks">暂无歌曲</div>
          <div v-else class="tracks-list">
            <div
              v-for="(song, index) in completeTracks"
              :key="song.id"
              class="track-item"
              :class="{ playing: playerStore.currentSong?.id === song.id }"
              @dblclick="playSong(index)"
              @click="playSong(index)"
            >
              <!-- 封面图 -->
              <div class="song-cover">
                <img :src="song.al?.picUrl + '?param=100y100'" alt="album" loading="lazy" />
              </div>

              <!-- 歌曲信息 -->
              <div class="song-meta">
                <div class="song-title-row">
                  <span class="name">{{ song.name }}</span>
                  <span class="alia" v-if="song.alia?.length">({{ song.alia[0] }})</span>
                </div>
                <div class="song-artist-row">
                  <span v-if="song.fee === 1" class="vip-badge">VIP</span>
                  <span class="artist-album">
                    {{ song.ar?.map((a) => a.name).join('/') }} - {{ song.al?.name }}
                  </span>
                </div>
              </div>

              <!-- 更多操作 -->
              <button class="more-btn">
                <MoreVertical :size="20" color="#999" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
/* 全局页面样式 */
.playlist-page {
  position: relative;
  min-height: 100vh;
  padding-bottom: 80px;
  overflow-x: hidden;
  margin: 0 auto;

  &.is-loading {
    background-color: #f7f9fc;
    color: #333;
  }
}

/* 内容层级提升 */
.playlist-content,
.loading-state {
  position: relative;
  z-index: 10;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 16px;
}

/* 导航栏 */
.nav-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 50;

  .back-btn {
    background: transparent;
    border: none;
    padding: 8px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 50%;
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .nav-title {
    font-size: 17px;
    font-weight: 500;
  }
}

/* 歌单头部信息组合 */
.playlist-info-header {
  display: flex;
  padding: 16px 20px 24px 20px;
  gap: 16px;
  align-items: flex-start;

  @media (min-width: 768px) {
    padding: 32px 40px;
    gap: 32px;
  }
}

.cover-section {
  flex-shrink: 0;
  .cover-wrapper {
    width: 110px;
    height: 110px;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    @media (min-width: 768px) {
      width: 200px;
      height: 200px;
      border-radius: 16px;
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .play-count {
      position: absolute;
      top: 4px;
      right: 6px;
      display: flex;
      align-items: center;
      font-size: 11px;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      background: rgba(0, 0, 0, 0.2);
      padding: 2px 6px;
      border-radius: 10px;

      @media (min-width: 768px) {
        top: 8px;
        right: 8px;
        font-size: 13px;
        padding: 4px 8px;
      }
    }
  }
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 8px;

  .title {
    font-size: 17px;
    font-weight: 600;
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .creator-box {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;

    .avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }
    .nickname {
      font-size: 12px;
    }
    .tag-divider {
      margin: 0 2px;
      font-size: 10px;
    }
    .tags {
      font-size: 12px;
    }
  }

  .desc-box {
    margin-top: 4px;
    .desc-text {
      font-size: 11px;
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;

      @media (min-width: 768px) {
        font-size: 14px;
        -webkit-line-clamp: 3;
        line-clamp: 3;
      }
    }
  }
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-around;
  padding: 0 24px 24px 24px;
  gap: 16px;

  @media (min-width: 768px) {
    justify-content: flex-start;
    padding: 0 40px 32px 40px;
    max-width: 500px;
    gap: 24px;
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 20px;
    height: 38px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
}

/* 列表主容器 */
.track-list-sheet {
  border-radius: 20px 20px 0 0;
  min-height: 60vh;
  position: relative;
  padding-bottom: 24px;
}

/* 播放全部头 */
.play-all-header {
  display: flex;
  align-items: center;
  padding: 16px;
  position: sticky;
  top: 56px; /* 吸附到导航栏下 */
  border-radius: 20px 20px 0 0;
  z-index: 40;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (min-width: 768px) {
    padding: 20px 40px;
  }

  .play-icon-box {
    width: 28px;
    height: 28px;
    background-color: #ff3a3a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
  }

  .play-text {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 6px;

    .main {
      font-size: 16px;
      font-weight: 600;
    }
    .count {
      font-size: 12px;
    }
  }

  .header-actions {
    display: flex;
    gap: 16px;

    .header-icon-btn {
      background: none;
      border: none;
      display: flex;
      align-items: center;
      padding: 4px;
      cursor: pointer;
      opacity: 0.8;
      &:hover {
        opacity: 1;
      }
    }
  }
}

/* 歌曲列表项 */
.tracks-list {
  display: flex;
  flex-direction: column;
}

.track-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  @media (min-width: 768px) {
    padding: 12px 40px;
    gap: 16px;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.695);
  }

  &.playing {
    .song-meta .name {
      color: #ff3a3a;
    }
  }

  .song-cover {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    flex-shrink: 0;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);

    @media (min-width: 768px) {
      width: 54px;
      height: 54px;
      border-radius: 8px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .song-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 4px;
    justify-content: center;

    .song-title-row {
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      .name {
        font-size: 15px;
        font-weight: 400;

        @media (min-width: 768px) {
          font-size: 16px;
        }
      }
      .alia {
        font-size: 15px;
        margin-left: 4px;

        @media (min-width: 768px) {
          font-size: 16px;
        }
      }
    }

    .song-artist-row {
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      .vip-badge {
        font-size: 9px;
        color: #ff3a3a;
        border: 1px solid #ff3a3a;
        padding: 0 3px;
        border-radius: 3px;
        margin-right: 4px;
        line-height: normal;
        flex-shrink: 0;
      }

      .artist-album {
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (min-width: 768px) {
          font-size: 14px;
        }
      }
    }
  }

  .more-btn {
    background: none;
    border: none;
    padding: 8px;
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }
}

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
