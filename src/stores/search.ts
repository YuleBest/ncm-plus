import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  searchSongs,
  searchArtists,
  searchAlbums,
  searchPlaylists,
  type SearchSong,
  type SearchArtist,
  type SearchAlbum,
  type SearchPlaylist,
} from '@/api/search'
import { getHotSearchDetail, type hotSearchDetail } from '@/api/search/hot'
import { getSuggestDetail, type SuggestResult } from '@/api/search/suggest'

// 兼容旧导入
export type { SearchSong as Song, SearchArtist as ArtistResult }

export type SearchTab = 'songs' | 'artists' | 'albums' | 'playlists'
const PAGE_SIZE = 30

export const useSearchStore = defineStore('search', () => {
  // ── 当前关键词 & 激活 Tab ──────────────────────────────────
  const keyword = ref('')
  const activeTab = ref<SearchTab>('songs')

  // ── 各 Tab 结果 ────────────────────────────────────────────
  const songs = ref<SearchSong[]>([])
  const artists = ref<SearchArtist[]>([])
  const albums = ref<SearchAlbum[]>([])
  const playlists = ref<SearchPlaylist[]>([])

  // 总数
  const songCount = ref(0)
  const artistCount = ref(0)
  const albumCount = ref(0)
  const playlistCount = ref(0)

  // 是否已加载（用于懒加载判断）
  const loaded = ref<Record<SearchTab, boolean>>({
    songs: false,
    artists: false,
    albums: false,
    playlists: false,
  })

  // 加载中
  const loadings = ref<Record<SearchTab, boolean>>({
    songs: false,
    artists: false,
    albums: false,
    playlists: false,
  })

  // 偏移
  const offsets = ref<Record<SearchTab, number>>({
    songs: 0,
    artists: 0,
    albums: 0,
    playlists: 0,
  })

  // 全局 loading（用于搜索按钮禁用）
  const loading = ref(false)
  const errorMsg = ref('')

  // ── 内部：单 Tab 搜索 ──────────────────────────────────────
  const fetchTab = async (tab: SearchTab, kw: string, offset = 0) => {
    loadings.value[tab] = true
    try {
      const params = { keywords: kw, limit: PAGE_SIZE, offset }

      if (tab === 'songs') {
        const res = await searchSongs(params)
        if (res.data?.code === 200) {
          const r = res.data.result
          songs.value = offset === 0 ? (r.songs ?? []) : [...songs.value, ...(r.songs ?? [])]
          songCount.value = r.songCount ?? songs.value.length
          offsets.value.songs = songs.value.length
          loaded.value.songs = true
        }
      } else if (tab === 'artists') {
        const res = await searchArtists(params)
        if (res.data?.code === 200) {
          const r = res.data.result
          artists.value =
            offset === 0 ? (r.artists ?? []) : [...artists.value, ...(r.artists ?? [])]
          artistCount.value = r.artistCount ?? artists.value.length
          offsets.value.artists = artists.value.length
          loaded.value.artists = true
        }
      } else if (tab === 'albums') {
        const res = await searchAlbums(params)
        if (res.data?.code === 200) {
          const r = res.data.result
          albums.value = offset === 0 ? (r.albums ?? []) : [...albums.value, ...(r.albums ?? [])]
          albumCount.value = r.albumCount ?? albums.value.length
          offsets.value.albums = albums.value.length
          loaded.value.albums = true
        }
      } else if (tab === 'playlists') {
        const res = await searchPlaylists(params)
        if (res.data?.code === 200) {
          const r = res.data.result
          playlists.value =
            offset === 0 ? (r.playlists ?? []) : [...playlists.value, ...(r.playlists ?? [])]
          playlistCount.value = r.playlistCount ?? playlists.value.length
          offsets.value.playlists = playlists.value.length
          loaded.value.playlists = true
        }
      }
    } catch (err) {
      console.error(`[search] tab=${tab} failed`, err)
    } finally {
      loadings.value[tab] = false
    }
  }

  // ── 主搜索（重置所有 Tab，立即加载 activeTab） ─────────────
  const performSearch = async (query?: string) => {
    const kw = query ?? keyword.value
    if (!kw.trim()) {
      clearSearch()
      return
    }
    if (query) keyword.value = query

    // 重置
    songs.value = []
    artists.value = []
    albums.value = []
    playlists.value = []
    songCount.value = 0
    artistCount.value = 0
    albumCount.value = 0
    playlistCount.value = 0
    loaded.value = { songs: false, artists: false, albums: false, playlists: false }
    offsets.value = { songs: 0, artists: 0, albums: 0, playlists: 0 }
    errorMsg.value = ''
    loading.value = true

    try {
      await fetchTab(activeTab.value, kw, 0)
    } catch (err) {
      errorMsg.value = err instanceof Error ? err.message : '搜索失败'
    } finally {
      loading.value = false
    }
  }

  // ── 切换 Tab 时懒加载 ──────────────────────────────────────
  const switchTab = async (tab: SearchTab) => {
    activeTab.value = tab
    if (!keyword.value.trim() || loaded.value[tab]) return
    await fetchTab(tab, keyword.value, 0)
  }

  // ── 加载更多 ──────────────────────────────────────────────
  const loadMore = async (tab: SearchTab) => {
    if (!keyword.value.trim() || loadings.value[tab]) return
    await fetchTab(tab, keyword.value, offsets.value[tab])
  }

  const hasMore = (tab: SearchTab) => {
    const counts: Record<SearchTab, number> = {
      songs: songCount.value,
      artists: artistCount.value,
      albums: albumCount.value,
      playlists: playlistCount.value,
    }
    const lengths: Record<SearchTab, number> = {
      songs: songs.value.length,
      artists: artists.value.length,
      albums: albums.value.length,
      playlists: playlists.value.length,
    }
    return loaded.value[tab] && lengths[tab] < counts[tab]
  }

  // ── 是否有结果（任意 Tab） ──────────────────────────────────
  const hasResults = () =>
    songs.value.length > 0 ||
    artists.value.length > 0 ||
    albums.value.length > 0 ||
    playlists.value.length > 0

  // ── 清空 ─────────────────────────────────────────────────
  const clearSearch = () => {
    keyword.value = ''
    songs.value = []
    artists.value = []
    albums.value = []
    playlists.value = []
    songCount.value = 0
    artistCount.value = 0
    albumCount.value = 0
    playlistCount.value = 0
    loaded.value = { songs: false, artists: false, albums: false, playlists: false }
    offsets.value = { songs: 0, artists: 0, albums: 0, playlists: 0 }
    errorMsg.value = ''
  }

  // ── 热搜榜 ────────────────────────────────────────────────
  const hotList = ref<hotSearchDetail[]>([])
  const hotLoading = ref(false)

  const fetchHotSearch = async () => {
    if (hotList.value.length) return
    hotLoading.value = true
    try {
      const res = await getHotSearchDetail()
      if (res.data?.code === 200) {
        hotList.value = res.data.result?.hots || []
      }
    } catch {
      /* 静默失败 */
    } finally {
      hotLoading.value = false
    }
  }

  // ── 搜索建议 ─────────────────────────────────────────────
  const suggestResult = ref<SuggestResult | null>(null)
  const suggestLoading = ref(false)

  const fetchSuggestions = async (kw: string) => {
    if (!kw.trim()) {
      suggestResult.value = null
      return
    }
    suggestLoading.value = true
    try {
      const res = await getSuggestDetail({ keywords: kw })
      if (res.data?.code === 200) suggestResult.value = res.data.result
    } catch {
      /* 静默失败 */
    } finally {
      suggestLoading.value = false
    }
  }

  const clearSuggestions = () => {
    suggestResult.value = null
  }

  return {
    keyword,
    activeTab,
    songs,
    artists,
    albums,
    playlists,
    songCount,
    artistCount,
    albumCount,
    playlistCount,
    loaded,
    loadings,
    loading,
    errorMsg,
    performSearch,
    switchTab,
    loadMore,
    hasMore,
    hasResults,
    clearSearch,
    hotList,
    hotLoading,
    fetchHotSearch,
    suggestResult,
    suggestLoading,
    fetchSuggestions,
    clearSuggestions,
  }
})
