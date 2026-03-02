<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeLayout from '@/layouts/Home.vue'
import { getHighQualityPlaylists, type HighQualityPlaylist } from '@/api/top/playlist/highquality'
import { Disc, PlayCircle } from 'lucide-vue-next'

const router = useRouter()
const playlists = ref<HighQualityPlaylist[]>([])
const isLoading = ref(true)

const fetchPlaylists = async () => {
  try {
    isLoading.value = true
    const res = await getHighQualityPlaylists({ limit: 12 })
    if (res.data?.playlists) {
      playlists.value = res.data.playlists
    }
  } catch (error) {
    console.error('Failed to fetch playlists:', error)
  } finally {
    isLoading.value = false
  }
}

const goToPlaylist = (id: number) => {
  router.push(`/playlist/${id}`)
}

// 格式化播放量
const formatPlayCount = (count: number) => {
  if (count > 100000000) return (count / 100000000).toFixed(1) + '亿'
  if (count > 10000) return (count / 10000).toFixed(1) + '万'
  return count.toString()
}

onMounted(() => {
  fetchPlaylists()
})
</script>

<template>
  <HomeLayout>
    <div class="index-page">
      <!-- 推荐歌单模块 -->
      <div class="section-container">
        <div class="section-header">
          <h3 class="section-title">精品推荐歌单</h3>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>

        <div v-else class="playlist-grid">
          <div
            v-for="item in playlists"
            :key="item.id"
            class="playlist-card"
            @click="goToPlaylist(item.id)"
          >
            <div class="cover-wrapper">
              <img :src="item.coverImgUrl + '?param=300y300'" :alt="item.name" class="cover-img" />
              <div class="play-count">
                <PlayCircle :size="12" class="mr-1" />
                {{ formatPlayCount(item.playCount) }}
              </div>
              <div class="play-overlay">
                <PlayCircle :size="48" color="#fff" fill="rgba(0,0,0,0.3)" />
              </div>
            </div>
            <div class="playlist-info">
              <div class="playlist-name" :title="item.name">{{ item.name }}</div>
              <div class="creator-name">
                <Disc :size="12" class="mr-1" />
                {{ item.creator?.nickname }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
.index-page {
  padding: 8px;
  padding-bottom: 40px;

  .welcome-card {
    border-radius: 16px;
    padding: 24px;
    background-color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(0, 0, 0, 0.04);
    margin-bottom: 24px;

    h2 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 24px;
    }
    p {
      margin: 0;
      color: #666;
    }
  }

  .section-container {
    padding: 0 8px;
  }

  .section-header {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  }

  .playlist-grid {
    display: grid;
    /* 响应式网格布局：手机2列，平板3-4列，桌面5列以上 */
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 20px 16px;
  }

  .playlist-card {
    cursor: pointer;
    border-radius: 12px;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-4px);

      .play-overlay {
        opacity: 1;
      }
    }
  }

  .cover-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 10px;
    background-color: #eee;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }

  .playlist-card:hover .cover-img {
    transform: scale(1.05);
  }

  .play-count {
    position: absolute;
    top: 6px;
    right: 8px;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    backdrop-filter: blur(4px);

    .mr-1 {
      margin-right: 4px;
    }
  }

  .play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .playlist-info {
    padding: 0 4px;
  }

  .playlist-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    line-height: 1.4;
    margin-bottom: 4px;
    /* 两行省略 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .creator-name {
    font-size: 12px;
    color: #999;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .mr-1 {
      margin-right: 4px;
    }
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: #666;
    gap: 12px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #333;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* 移动端适配 */
  @media (max-width: 640px) {
    .playlist-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 12px;
    }
    .playlist-name {
      font-size: 13px;
    }
  }
}
</style>
