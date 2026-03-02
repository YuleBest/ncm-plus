<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import HomeLayout from '@/layouts/Home.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { Flame, Music2, User, Disc } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { useSearchStore } from '@/stores/search'

const playerStore = usePlayerStore()
const searchStore = useSearchStore()
const router = useRouter()

onMounted(() => {
  searchStore.fetchHotSearch()
})

// ── 搜索建议 ────────────────────────────────────────────────
const inputFocused = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const hasSuggestions = computed(() => {
  const r = searchStore.suggestResult
  if (!r) return false
  return !!(r.songs?.length || r.artists?.length || r.albums?.length)
})

const showSuggest = computed(
  () =>
    inputFocused.value &&
    !!searchStore.keyword.trim() &&
    (searchStore.suggestLoading || hasSuggestions.value),
)

const suggestOrder = computed(
  () => searchStore.suggestResult?.order ?? ['songs', 'artists', 'albums'],
)

watch(
  () => searchStore.keyword,
  (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!val.trim()) {
      searchStore.clearSuggestions()
      return
    }
    debounceTimer = setTimeout(() => searchStore.fetchSuggestions(val), 300)
  },
)

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

const onFocus = () => {
  inputFocused.value = true
}
const onBlur = () => {
  // 延迟 150ms，给 mousedown.prevent 的点击事件留出触发时间
  setTimeout(() => {
    inputFocused.value = false
  }, 150)
}
const closeSuggest = () => {
  inputFocused.value = false
}
const handleSuggestClick = (text: string) => {
  playerStore.unlock()
  inputFocused.value = false
  searchStore.performSearch(text)
}
// ────────────────────────────────────────────────────────────

const handleSearch = async () => {
  playerStore.unlock()
  inputFocused.value = false
  await searchStore.performSearch()
}

const handleHotClick = (keyword: string) => {
  playerStore.unlock()
  searchStore.performSearch(keyword)
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
  playerStore.unlock()
  playerStore.playSong(songId)
  router.push({ path: '/play', query: { id: songId } })
}
</script>

