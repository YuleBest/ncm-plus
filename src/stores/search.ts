import { defineStore } from 'pinia'
import { ref } from 'vue'
import { searchMusic, type Song } from '@/api/search/searchMusic'

export const useSearchStore = defineStore('search', () => {
  const keyword = ref('')
  const songs = ref<Song[]>([])
  const loading = ref(false)
  const errorMsg = ref('')

  const performSearch = async (query?: string) => {
    const searchKeyword = query ?? keyword.value
    if (!searchKeyword.trim()) {
      songs.value = []
      return
    }

    loading.value = true
    errorMsg.value = ''

    try {
      const res = await searchMusic({ keywords: searchKeyword })
      if (res.data?.code === 200) {
        songs.value = res.data.result?.songs || []
        if (query) keyword.value = query
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

  const clearSearch = () => {
    keyword.value = ''
    songs.value = []
    errorMsg.value = ''
  }

  return {
    keyword,
    songs,
    loading,
    errorMsg,
    performSearch,
    clearSearch,
  }
})
