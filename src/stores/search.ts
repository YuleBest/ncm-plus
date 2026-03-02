import { defineStore } from 'pinia'
import { ref } from 'vue'
import { searchMusic, searchArtists, type Song, type ArtistResult } from '@/api/search'
import { getHotSearchDetail, type hotSearchDetail } from '@/api/search/hot'
import { getSuggestDetail, type SuggestResult } from '@/api/search/suggest'

export const useSearchStore = defineStore('search', () => {
  // ── 搜索结果 ────────────────────────────────────────────────
  const keyword = ref('')
  const songs = ref<Song[]>([])
  const artists = ref<ArtistResult[]>([])
  const loading = ref(false)
  const errorMsg = ref('')

  const performSearch = async (query?: string) => {
    const searchKeyword = query ?? keyword.value
    if (!searchKeyword.trim()) {
      songs.value = []
      artists.value = []
      return
    }

    loading.value = true
    errorMsg.value = ''

    try {
      // 并行搜索歌曲（type=1）与歌手（type=100）
      const [songRes, artistRes] = await Promise.all([
        searchMusic({ keywords: searchKeyword, type: 1 }),
        searchArtists({ keywords: searchKeyword }),
      ])

      if (songRes.data?.code === 200) {
        songs.value = songRes.data.result?.songs || []
        if (query) keyword.value = query
      } else {
        errorMsg.value = '搜索失败：接口错误'
      }

      if (artistRes.data?.code === 200) {
        // 只取前 5 个歌手结果
        artists.value = (artistRes.data.result?.artists || []).slice(0, 5)
      }
    } catch (err: unknown) {
      const errorMsgText = err instanceof Error ? err.message : '未知错误'
      errorMsg.value = '请求异常: ' + errorMsgText
    } finally {
      loading.value = false
    }
  }

  const clearSearch = () => {
    keyword.value = ''
    songs.value = []
    artists.value = []
    errorMsg.value = ''
  }

  // ── 热搜榜 ──────────────────────────────────────────────────
  const hotList = ref<hotSearchDetail[]>([])
  const hotLoading = ref(false)

  const fetchHotSearch = async () => {
    if (hotList.value.length) return // 已加载则跳过
    hotLoading.value = true
    try {
      const res = await getHotSearchDetail()
      if (res.data?.code === 200) {
        hotList.value = res.data.result?.hots || []
      }
    } catch {
      // 静默失败，不影响主功能
    } finally {
      hotLoading.value = false
    }
  }

  // ── 搜索建议 ────────────────────────────────────────────────
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
      if (res.data?.code === 200) {
        suggestResult.value = res.data.result
      }
    } catch {
      // 静默失败，不影响主功能
    } finally {
      suggestLoading.value = false
    }
  }

  const clearSuggestions = () => {
    suggestResult.value = null
  }

  return {
    // 搜索结果
    keyword,
    songs,
    artists,
    loading,
    errorMsg,
    performSearch,
    clearSearch,
    // 热搜榜
    hotList,
    hotLoading,
    fetchHotSearch,
    // 搜索建议
    suggestResult,
    suggestLoading,
    fetchSuggestions,
    clearSuggestions,
  }
})
