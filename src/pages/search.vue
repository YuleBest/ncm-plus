<script setup lang="ts">
import { ref } from 'vue'
import HomeLayout from '@/layouts/Home.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { searchMusic, type Song } from '@/api/search/searchMusic'

const keyword = ref('')
const loading = ref(false)
const songs = ref<Song[]>([])
const errorMsg = ref('')

const handleSearch = async () => {
  if (!keyword.value.trim()) {
    songs.value = []
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const res = await searchMusic({ keywords: keyword.value })
    if (res.data?.code === 200) {
      songs.value = res.data.result?.songs || []
    } else {
      errorMsg.value = '搜索失败：接口错误'
    }
  } catch (err: unknown) {
    const errorMsgText = err instanceof Error ? err.message : '未知错误'
    errorMsg.value = '请求异常: ' + errorMsgText
  } finally {
    loading.value = false
  }
}

// 格式化时长 (毫秒 -> 分:秒)
const formatDuration = (ms: number) => {
  if (!ms) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <HomeLayout>
    <div class="search-page">
      <div class="search-header">
        <Input
          v-model="keyword"
          type="text"
          placeholder="搜索音乐、歌手、专辑..."
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <Button @click="handleSearch" :disabled="loading">
          {{ loading ? '搜索中...' : '搜索' }}
        </Button>
      </div>

      <div v-if="errorMsg" class="error-msg">
        {{ errorMsg }}
      </div>

      <div class="search-results">
        <div v-if="!loading && songs.length === 0 && keyword" class="empty-state">
          未找到相关结果
        </div>

        <ul class="song-list" v-if="songs.length > 0">
          <li v-for="(song, index) in songs" :key="song.id" class="song-item">
            <div class="song-index">{{ index + 1 }}</div>
            <div class="song-info">
              <div class="song-name">{{ song.name }}</div>
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

        .song-name {
          font-size: 15px;
          color: #333;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
