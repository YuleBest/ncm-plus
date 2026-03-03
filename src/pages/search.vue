<script setup lang="ts">
defineOptions({ name: 'SearchPage' })
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import HomeLayout from '@/layouts/Home.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import SongItem from '@/components/song/SongItem.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { Flame, Music2, User, Disc, ListMusic, ArrowRight } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { useSearchStore, type SearchTab } from '@/stores/search'
import { extractPlaylistId } from '@/utils/playlist'
import { formatPlayCount } from '@/utils/format'

const playerStore = usePlayerStore()
const searchStore = useSearchStore()
const router = useRouter()

onMounted(() => searchStore.fetchHotSearch())

// ── 歌单直达检测 ──────────────────────────────────────────────
const detectedPlaylistId = computed(() => extractPlaylistId(searchStore.keyword))

// ── 搜索建议 ─────────────────────────────────────────────────
const inputFocused = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const hasSuggestions = computed(() => {
  const r = searchStore.suggestResult
  if (!r) return false
  return !!(r.songs?.length || r.artists?.length || r.albums?.length)
})

const showSuggest = computed(
  () =>
    !detectedPlaylistId.value &&
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
    if (!val.trim() || extractPlaylistId(val)) {
      searchStore.clearSuggestions()
      return
    }
    debounceTimer = setTimeout(() => searchStore.fetchSuggestions(val), 300)
  },
)

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

const onFocus = () => (inputFocused.value = true)
const onBlur = () => setTimeout(() => (inputFocused.value = false), 150)
const closeSuggest = () => (inputFocused.value = false)

const handleSuggestClick = (text: string) => {
  playerStore.unlock()
  inputFocused.value = false
  searchStore.performSearch(text)
}

const handleSearch = async () => {
  playerStore.unlock()
  inputFocused.value = false
  if (detectedPlaylistId.value) {
    router.push(`/playlist/${detectedPlaylistId.value}`)
    return
  }
  await searchStore.performSearch()
}

const handleHotClick = (keyword: string) => {
  playerStore.unlock()
  searchStore.performSearch(keyword)
}

const handleSongClick = (songId: number) => {
  playerStore.unlock()
  playerStore.playSong(songId)
  playerStore.openPlayer()
}

const handleArtistClick = (artistId: number) => {
  playerStore.unlock()
  inputFocused.value = false
  router.push(`/artist/${artistId}`)
}

// ── Tab 相关 ─────────────────────────────────────────────────
const tabs: { key: SearchTab; label: string }[] = [
  { key: 'songs', label: '歌曲' },
  { key: 'artists', label: '歌手' },
  { key: 'playlists', label: '歌单' },
  { key: 'albums', label: '专辑' },
]

const tabCount = (tab: SearchTab) => {
  const map: Record<SearchTab, number> = {
    songs: searchStore.songCount,
    artists: searchStore.artistCount,
    albums: searchStore.albumCount,
    playlists: searchStore.playlistCount,
  }
  return map[tab]
}

const handleTabSwitch = (tab: SearchTab) => searchStore.switchTab(tab)

const showResults = computed(
  () => searchStore.hasResults() || Object.values(searchStore.loadings).some(Boolean),
)
</script>

