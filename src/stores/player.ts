import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSongCheck } from '@/api/song/songCheck'
import { getSongDetail, type SongDetail } from '@/api/song/songDetail'
import { getSongUrl } from '@/api/song/getSongUrl'
import { getSongLyric } from '@/api/song/getSongLyric'

export interface ParsedLyric {
  time: number // 毫秒
  text: string
  translation?: string
}

export type AudioQuality = 'standard' | 'higher' | 'exhigh'

export const usePlayerStore = defineStore('player', () => {
  // 核心原生音频对象
  const audio = new Audio()

  // 播放状态
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1) // 0 - 1

  // 当前歌曲信息
  const currentSong = ref<SongDetail | null>(null)
  const currentUrl = ref<string>('')

  const targetQuality = ref<AudioQuality>(
    (localStorage.getItem('ncm-audio-quality') as AudioQuality) || 'exhigh',
  )
  const currentQuality = ref<AudioQuality>('standard')

  // 播放列表状态
  const playlist = ref<SongDetail[]>([])
  const currentPlaylistIndex = ref(-1)

  // 歌词数据
  const lyrics = ref<ParsedLyric[]>([])
  const currentLyricIndex = ref(0)

  // 加载与错误状态
  const isLoading = ref(false)
  const errorMessage = ref('')

  // ----- 核心事件绑定 -----
  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime
    // 同步歌词高亮
    updateLyricIndex(audio.currentTime * 1000)
    // 更新 Media Session 进度状态
    syncPlaybackPosition()
  })

  audio.addEventListener('loadedmetadata', () => {
    duration.value = audio.duration
  })

  audio.addEventListener('ended', () => {
    isPlaying.value = false
    nextSong()
  })

  audio.addEventListener('error', (e) => {
    errorMessage.value = '音频加载出错或跨域限制'
    isPlaying.value = false
    isLoading.value = false
    console.error('Audio Error:', e)
  })

  audio.addEventListener('playing', () => {
    isPlaying.value = true
    isLoading.value = false
    updateMediaSessionPlaybackState('playing')
  })

  audio.addEventListener('pause', () => {
    isPlaying.value = false
    updateMediaSessionPlaybackState('paused')
  })

  // ----- 方法暴露 -----

  // 播放指定 ID 的歌曲（完整流程）
  const playSong = async (id: number) => {
    try {
      isLoading.value = true
      errorMessage.value = ''

      // 1. 检查可用性
      const checkRes = await getSongCheck({ id: String(id) })
      if (!checkRes.data?.success) {
        throw new Error(checkRes.data?.message || '歌曲不可用/无版权')
      }

      // 处理降级获取 URL
      const fetchUrlWithFallback = async () => {
        const levels: AudioQuality[] = ['exhigh', 'higher', 'standard']
        const startIndex = levels.indexOf(targetQuality.value)
        const fallbackLevels = levels.slice(startIndex !== -1 ? startIndex : 0)

        for (const level of fallbackLevels) {
          const res = await getSongUrl({ id, level })
          const urlData = res.data?.data?.[0] as Record<string, unknown> | undefined
          if (urlData?.url) {
            return { url: urlData.url as string, level }
          }
        }
        throw new Error('无法获取播放链接，可能为 VIP 专享或全音质无版权')
      }

      // 2. 并行获取 详情 + URL + 歌词
      const [detailRes, urlDataObj, lyricRes] = await Promise.all([
        getSongDetail({ ids: String(id) }),
        fetchUrlWithFallback(),
        getSongLyric({ id }),
      ])

      // 验证数据完整性
      if (!detailRes.data?.songs?.length) throw new Error('无法获取歌曲详情')
      const songData = detailRes.data.songs[0]

      const url = urlDataObj.url
      currentQuality.value = urlDataObj.level as AudioQuality

      // 解析并存储歌词
      const lyricData = lyricRes.data
      const rawLrc = lyricData?.lrc?.lyric || ''
      const rawTlrc = lyricData?.tlyric?.lyric || ''
      lyrics.value = parseLyric(rawLrc, rawTlrc)

      if (songData) {
        console.log('Successfully fetched song metadata:', songData.name)
      }

      // 更新 State
      currentSong.value = songData as SongDetail
      currentUrl.value = url
      currentLyricIndex.value = 0

      // 如果当前播放列表为空，或者播放的歌曲不在列表中，临时将其作为单曲播放列表
      if (playlist.value.length === 0 || currentPlaylistIndex.value === -1) {
        if (!playlist.value.find((s) => s.id === songData?.id)) {
          playlist.value = [songData as SongDetail]
          currentPlaylistIndex.value = 0
        }
      } else {
        // 如果是从列表中选歌播放，确保 index 正确
        const idx = playlist.value.findIndex((s) => s.id === id)
        if (idx !== -1) {
          currentPlaylistIndex.value = idx
        }
      }

      // 装载音频对象
      audio.src = url
      audio.load()

      // 发起播放申请
      console.log('Starting playback for URL:', url)
      audio.play()

      // 更新 Media Session 元数据和动作回调
      updateMediaMetadata()
      registerMediaActions()
    } catch (err: unknown) {
      console.error('PlaySong Error:', err)
      errorMessage.value = err instanceof Error ? err.message : '加载音乐失败'
      currentSong.value = null
      currentUrl.value = ''
    } finally {
      isLoading.value = false
    }
  }

  // 设置目标音质
  const setTargetQuality = (quality: AudioQuality) => {
    targetQuality.value = quality
    localStorage.setItem('ncm-audio-quality', quality)
    // 如果正在播放并且不是处于加载中，则重新加载当前歌曲以应用新音质
    if (currentSong.value && currentUrl.value) {
      const time = currentTime.value
      const wasPlaying = isPlaying.value
      playSong(currentSong.value.id).then(() => {
        // 恢复播放进度
        seek(time)
        if (!wasPlaying && !audio.paused) {
          audio.pause()
          isPlaying.value = false
        }
      })
    }
  }

  // 暂停/恢复 切换
  const togglePlay = () => {
    if (!currentUrl.value) return
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }

  // 播放整个歌单
  const playList = (songs: SongDetail[], startIndex = 0) => {
    if (!songs.length) return
    playlist.value = songs
    currentPlaylistIndex.value = startIndex
    playSong(songs[startIndex]!.id)
  }

  // 上一首
  const prevSong = () => {
    if (playlist.value.length <= 1) return
    let prevIdx = currentPlaylistIndex.value - 1
    if (prevIdx < 0) {
      prevIdx = playlist.value.length - 1
    }
    currentPlaylistIndex.value = prevIdx
    playSong(playlist.value[prevIdx]!.id)
  }

  // 下一首
  const nextSong = () => {
    if (playlist.value.length <= 1) return
    let nextIdx = currentPlaylistIndex.value + 1
    if (nextIdx >= playlist.value.length) {
      nextIdx = 0
    }
    currentPlaylistIndex.value = nextIdx
    playSong(playlist.value[nextIdx]!.id)
  }

  // 拖动进度条
  const seek = (timeInSeconds: number) => {
    if (!currentUrl.value) return
    audio.currentTime = timeInSeconds
    currentTime.value = timeInSeconds
    updateLyricIndex(timeInSeconds * 1000)
    syncPlaybackPosition()
  }

  // 设置音量
  const setVolume = (val: number) => {
    const v = Math.max(0, Math.min(1, val))
    audio.volume = v
    volume.value = v
  }

  // ----- 私有辅助方法 -----

  // 解析简易的 lrc 格式歌词，并支持合并翻译歌词
  const parseLyric = (lrcString: string, tlrcString?: string): ParsedLyric[] => {
    if (!lrcString) return []

    const parseLines = (lrc: string) => {
      const lines = lrc.split('\n')
      const timeRegExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g
      const result: { time: number; text: string }[] = []

      for (const line of lines) {
        timeRegExp.lastIndex = 0
        const match = timeRegExp.exec(line)
        if (!match) continue

        const txt = line.replace(timeRegExp, '').trim()
        if (!txt) continue

        const minStr = match[1] || '0'
        const secStr = match[2] || '0'
        const msStr = match[3] || '0'

        const min = parseInt(minStr, 10)
        const sec = parseInt(secStr, 10)
        const ms = parseInt(msStr.padEnd(3, '0'), 10)
        const timeInMs = min * 60 * 1000 + sec * 1000 + ms

        result.push({ time: timeInMs, text: txt })
      }
      return result
    }

    const mainLyrics = parseLines(lrcString)
    const transLyrics = tlrcString ? parseLines(tlrcString) : []

    // 合并歌词：以主歌词为基准，寻找相同时间的翻译
    const mergedLyrics: ParsedLyric[] = mainLyrics.map((main) => {
      const translation = transLyrics.find((t) => Math.abs(t.time - main.time) < 50)?.text
      return {
        ...main,
        translation,
      }
    })

    return mergedLyrics.sort((a, b) => a.time - b.time)
  }

  // 解锁浏览器自动播放限制（由用户手势触发）
  const unlock = () => {
    if (audio.paused) {
      // 尝试在没有任何 src 的情况下播放并立即暂停，以获取“用户触发”的播放权限
      audio.play().catch(() => {})
      audio.pause()
    }
  }

  // 根据当前毫秒数更新正在唱到的歌词行索引
  const updateLyricIndex = (timeInMs: number) => {
    if (lyrics.value.length === 0) return

    let l_index = lyrics.value.findIndex((l) => l.time > timeInMs) - 1
    if (l_index < 0) {
      const firstLyricTime = lyrics.value[0]?.time ?? 0
      l_index = timeInMs < firstLyricTime ? 0 : lyrics.value.length - 1
    }
    currentLyricIndex.value = l_index
  }

  // ----- Media Session API 相关 -----

  const updateMediaMetadata = () => {
    if (!('mediaSession' in navigator) || !currentSong.value) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.value.name,
      artist: currentSong.value.ar?.[0]?.name || 'Unknown Artist',
      album: currentSong.value.al?.name || '',
      artwork: [
        {
          src: currentSong.value.al?.picUrl + '?param=96y96',
          sizes: '96x96',
          type: 'image/jpeg',
        },
        {
          src: currentSong.value.al?.picUrl + '?param=128y128',
          sizes: '128x128',
          type: 'image/jpeg',
        },
        {
          src: currentSong.value.al?.picUrl + '?param=256y256',
          sizes: '256x256',
          type: 'image/jpeg',
        },
        {
          src: currentSong.value.al?.picUrl + '?param=384y384',
          sizes: '384x384',
          type: 'image/jpeg',
        },
        {
          src: currentSong.value.al?.picUrl + '?param=512y512',
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ],
    })
  }

  const updateMediaSessionPlaybackState = (state: 'playing' | 'paused' | 'none') => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = state
  }

  const syncPlaybackPosition = () => {
    if (!('mediaSession' in navigator) || !audio.duration) return
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: audio.currentTime,
      })
    } catch (e) {
      // 某些浏览器可能在快速切换或 duration 为 NaN 时报错
      console.warn('MS setPositionState error:', e)
    }
  }

  const registerMediaActions = () => {
    if (!('mediaSession' in navigator)) return

    const actions: [MediaSessionAction, () => void][] = [
      ['play', () => audio.play()],
      ['pause', () => audio.pause()],
      ['stop', () => audio.pause()],
      ['previoustrack', () => prevSong()],
      ['nexttrack', () => nextSong()],
    ]

    for (const [action, handler] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch (e) {
        console.warn(`Media session action ${action} not supported`, e)
      }
    }

    // 特殊处理 seekto
    try {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seek(details.seekTime)
        }
      })
    } catch (e) {
      console.warn('Media session action seekto not supported', e)
    }
  }

  return {
    // states
    isPlaying,
    currentTime,
    duration,
    volume,
    currentSong,
    currentUrl,
    targetQuality,
    currentQuality,
    playlist,
    currentPlaylistIndex,
    lyrics,
    currentLyricIndex,
    isLoading,
    errorMessage,
    playSong,
    playList,
    prevSong,
    nextSong,
    togglePlay,
    seek,
    setVolume,
    setTargetQuality,
    unlock,
  }
})