<template>
  <HomeLayout>
    <div class="search-page">
      <div class="search-header">
        <div class="search-input-wrapper">
          <Input
            v-model="searchStore.keyword"
            type="text"
            placeholder="搜索音乐、歌手、专辑..."
            class="search-input"
            @keyup.enter="handleSearch"
            @focus="onFocus"
            @blur="onBlur"
            @keydown.escape="closeSuggest"
          />
          <!-- 搜索建议下拉 -->
          <Transition name="suggest">
            <div v-if="showSuggest" class="suggest-dropdown">
              <div v-if="searchStore.suggestLoading && !hasSuggestions" class="suggest-loading">
                加载建议中...
              </div>
              <template v-for="category in suggestOrder" :key="category">
                <!-- 歌曲 -->
                <template v-if="category === 'songs' && searchStore.suggestResult?.songs?.length">
                  <div
                    v-for="song in searchStore.suggestResult.songs.slice(0, 4)"
                    :key="song.id"
                    class="suggest-item"
                    @mousedown.prevent="handleSuggestClick(song.name)"
                  >
                    <Music2 :size="13" class="suggest-icon" />
                    <span class="suggest-name">{{ song.name }}</span>
                    <span class="suggest-sub">{{
                      song.artists?.map((a) => a.name).join(' / ')
                    }}</span>
                  </div>
                </template>
                <!-- 歌手 -->
                <template
                  v-if="category === 'artists' && searchStore.suggestResult?.artists?.length"
                >
                  <div
                    v-for="artist in searchStore.suggestResult.artists.slice(0, 2)"
                    :key="artist.id"
                    class="suggest-item"
                    @mousedown.prevent="handleSuggestClick(artist.name)"
                  >
                    <User :size="13" class="suggest-icon" />
                    <span class="suggest-name">{{ artist.name }}</span>
                    <span class="suggest-sub">歌手</span>
                  </div>
                </template>
                <!-- 专辑 -->
                <template v-if="category === 'albums' && searchStore.suggestResult?.albums?.length">
                  <div
                    v-for="album in searchStore.suggestResult.albums.slice(0, 2)"
                    :key="album.id"
                    class="suggest-item"
                    @mousedown.prevent="handleSuggestClick(album.name)"
                  >
                    <Disc :size="13" class="suggest-icon" />
                    <span class="suggest-name">{{ album.name }}</span>
                    <span class="suggest-sub">{{ album.artist?.name }}</span>
                  </div>
                </template>
              </template>
            </div>
          </Transition>
        </div>

        <Button @click="handleSearch" :disabled="searchStore.loading">
          {{ searchStore.loading ? '搜索中...' : '搜索' }}
        </Button>
      </div>

      <div v-if="searchStore.errorMsg" class="error-msg">
        {{ searchStore.errorMsg }}
      </div>

      <!-- 热搜榜：无关键词时展示 -->
      <div v-if="!searchStore.keyword" class="hot-search">
        <h3 class="hot-title">
          <Flame :size="16" />
          热搜榜
        </h3>
        <div v-if="searchStore.hotLoading" class="hot-loading">加载中...</div>
        <ol v-else class="hot-list">
          <li
            v-for="(item, index) in searchStore.hotList"
            :key="index"
            class="hot-item"
            @click="handleHotClick(item.first)"
          >
            <span class="hot-rank" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</span>
            <span class="hot-keyword">{{ item.first }}</span>
            <span v-if="item.iconType === 1" class="hot-fire">🔥</span>
            <span v-else-if="item.iconType === 2" class="hot-badge new">新</span>
            <span v-else-if="item.iconType === 3" class="hot-badge rec">推</span>
          </li>
        </ol>
      </div>

      <!-- 搜索结果 -->
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

  // ── 搜索栏 ──────────────────────────────────────────────────
  .search-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 24px;

    .search-input-wrapper {
      flex: 1;
      max-width: 400px;
      position: relative;

      .search-input {
        width: 100%;
      }

      // 建议下拉面板
      .suggest-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 100;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border: 1px solid rgba(0, 0, 0, 0.06);
        overflow: hidden;
        max-height: 320px;
        overflow-y: auto;

        .suggest-loading {
          padding: 12px 16px;
          font-size: 13px;
          color: #999;
        }

        .suggest-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background-color 0.15s;

          &:hover {
            background-color: rgba(0, 0, 0, 0.04);
          }

          .suggest-icon {
            color: #bbb;
            flex-shrink: 0;
          }

          .suggest-name {
            flex: 1;
            font-size: 14px;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .suggest-sub {
            font-size: 12px;
            color: #999;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
          }
        }
      }
    }
  }

  // 建议下拉动画
  .suggest-enter-active,
  .suggest-leave-active {
    transition:
      opacity 0.15s,
      transform 0.15s;
  }
  .suggest-enter-from,
  .suggest-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  // ── 错误提示 ─────────────────────────────────────────────────
  .error-msg {
    color: #ff5a5f;
    margin-bottom: 16px;
    font-size: 14px;
  }

  // ── 热搜榜 ──────────────────────────────────────────────────
  .hot-search {
    margin-bottom: 24px;

    .hot-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px;
    }

    .hot-loading {
      color: #999;
      font-size: 14px;
      padding: 12px 0;
    }

    .hot-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px;
      list-style: none;
      padding: 8px;
      margin: 0;
      background-color: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(0, 0, 0, 0.04);
      border-radius: 16px;

      .hot-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }

        .hot-rank {
          width: 20px;
          font-size: 14px;
          font-weight: 700;
          color: #ccc;
          text-align: center;
          flex-shrink: 0;

          &.top-three {
            color: #ff5a5f;
          }
        }

        .hot-keyword {
          flex: 1;
          font-size: 14px;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hot-fire {
          font-size: 13px;
          flex-shrink: 0;
        }

        .hot-badge {
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 600;
          flex-shrink: 0;
          line-height: normal;

          &.new {
            color: #1db954;
            border: 1px solid #1db954;
          }

          &.rec {
            color: #f5a623;
            border: 1px solid #f5a623;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .hot-list {
        grid-template-columns: 1fr;
      }
    }
  }

  // ── 搜索结果 ─────────────────────────────────────────────────
  .empty-state {
    text-align: center;
    color: #999;
    padding: 40px 0;
  }

  .song-list {
    list-style: none;
    padding: 16px;
    margin: 0;
    background-color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 16px;

    .song-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      transition: background-color 0.2s;
      cursor: pointer;

      &:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      > div {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .song-index {
        width: 40px;
        flex-shrink: 0;
        color: #999;
        font-size: 14px;
        text-align: center;
      }

      .song-info {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        overflow: hidden;

        .song-name-wrapper {
          flex: 3;
          min-width: 0;
          padding-right: 16px;
          display: flex;
          align-items: center;

          .song-name {
            font-size: 15px;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .vip-tag {
            font-size: 10px;
            color: #ff5a5f;
            border: 1px solid #ff5a5f;
            padding: 0 4px;
            margin-left: 6px;
            border-radius: 4px;
            font-weight: 600;
            flex-shrink: 0;
            position: relative;
            top: -1px;
            line-height: normal;
          }
        }

        .song-artist {
          flex: 4;
          min-width: 0;
          font-size: 13px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 16px;
        }
      }

      .song-duration {
        width: 50px;
        flex-shrink: 0;
        text-align: right;
        color: #999;
        font-size: 13px;
      }

      @media (max-width: 768px) {
        padding: 12px 8px;

        .song-index {
          width: 32px;
        }

        .song-duration {
          display: none;
        }

        .song-info {
          flex-direction: column;
          align-items: stretch;

          .song-name-wrapper {
            flex: none;
            padding-right: 0;
            margin-bottom: 4px;
          }

          .song-artist {
            flex: none;
            padding-right: 0;
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
  }
}
</style>
