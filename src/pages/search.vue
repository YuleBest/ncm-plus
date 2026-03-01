<script setup lang="ts">
import { useRouter } from 'vue-router'
import HomeLayout from '@/layouts/Home.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { usePlayerStore } from '@/stores/player'
import { useSearchStore } from '@/stores/search'

const playerStore = usePlayerStore()
const searchStore = useSearchStore()
const router = useRouter()

const handleSearch = async () => {
  // 触发解锁音频（用户手势）
  playerStore.unlock()
  await searchStore.performSearch()
}

// 格式化时长 (毫秒 -> 分:秒)
const formatDuration = (ms: number) => {
  if (!ms) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const handleSongClick = (songId: number) => {
  // 触发解锁音频
  playerStore.unlock()
  playerStore.playSong(songId)
  router.push({ path: '/play', query: { id: songId } })
}
</script>

<template>
  <HomeLayout>
    <div class="search-page">
      <div class="search-header">
        <Input
          v-model="searchStore.keyword"
          type="text"
          placeholder="搜索音乐、歌手、专辑..."
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <Button @click="handleSearch" :disabled="searchStore.loading">
          {{ searchStore.loading ? '搜索中...' : '搜索' }}
        </Button>
      </div>

      <div v-if="searchStore.errorMsg" class="error-msg">
        {{ searchStore.errorMsg }}
      </div>

      <div class="search-results">
        <div
          v-if="!searchStore.loading && searchStore.songs.length === 0 && searchStore.keyword"
          class="empty-state"
        >
          未找到相关结果
        </div>

        <ul class="song-list" v-if="searchStore.songs.length > 0">
          <li
            v-for="(song, index) in searchStore.songs"
            :key="song.id"
            class="song-item"
            @click="handleSongClick(song.id)"
          >
            <div class="song-index">{{ index + 1 }}</div>
            <div class="song-info">
              <div class="song-name-wrapper">
                <div class="song-name">{{ song.name }}</div>
                <span v-if="song.fee === 1" class="vip-tag">VIP</span>
              </div>
              <div class="song-artist">
                {{ song.artists?.map((a) => a.name).join(' / ') }} - {{ song.album?.name }}
              </div>
            </div>
            <div class="song-duration">{{ formatDuration(song.duration) }}</div>
          </li>
        </ul>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
.search-page {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;

  .search-header {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;

    .search-input {
      flex: 1;
      max-width: 400px;
    }
  }

  .error-msg {
    color: #ff5a5f;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .empty-state {
    text-align: center;
    color: #999;
    padding: 40px 0;
  }

  .song-list {
    list-style: none;
    padding: 0;
    margin: 0;
    background-color: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    overflow: hidden;

    .song-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      &:not(:last-child) {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      }

      .song-index {
        width: 40px;
        color: #999;
        font-size: 14px;
      }

      .song-info {
        flex: 1;
        overflow: hidden;

        .song-name-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;

          .song-name {
            font-size: 15px;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .vip-tag {
            font-size: 10px;
            color: #ff3b30;
            border: 1px solid #ff3b30;
            padding: 0 4px;
            border-radius: 4px;
            font-weight: bold;
            flex-shrink: 0;
            line-height: normal;
          }
        }

        .song-artist {
          font-size: 13px;
          color: #888;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .song-duration {
        width: 60px;
        text-align: right;
        color: #999;
        font-size: 13px;
      }
    }
  }
}
</style>