<template>
  <HomeLayout>
    <div class="search-page">
      <!-- ── 搜索栏 ─────────────────────────────────────────── -->
      <div class="search-header">
        <div class="search-input-wrapper">
          <Input
            v-model="searchStore.keyword"
            type="text"
            placeholder="搜索音乐、歌手、专辑，或粘贴歌单链接…"
            class="search-input"
            @keyup.enter="handleSearch"
            @focus="onFocus"
            @blur="onBlur"
            @keydown.escape="closeSuggest"
          />

          <!-- 歌单直达提示 -->
          <Transition name="suggest">
            <div v-if="detectedPlaylistId && inputFocused" class="playlist-hint">
              <ListMusic :size="14" class="hint-icon" />
              <div class="hint-body">
                <span class="hint-label">识别到歌单</span>
                <span class="hint-id">ID: {{ detectedPlaylistId }}</span>
              </div>
              <button
                class="hint-go-btn"
                @mousedown.prevent="router.push(`/playlist/${detectedPlaylistId}`)"
              >
                直达 <ArrowRight :size="13" />
              </button>
            </div>
          </Transition>

          <!-- 搜索建议下拉 -->
          <Transition name="suggest">
            <div v-if="showSuggest" class="suggest-dropdown">
              <div v-if="searchStore.suggestLoading && !hasSuggestions" class="suggest-loading">
                加载建议中...
              </div>
              <template v-for="category in suggestOrder" :key="category">
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
                <template
                  v-if="category === 'artists' && searchStore.suggestResult?.artists?.length"
                >
                  <div
                    v-for="artist in searchStore.suggestResult.artists.slice(0, 2)"
                    :key="artist.id"
                    class="suggest-item"
                    @mousedown.prevent="handleArtistClick(artist.id)"
                  >
                    <User :size="13" class="suggest-icon" />
                    <span class="suggest-name">{{ artist.name }}</span>
                    <span class="suggest-sub">歌手</span>
                  </div>
                </template>
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

        <Button
          @click="handleSearch"
          :disabled="searchStore.loading && !detectedPlaylistId"
          :class="{ 'btn-goto': !!detectedPlaylistId }"
        >
          {{ detectedPlaylistId ? '前往歌单' : searchStore.loading ? '搜索中...' : '搜索' }}
        </Button>
      </div>

      <!-- 错误提示 -->
      <div v-if="searchStore.errorMsg" class="error-msg">{{ searchStore.errorMsg }}</div>

      <!-- ── 热搜榜 ────────────────────────────────────────── -->
      <div v-if="!searchStore.keyword" class="hot-search">
        <h3 class="hot-title"><Flame :size="16" /> 热搜榜</h3>
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

      <!-- ── 搜索结果 ─────────────────────────────────────── -->
      <div v-if="searchStore.keyword" class="search-results">
        <!-- Tab 栏 -->
        <div v-if="showResults" class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: searchStore.activeTab === tab.key }"
            @click="handleTabSwitch(tab.key)"
          >
            {{ tab.label }}
            <span v-if="tabCount(tab.key)" class="tab-count">{{
              tabCount(tab.key).toLocaleString()
            }}</span>
          </button>
        </div>

        <!-- ─── 歌曲面板 ────────────────────────────────── -->
        <div v-show="searchStore.activeTab === 'songs'" class="tab-panel">
          <LoadingSpinner
            v-if="searchStore.loadings.songs && searchStore.songs.length === 0"
            text="搜索歌曲..."
          />
          <div v-else-if="searchStore.songs.length > 0" class="song-list">
            <SongItem
              v-for="(song, index) in searchStore.songs"
              :key="song.id"
              :name="song.name"
              :artist-text="
                (song.artists as Array<{ name: string }>)?.map((a) => a.name).join(' / ') ?? ''
              "
              :album-name="(song.album as { name?: string })?.name"
              :alia="(song.alias as string[])?.length ? (song.alias as string[]) : undefined"
              :index="index + 1"
              :duration-ms="song.duration"
              :is-vip="song.fee === 1"
              :playing="playerStore.currentSong?.id === song.id"
              @click="handleSongClick(song.id)"
            />
            <div v-if="searchStore.hasMore('songs')" class="load-more-area">
              <button
                class="load-more-btn"
                :disabled="searchStore.loadings.songs"
                @click="searchStore.loadMore('songs')"
              >
                <span v-if="searchStore.loadings.songs">加载中...</span>
                <span v-else
                  >加载更多（{{ searchStore.songs.length }} / {{ searchStore.songCount }}）</span
                >
              </button>
            </div>
          </div>
          <div v-else-if="!searchStore.loadings.songs" class="empty-state">未找到相关歌曲</div>
        </div>

        <!-- ─── 歌手面板 ────────────────────────────────── -->
        <div v-show="searchStore.activeTab === 'artists'" class="tab-panel">
          <LoadingSpinner
            v-if="searchStore.loadings.artists && searchStore.artists.length === 0"
            text="搜索歌手..."
          />
          <div v-else-if="searchStore.artists.length > 0" class="artist-grid">
            <div
              v-for="artist in searchStore.artists"
              :key="artist.id"
              class="artist-card"
              @click="handleArtistClick(artist.id)"
            >
              <div class="artist-avatar-wrap">
                <img
                  v-if="artist.picUrl"
                  :src="artist.picUrl + '?param=200y200'"
                  :alt="artist.name"
                  class="artist-avatar"
                  loading="lazy"
                />
                <div v-else class="artist-avatar-fallback"><User :size="28" /></div>
              </div>
              <span class="artist-card-name">{{ artist.name }}</span>
              <span v-if="(artist.alias as string[])?.length" class="artist-card-alias">{{
                (artist.alias as string[])[0]
              }}</span>
            </div>
          </div>
          <div v-if="searchStore.hasMore('artists')" class="load-more-area">
            <button
              class="load-more-btn"
              :disabled="searchStore.loadings.artists"
              @click="searchStore.loadMore('artists')"
            >
              {{
                searchStore.loadings.artists
                  ? '加载中...'
                  : `加载更多（${searchStore.artists.length} / ${searchStore.artistCount}）`
              }}
            </button>
          </div>
          <div
            v-else-if="!searchStore.loadings.artists && !searchStore.artists.length"
            class="empty-state"
          >
            未找到相关歌手
          </div>
        </div>

        <!-- ─── 歌单面板 ────────────────────────────────── -->
        <div v-show="searchStore.activeTab === 'playlists'" class="tab-panel">
          <LoadingSpinner
            v-if="searchStore.loadings.playlists && searchStore.playlists.length === 0"
            text="搜索歌单..."
          />
          <div v-else-if="searchStore.playlists.length > 0" class="playlist-grid">
            <div
              v-for="pl in searchStore.playlists"
              :key="pl.id"
              class="playlist-card"
              @click="router.push(`/playlist/${pl.id}`)"
            >
              <div class="playlist-cover-wrap">
                <img
                  :src="pl.coverImgUrl + '?param=300y300'"
                  :alt="pl.name"
                  class="playlist-cover"
                  loading="lazy"
                />
                <span class="play-count">▶ {{ formatPlayCount(pl.playCount) }}</span>
              </div>
              <p class="playlist-name">{{ pl.name }}</p>
              <p class="playlist-creator">{{ pl.creator?.nickname }}</p>
            </div>
          </div>
          <div v-if="searchStore.hasMore('playlists')" class="load-more-area">
            <button
              class="load-more-btn"
              :disabled="searchStore.loadings.playlists"
              @click="searchStore.loadMore('playlists')"
            >
              {{
                searchStore.loadings.playlists
                  ? '加载中...'
                  : `加载更多（${searchStore.playlists.length} / ${searchStore.playlistCount}）`
              }}
            </button>
          </div>
          <div
            v-else-if="!searchStore.loadings.playlists && !searchStore.playlists.length"
            class="empty-state"
          >
            未找到相关歌单
          </div>
        </div>

        <!-- ─── 专辑面板 ────────────────────────────────── -->
        <div v-show="searchStore.activeTab === 'albums'" class="tab-panel">
          <LoadingSpinner
            v-if="searchStore.loadings.albums && searchStore.albums.length === 0"
            text="搜索专辑..."
          />
          <div v-else-if="searchStore.albums.length > 0" class="album-grid">
            <div
              v-for="album in searchStore.albums"
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
                <span class="album-type-tag">{{ album.type }}</span>
              </div>
              <p class="album-name">{{ album.name }}</p>
              <p class="album-artist">
                {{
                  (album.artists as Array<{ name: string }>)?.map((a) => a.name).join(' / ') ||
                  (album.artist as { name?: string })?.name
                }}
              </p>
            </div>
          </div>
          <div v-if="searchStore.hasMore('albums')" class="load-more-area">
            <button
              class="load-more-btn"
              :disabled="searchStore.loadings.albums"
              @click="searchStore.loadMore('albums')"
            >
              {{
                searchStore.loadings.albums
                  ? '加载中...'
                  : `加载更多（${searchStore.albums.length} / ${searchStore.albumCount}）`
              }}
            </button>
          </div>
          <div
            v-else-if="!searchStore.loadings.albums && !searchStore.albums.length"
            class="empty-state"
          >
            未找到相关专辑
          </div>
        </div>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
