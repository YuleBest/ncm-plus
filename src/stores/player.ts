import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSongCheck } from '@/api/check/music'
import { getSongDetail, type SongDetail } from '@/api/song/detail'
import { getSongUrl } from '@/api/song/url/v1'
import { getSongLyricNew } from '@/api/lyric/new'

export interface ParsedLyricWord {
  startTime: number // 毫秒
  duration: number // 毫秒
  text: string
}

export interface ParsedLyric {
  time: number // 行开始时间，毫秒
  text: string
  translation?: string
  words?: ParsedLyricWord[] // 逐字歌词（来自 yrc），无此字段时为逐行歌词
}

export type AudioQuality = 'standard' | 'higher' | 'exhigh'
export type PlayMode = 'list' | 'single' | 'random'

/** 解析标准 LRC 格式，返回 { time, text } 列表（供 parseLyric / parseYrcLyric 共用） */
const parseStandardLrc = (lrc: string): { time: number; text: string }[] => {
  const lines = lrc.split('\n')
  const timeRegExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g
  const result: { time: number; text: string }[] = []

  for (const line of lines) {
    timeRegExp.lastIndex = 0
    const match = timeRegExp.exec(line)
    if (!match) continue

    const txt = line.replace(timeRegExp, '').trim()
    if (!txt) continue

    const min = parseInt(match[1] || '0', 10)
    const sec = parseInt(match[2] || '0', 10)
    const msStr = match[3] || '0'
    const ms = parseInt(msStr.padEnd(3, '0'), 10)
    const timeInMs = min * 60 * 1000 + sec * 1000 + ms

    result.push({ time: timeInMs, text: txt })
  }
  return result
}

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

  const playMode = ref<PlayMode>((localStorage.getItem('ncm-play-mode') as PlayMode) || 'list')
  const setPlayMode = (mode: PlayMode) => {
    playMode.value = mode
    localStorage.setItem('ncm-play-mode', mode)
  }

  // 歌词时间调整（提前或延后），默认提前 0.2 秒
  const lyricOffset = ref<number>(parseFloat(localStorage.getItem('ncm-lyric-offset') || '0.2'))
  const setLyricOffset = (offset: number) => {
    lyricOffset.value = offset
    localStorage.setItem('ncm-lyric-offset', offset.toString())
    // 立即刷新歌词位置
    updateLyricIndex(audio.currentTime * 1000)
  }

  // 歌词字体大小调整倍数
  const lyricScale = ref<number>(parseFloat(localStorage.getItem('ncm-lyric-scale') || '1.0'))
  const setLyricScale = (scale: number) => {
    lyricScale.value = scale
    localStorage.setItem('ncm-lyric-scale', scale.toString())
  }

  // 歌词数据
  const lyrics = ref<ParsedLyric[]>([])
  const currentLyricIndex = ref(0)

  // URL 缓存：key 格式为 `${songId}-${quality}`
  const urlCache = new Map<string, string>()

  // 加载与错误状态
  const isLoading = ref(false)
  const errorMessage = ref('')

  // 播放页面覆盖层的显示状态
  const isPlayerOpen = ref(false)
  const openPlayer = () => {
    isPlayerOpen.value = true
  }
  const closePlayer = () => {
    isPlayerOpen.value = false
  }

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
    if (playMode.value === 'single') {
      audio.currentTime = 0
      audio.play()
    } else {
      nextSong(true)
    }
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

  // 根据 ID 和目标音质获取带降级的 URL
  const fetchUrlWithFallback = async (
    songId: number,
    target: AudioQuality,
  ): Promise<{ url: string; level: AudioQuality }> => {
    const exactCacheKey = `${songId}-${target}`
    if (urlCache.has(exactCacheKey)) {
      return { url: urlCache.get(exactCacheKey)!, level: target }
    }

    const levels: AudioQuality[] = ['exhigh', 'higher', 'standard']
    const startIndex = levels.indexOf(target)
    const fallbackLevels = levels.slice(startIndex !== -1 ? startIndex : 0)

    for (const level of fallbackLevels) {
      const cacheKey = `${songId}-${level}`
      if (urlCache.has(cacheKey)) {
        return { url: urlCache.get(cacheKey)!, level }
      }
      const res = await getSongUrl({ id: songId, level })
      const urlData = res.data?.data?.[0] as Record<string, unknown> | undefined
      if (urlData?.url) {
        const resolvedUrl = urlData.url as string
        urlCache.set(cacheKey, resolvedUrl)
        if (level !== target) {
          urlCache.set(exactCacheKey, resolvedUrl)
        }
        return { url: resolvedUrl, level }
      }
    }
    throw new Error('无法获取播放链接，可能为 VIP 专享或全音质无版权')
  }

  // 预加载当前曲目 -2 到 +4 首歌的 URL
  const preloadUrls = () => {
    if (playlist.value.length <= 1 || currentPlaylistIndex.value === -1) return
    const len = playlist.value.length

    // Set 用于去重（防歌单较短时重复预加载相同歌曲）
    const indicesToLoad = new Set<number>()
    for (let i = -2; i <= 4; i++) {
      if (i === 0) continue
      let targetIdx = (currentPlaylistIndex.value + i) % len
      if (targetIdx < 0) targetIdx += len
      indicesToLoad.add(targetIdx)
    }

    indicesToLoad.forEach((idx) => {
      const songToLoad = playlist.value[idx]
      if (songToLoad) {
        // 静默预加载，不抛出错误
        fetchUrlWithFallback(songToLoad.id, targetQuality.value).catch(() => {})
      }
    })
  }

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

      // 2. 并行获取 详情 + URL + 歌词
      const [detailRes, urlDataObj, lyricRes] = await Promise.all([
        getSongDetail({ ids: String(id) }),
        fetchUrlWithFallback(id, targetQuality.value),
        getSongLyricNew({ id }),
      ])

      // 验证数据完整性
      if (!detailRes.data?.songs?.length) throw new Error('无法获取歌曲详情')
      const songData = detailRes.data.songs[0]

      const url = urlDataObj.url
      currentQuality.value = urlDataObj.level as AudioQuality

      // 解析并存储歌词：优先使用逐字歌词（yrc），无则 fallback 到逐行歌词（lrc）
      const lyricData = lyricRes.data
      const yrcLyric = lyricData?.yrc?.lyric
      const lrcLyric = lyricData?.lrc?.lyric || ''
      const tlrcLyric = lyricData?.tlyric?.lyric || ''
      const ytlrcLyric = lyricData?.ytlrc?.lyric || ''

      lyrics.value = yrcLyric
        ? parseYrcLyric(yrcLyric, ytlrcLyric || tlrcLyric)
        : parseLyric(lrcLyric, tlrcLyric)

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

      // 触发预加载相邻的歌曲 URL
      preloadUrls()

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
    if (playlist.value.length === 0) return
    if (playlist.value.length === 1) {
      audio.currentTime = 0
      audio.play()
      return
    }

    let prevIdx = currentPlaylistIndex.value
    if (playMode.value === 'random') {
      do {
        prevIdx = Math.floor(Math.random() * playlist.value.length)
      } while (prevIdx === currentPlaylistIndex.value)
    } else {
      prevIdx = currentPlaylistIndex.value - 1
      if (prevIdx < 0) {
        prevIdx = playlist.value.length - 1
      }
    }
    currentPlaylistIndex.value = prevIdx
    playSong(playlist.value[prevIdx]!.id)
  }

  // 下一首
  const nextSong = (_isAuto = false) => {
    if (playlist.value.length === 0) return
    if (playlist.value.length === 1) {
      audio.currentTime = 0
      audio.play()
      return
    }

    let nextIdx = currentPlaylistIndex.value
    if (playMode.value === 'random') {
      do {
        nextIdx = Math.floor(Math.random() * playlist.value.length)
      } while (nextIdx === currentPlaylistIndex.value)
    } else {
      nextIdx = currentPlaylistIndex.value + 1
      if (nextIdx >= playlist.value.length) {
        nextIdx = 0
      }
    }
    currentPlaylistIndex.value = nextIdx
    playSong(playlist.value[nextIdx]!.id)
  }

  // 移除歌曲
  const removeSong = (index: number) => {
    if (index < 0 || index >= playlist.value.length) return

    if (index === currentPlaylistIndex.value) {
      playlist.value.splice(index, 1)
      if (playlist.value.length === 0) {
        audio.pause()
        audio.src = ''
        isPlaying.value = false
        currentSong.value = null
        currentUrl.value = ''
        currentPlaylistIndex.value = -1
        return
      }
      let nextIdx = index
      if (nextIdx >= playlist.value.length) {
        nextIdx = 0
      }
      currentPlaylistIndex.value = nextIdx
      playSong(playlist.value[nextIdx]!.id)
    } else {
      playlist.value.splice(index, 1)
      if (index < currentPlaylistIndex.value) {
        currentPlaylistIndex.value -= 1
      }
    }
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

  /** 解析普通逐行 LRC 歌词，支持合并翻译 */
  const parseLyric = (lrcString: string, tlrcString?: string): ParsedLyric[] => {
    if (!lrcString) return []
    const mainLyrics = parseStandardLrc(lrcString)
    const transLyrics = tlrcString ? parseStandardLrc(tlrcString) : []
    return mainLyrics
      .map((main) => ({
        ...main,
        translation: transLyrics.find((t) => Math.abs(t.time - main.time) < 50)?.text,
      }))
      .sort((a, b) => a.time - b.time)
  }

  /**
   * 解析 YRC 逐字歌词
   *
   * 行格式：[行起始ms,行时长ms](字起始ms,字时长ms,0)字 ...
   * 开头的 JSON 元数据行（以 { 开头）会被跳过。
   * tlrcString 为标准 LRC 格式的翻译歌词（ytlrc 或 tlyric），时间戳对齐后合并。
   */
  const parseYrcLyric = (yrcString: string, tlrcString?: string): ParsedLyric[] => {
    if (!yrcString) return []

    const transLyrics = tlrcString ? parseStandardLrc(tlrcString) : []
    const result: ParsedLyric[] = []

    const lineHeaderReg = /^\[(\d+),\d+\]/
    const wordReg = /\((\d+),(\d+),\d+\)([^(]*)/g

    for (const line of yrcString.split('\n')) {
      // 跳过 JSON 元数据行
      if (line.trim().startsWith('{')) continue

      const headerMatch = lineHeaderReg.exec(line)
      if (!headerMatch) continue

      const lineStart = parseInt(headerMatch[1]!, 10)
      const words: ParsedLyricWord[] = []
      let fullText = ''

      wordReg.lastIndex = 0
      let wordMatch
      while ((wordMatch = wordReg.exec(line)) !== null) {
        const text = wordMatch[3]!
        if (!text) continue
        words.push({
          startTime: parseInt(wordMatch[1]!, 10),
          duration: parseInt(wordMatch[2]!, 10),
          text,
        })
        fullText += text
      }

      if (words.length === 0) continue

      result.push({
        time: lineStart,
        text: fullText,
        translation: transLyrics.find((t) => Math.abs(t.time - lineStart) < 50)?.text,
        words,
      })
    }

    return result.sort((a, b) => a.time - b.time)
  }

  // 解锁浏览器自动播放限制（由用户手势触发）
  const unlock = () => {
    if (audio.paused) {
      // 尝试在没有任何 src 的情况下播放并立即暂停，以获取"用户触发"的播放权限
      audio.play().catch(() => {})
      audio.pause()
    }
  }

  // 根据当前毫秒数更新正在唱到的歌词行索引
  const updateLyricIndex = (timeInMs: number) => {
    if (lyrics.value.length === 0) return

    const adjustedTime = timeInMs + lyricOffset.value * 1000
    let l_index = lyrics.value.findIndex((l) => l.time > adjustedTime) - 1
    if (l_index < 0) {
      const firstLyricTime = lyrics.value[0]?.time ?? 0
      l_index = adjustedTime < firstLyricTime ? 0 : lyrics.value.length - 1
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
    lyricOffset,
    lyricScale,
    isLoading,
    errorMessage,
    playSong,
    playMode,
    setPlayMode,
    playList,
    prevSong,
    nextSong,
    removeSong,
    togglePlay,
    seek,
    setVolume,
    setTargetQuality,
    setLyricOffset,
    setLyricScale,
    unlock,
    isPlayerOpen,
    openPlayer,
    closePlayer,
  }
})