.search-page {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;

  // ── 搜索栏 ─────────────────────────────────────────────────
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

      .playlist-hint {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-primary-dim);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
        transition:
          background-color var(--transition-base),
          border-color var(--transition-base);

        .hint-icon {
          color: var(--color-primary);
          flex-shrink: 0;
        }
        .hint-body {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .hint-label {
          font-size: 13px;
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }
        .hint-id {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hint-go-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border: none;
          border-radius: var(--radius-sm);
          background-color: var(--color-primary);
          color: var(--color-text-on-primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
          transition: background-color var(--transition-fast);
          &:hover {
            background-color: var(--color-primary-hover);
          }
        }
      }

      .suggest-dropdown {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        z-index: 100;
        background: var(--color-bg-elevated);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--color-border);
        overflow: hidden;
        max-height: 320px;
        overflow-y: auto;
        transition:
          background-color var(--transition-base),
          border-color var(--transition-base);

        .suggest-loading {
          padding: 12px 16px;
          font-size: 13px;
          color: var(--color-text-tertiary);
        }

        .suggest-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background-color var(--transition-fast);

          &:hover {
            background-color: var(--color-surface-hover);
          }
          .suggest-icon {
            color: var(--color-text-placeholder);
            flex-shrink: 0;
          }
          .suggest-name {
            flex: 1;
            font-size: 14px;
            color: var(--color-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: color var(--transition-base);
          }
          .suggest-sub {
            font-size: 12px;
            color: var(--color-text-tertiary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
            transition: color var(--transition-base);
          }
        }
      }
    }

    .btn-goto {
      white-space: nowrap;
    }
  }

  .suggest-enter-active,
  .suggest-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .suggest-enter-from,
  .suggest-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  .error-msg {
    color: var(--color-primary);
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
      color: var(--color-text);
      margin: 0 0 12px;
      transition: color var(--transition-base);
    }
    .hot-loading {
      color: var(--color-text-tertiary);
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
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      transition:
        background-color var(--transition-base),
        border-color var(--transition-base);

      .hot-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: background-color var(--transition-fast);
        &:hover {
          background-color: var(--color-surface-hover);
        }
      }
      .hot-rank {
        width: 20px;
        font-size: 14px;
        font-weight: 700;
        color: var(--color-text-placeholder);
        text-align: center;
        flex-shrink: 0;
        transition: color var(--transition-base);
        &.top-three {
          color: var(--color-primary);
        }
      }
      .hot-keyword {
        flex: 1;
        font-size: 14px;
        color: var(--color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color var(--transition-base);
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

    @media (max-width: 768px) {
      .hot-list {
        grid-template-columns: 1fr;
      }
    }
  }

  // ── 搜索结果区 ──────────────────────────────────────────────
  .search-results {
    // Tab 栏
    .tab-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border-subtle);
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 16px;
      border: none;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
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

    .tab-panel {
      min-height: 120px;
    }
    .empty-state {
      text-align: center;
      color: var(--color-text-tertiary);
      padding: 40px 0;
      font-size: 14px;
    }

    // 歌曲
    .song-list {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      padding: 6px;
      transition:
        background-color var(--transition-base),
        border-color var(--transition-base);
    }

    // 歌手
    .artist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 8px;

      @media (max-width: 480px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .artist-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 10px 6px;
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast);
      &:hover {
        background-color: var(--color-surface-hover);
      }
      &:active {
        background-color: var(--color-surface-active);
      }
    }

    .artist-avatar-wrap {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      overflow: hidden;
      background-color: var(--color-bg-sunken);
      box-shadow: var(--shadow-sm);
      flex-shrink: 0;
    }
    .artist-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .artist-avatar-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-tertiary);
    }
    .artist-card-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      transition: color var(--transition-base);
    }
    .artist-card-alias {
      font-size: 11px;
      color: var(--color-text-tertiary);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      margin-top: -3px;
      transition: color var(--transition-base);
    }

    // 歌单
    .playlist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 20px 14px;

      @media (max-width: 480px) {
        grid-template-columns: repeat(3, 1fr);
        gap: 14px 10px;
      }
    }

    .playlist-card {
      cursor: pointer;
      border-radius: var(--radius-md);
      transition: transform 0.22s ease;
      &:hover {
        transform: translateY(-4px);
        .playlist-cover-wrap {
          box-shadow: var(--shadow-lg);
        }
        .playlist-cover {
          transform: scale(1.06);
        }
      }
      &:active {
        transform: scale(0.98);
      }
    }

    .playlist-cover-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1/1;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 7px;
      background-color: var(--color-bg-sunken);
      box-shadow: var(--shadow-md);
      transition: box-shadow var(--transition-base);
    }
    .playlist-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .play-count {
      position: absolute;
      top: 5px;
      right: 6px;
      font-size: 10px;
      font-weight: 500;
      color: #fff;
      background: rgba(0, 0, 0, 0.28);
      padding: 2px 6px;
      border-radius: var(--radius-full);
      backdrop-filter: blur(4px);
    }
    .playlist-name {
      margin: 0 0 3px;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color var(--transition-base);
    }
    .playlist-creator {
      margin: 0;
      font-size: 11px;
      color: var(--color-text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color var(--transition-base);
    }

    // 专辑
    .album-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 20px 14px;

      @media (max-width: 480px) {
        grid-template-columns: repeat(3, 1fr);
        gap: 14px 10px;
      }
    }

    .album-card {
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
        transform: scale(0.98);
      }
    }

    .album-cover-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1/1;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 7px;
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
      backdrop-filter: blur(4px);
      line-height: 1.5;
    }
    .album-name {
      margin: 0 0 3px;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color var(--transition-base);
    }
    .album-artist {
      margin: 0;
      font-size: 11px;
      color: var(--color-text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color var(--transition-base);
    }

    // 加载更多
    .load-more-area {
      display: flex;
      justify-content: center;
      padding: 20px 0 8px;
    }
    .load-more-btn {
      padding: 8px 24px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 13px;
      cursor: pointer;
      transition:
        background-color var(--transition-fast),
        color var(--transition-fast);
      &:hover:not(:disabled) {
        background-color: var(--color-bg-elevated);
        color: var(--color-text);
      }
      &:disabled {
        cursor: default;
        opacity: 0.6;
      }
    }
  }
}
</style>
