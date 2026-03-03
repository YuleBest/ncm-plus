<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MessageCircle,
  Heart,
} from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import CommentPanel from '@/components/player/CommentPanel.vue'
import { getSongDetail as getRedCount } from '@/api/song/red/count'
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import { formatSeconds as formatTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

// 评论面板
const showComments = ref(false)
const commentCount = ref(0)
const heartCountDesc = ref('')

const fmtCommentBadge = computed(() => {
  if (commentCount.value <= 0) return ''
  if (commentCount.value >= 10000)
    return (commentCount.value / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  if (commentCount.value > 999) return '999+'
  return String(commentCount.value)
})

const fetchHeartCount = async (id: number) => {
  if (!id) return
  try {
    const res = await getRedCount({ id })
    if (res.data.code === 200) {
      heartCountDesc.value = res.data.data.countDesc || String(res.data.data.count)
    }
  } catch {
    // 静默失败
  }
}

watch(
  () => playerStore.currentSong?.id,
  (id) => {
    heartCountDesc.value = ''
    if (id) fetchHeartCount(id)
  },
  { immediate: true },
)

// 返回上一页
const isExiting = ref(false)
const isEntering = ref(true)

const goBack = () => {
  if (isExiting.value) return
  isExiting.value = true
  setTimeout(() => {
    playerStore.closePlayer()
  }, 360) // 动画时长 350ms，留 10ms 缓冲确保动画完成后再关闭覆盖层
}

// 跳转到歌手页（关闭播放器 → 导航）
const goToArtist = (artistId: number) => {
  if (!artistId) return
  isExiting.value = true
  setTimeout(() => {
    playerStore.closePlayer()
    router.push(`/artist/${artistId}`)
  }, 360)
}

// 挂载时检查 URL 参数
onMounted(() => {
  const queryId = route.query.id
  if (queryId) {
    const id = Number(queryId)
    // 如果当前没在播这首歌，或者没在播放，则尝试加载
    if (playerStore.currentSong?.id !== id) {
      playerStore.playSong(id)
    }
  }

  // 刚进入页面时尝试立即定位歌词
  scrollToCurrentLyric(true)

  // 触发进入动画
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isEntering.value = false
    })
  })
})

// 拖拽进度条相关
const isDragging = ref(false)
const dragTime = ref(0) // 拖拽时临时展示的时间

// 当不在拖拽时，让拖拽时间跟随播放进度
watch(
  () => playerStore.currentTime,
  (val) => {
    if (!isDragging.value) {
      dragTime.value = val
    }
  },
)

const handleSeekStart = () => {
  isDragging.value = true
  isUserScrolling.value = false
}

const handleSeekEnd = () => {
  if (!isDragging.value) return
  playerStore.seek(dragTime.value)
  isDragging.value = false
}

// 显示给 UI 的播放进度时间：如果在拖拽中则优先显示临时时间
const displayTime = computed(() => {
  return isDragging.value ? dragTime.value : playerStore.currentTime
})

// UI 显示的歌词索引：拖拽时根据拖拽时间计算，否则跟随播放器
const displayLyricIndex = computed(() => {
  if (isDragging.value) {
    const timeInMs = dragTime.value * 1000
    const lyrics = playerStore.lyrics
    if (!lyrics || lyrics.length === 0) return -1

    let l_index = lyrics.findIndex((l) => l.time > timeInMs) - 1
    if (l_index < 0) {
      const firstLyricTime = lyrics[0]?.time ?? 0
      l_index = timeInMs < firstLyricTime ? 0 : lyrics.length - 1
    }
    return l_index
  }
  return playerStore.currentLyricIndex
})

// 进度条百分比
const progressPercent = computed(() => {
  if (!playerStore.duration) return 0
  return (displayTime.value / playerStore.duration) * 100
})

// 移动端大封面模式 (默认关闭，显示大歌词)
const isMobileCoverMode = ref(false)

const touchState = { startX: 0, startY: 0, isMoved: false }
const handleTouchStart = (e: TouchEvent) => {
  touchState.startX = e.touches[0]!.clientX
  touchState.startY = e.touches[0]!.clientY
  touchState.isMoved = false
}
const handleTouchMove = (e: TouchEvent) => {
  const dx = Math.abs(e.touches[0]!.clientX - touchState.startX)
  const dy = Math.abs(e.touches[0]!.clientY - touchState.startY)
  if (dx > 10 || dy > 10) {
    touchState.isMoved = true
  }
}
const handleLyricClick = () => {
  if (!touchState.isMoved) {
    isMobileCoverMode.value = true
  }
}
const handleCoverClick = () => {
  if (!touchState.isMoved) {
    isMobileCoverMode.value = false
  }
}

const handleLyricLineClick = (timeMs: number, index: number) => {
  if (touchState.isMoved) return

  if (isUserScrolling.value || index !== displayLyricIndex.value) {
    playerStore.seek(timeMs / 1000)
    isUserScrolling.value = false
    if (scrollResumeTimer) {
      clearTimeout(scrollResumeTimer)
      scrollResumeTimer = null
    }
  } else {
    isMobileCoverMode.value = true
  }
}

const shortLyrics = computed(() => {
  const lyrics = playerStore.lyrics
  if (!lyrics || lyrics.length === 0) return []
  const current = displayLyricIndex.value < 0 ? 0 : displayLyricIndex.value
  const lines = []
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 0 && i < lyrics.length) {
      lines.push({ text: lyrics[i]!.text, originalIndex: i })
    } else {
      lines.push({ text: ' ', originalIndex: `empty-${i}` })
    }
  }
  return lines
})

// ----- 歌词同步滚动区 -----
const lyricListRef = ref<HTMLElement | null>(null)

// 用户手动滚动歌词相关
const isUserScrolling = ref(false)
let scrollResumeTimer: ReturnType<typeof setTimeout> | null = null

const handleUserScrollInteraction = () => {
  isUserScrolling.value = true
  if (scrollResumeTimer) {
    clearTimeout(scrollResumeTimer)
  }
  scrollResumeTimer = setTimeout(() => {
    isUserScrolling.value = false
    scrollToCurrentLyric(false)
  }, 3000)
}

const scrollToCurrentLyric = (instant = false) => {
  if (!lyricListRef.value || displayLyricIndex.value < 0 || isUserScrolling.value) return
  nextTick(() => {
    // 稍加延迟，确保 display:none 恢复后的 clientHeight 计算正确
    setTimeout(() => {
      if (!lyricListRef.value) return
      const container = lyricListRef.value
      const activeEl = container.querySelector('.lyric-line.active') as HTMLElement
      if (activeEl) {
        // 计算偏移：使高亮歌词行处于可视区域中间
        const offset = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2
        container.scrollTo({
          top: Math.max(0, Math.floor(offset)),
          behavior: instant ? 'auto' : 'smooth',
        })
      }
    }, 10)
  })
}

// 响应歌词行的变化，自动滚动到正中央
watch(
  () => displayLyricIndex.value,
  () => scrollToCurrentLyric(isDragging.value),
)

// 切换大封面模式时，如果回到歌词也立即定位
watch(isMobileCoverMode, (newVal) => {
  if (!newVal) {
    scrollToCurrentLyric(true)
  }
})

const qualityLabelMap = {
  exhigh: '极高',
  higher: '较高',
  standard: '标准',
} as const

const cycleQuality = () => {
  const map: Record<'standard' | 'higher' | 'exhigh', 'standard' | 'higher' | 'exhigh'> = {
    exhigh: 'higher',
    higher: 'standard',
    standard: 'exhigh',
  }
  playerStore.setTargetQuality(map[playerStore.targetQuality])
}
</script>

<template>
  <div
    class="play-page"
    v-if="playerStore.currentSong"
    :class="{ 'is-exiting': isExiting, 'is-entering': isEntering }"
  >
    <!-- 动态模糊背景（使用小图提升模糊性能） -->
    <div
      class="bg-blur"
      :style="{ backgroundImage: `url(${playerStore.currentSong.al.picUrl}?param=100y100)` }"
    ></div>
    <div class="bg-mask"></div>

    <!-- 顶部导航条 -->
    <header class="play-header">
      <button class="nav-btn" @click="goBack">
        <ChevronDown :size="28" color="#fff" />
      </button>
      <div class="header-info mobile-only">
        <div class="song-title">{{ playerStore.currentSong.name }}</div>
        <div class="song-artist">
          <template v-for="(ar, i) in playerStore.currentSong.ar" :key="ar.id">
            <span class="artist-link" @click.stop="goToArtist(ar.id)">{{ ar.name }}</span>
            <span v-if="i < playerStore.currentSong.ar.length - 1" class="artist-sep"> / </span>
          </template>
        </div>
      </div>

      <!-- 音质切换 -->
      <div class="quality-switcher" @click="cycleQuality">
        <span class="quality-badge">{{ qualityLabelMap[playerStore.targetQuality] }}</span>
        <span
          class="quality-actual"
          v-if="playerStore.currentQuality !== playerStore.targetQuality"
        >
          (实际: {{ qualityLabelMap[playerStore.currentQuality] }})
        </span>
      </div>
    </header>

    <!-- 核心视图区 -->
    <div class="play-content" :class="{ 'show-cover': isMobileCoverMode }">
      <!-- 左侧 / 上侧：封面与控制器 -->
      <div class="left-side">
        <div
          class="record-section"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @click="handleCoverClick"
        >
          <!-- 桌面端：圆角封面 -->
          <div class="desktop-cover-container desktop-only">
            <img
              :src="playerStore.currentSong.al.picUrl + '?param=400y400'"
              alt="cover"
              class="cover-img"
            />
          </div>
          <!-- 移动端：方形圆角封面 -->
          <img
            :src="playerStore.currentSong.al.picUrl + '?param=600y600'"
            alt="cover"
            class="mobile-square-cover mobile-only"
          />
        </div>

        <!-- 桌面端：歌曲信息放在封面下 -->
        <div class="desktop-info desktop-only">
          <span class="song-title">{{ playerStore.currentSong.name }}</span>
          <span class="song-dash">-</span>
          <span class="song-artist">
            <template v-for="(ar, i) in playerStore.currentSong.ar" :key="ar.id">
              <span class="artist-link" @click.stop="goToArtist(ar.id)">{{ ar.name }}</span>
              <span v-if="i < playerStore.currentSong.ar.length - 1" class="artist-sep"> / </span>
            </template>
          </span>
        </div>

        <!-- 移动端短歌词 (大封面模式下显示) -->
        <div
          class="mobile-short-lyrics mobile-only"
          v-if="isMobileCoverMode"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @click="handleCoverClick"
        >
          <div
            v-for="line in shortLyrics"
            :key="line.originalIndex"
            class="short-lyric-line"
            :class="{
              active: line.originalIndex === displayLyricIndex,
              'empty-line': line.text === ' ',
            }"
          >
            {{ line.text }}
          </div>
        </div>

        <div class="controls-section">
          <div class="error-toast" v-if="playerStore.errorMessage">
            {{ playerStore.errorMessage }}
          </div>
          <div class="trial-notice" v-if="playerStore.currentSong.fee === 1">
            VIP 歌曲，当前仅支持试听前 30 秒
          </div>

          <!-- 评论入口 (移动端) -->
          <div class="comment-row-mobile">
            <button class="comment-trigger-mobile" @click="showComments = true">
              <MessageCircle :size="17" />
              <span v-if="fmtCommentBadge" class="comment-fab-badge">{{ fmtCommentBadge }}</span>
            </button>
            <div class="mobile-heart-stat" v-if="heartCountDesc">
              <Heart :size="12" fill="currentColor" class="stat-heart" />
              <span>{{ heartCountDesc }}</span>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="progress-bar-container">
            <span class="time-text">{{ formatTime(displayTime) }}</span>
            <div class="progress-slider-wrapper">
              <input
                type="range"
                class="progress-slider"
                min="0"
                :max="playerStore.duration || 100"
                step="0.1"
                v-model.number="dragTime"
                @mousedown="handleSeekStart"
                @touchstart="handleSeekStart"
                @change="handleSeekEnd"
                @mouseup="handleSeekEnd"
                @touchend="handleSeekEnd"
              />
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
            </div>
            <span class="time-text">{{ formatTime(playerStore.duration) }}</span>
          </div>

          <!-- 按钮组 -->
          <div class="actions-row">
            <button
              class="action-btn"
              @click="playerStore.prevSong"
              :disabled="playerStore.playlist.length <= 1"
            >
              <SkipBack
                :size="30"
                :color="
                  playerStore.playlist.length <= 1
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(255,255,255,0.8)'
                "
                :fill="
                  playerStore.playlist.length <= 1
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(255,255,255,0.8)'
                "
                :stroke-width="0"
              />
            </button>
            <button class="action-btn play-btn" @click="playerStore.togglePlay">
              <Pause
                v-if="playerStore.isPlaying"
                :size="38"
                color="#fff"
                fill="#fff"
                :stroke-width="0"
              />
              <Play
                v-else
                :size="38"
                color="#fff"
                fill="#fff"
                :stroke-width="0"
                style="margin-left: 4px"
              />
            </button>
            <button
              class="action-btn"
              @click="playerStore.nextSong"
              :disabled="playerStore.playlist.length <= 1"
            >
              <SkipForward
                :size="30"
                :color="
                  playerStore.playlist.length <= 1
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(255,255,255,0.8)'
                "
                :fill="
                  playerStore.playlist.length <= 1
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(255,255,255,0.8)'
                "
                :stroke-width="0"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧 / 下侧：歌词区 -->
      <div
        class="right-side"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @click="handleLyricClick"
      >
        <div
          class="lyric-section"
          ref="lyricListRef"
          :class="{ 'user-scrolling': isUserScrolling }"
          @wheel="handleUserScrollInteraction"
          @touchmove="handleUserScrollInteraction"
        >
          <div v-if="playerStore.lyrics.length > 0" class="lyric-wrapper">
            <div
              v-for="(line, index) in playerStore.lyrics"
              :key="index"
              class="lyric-line"
              :class="{
                active: displayLyricIndex === index,
                'has-trans': !!line.translation,
              }"
              :style="{
                '--distance': Math.abs(index - displayLyricIndex),
              }"
              @click.stop="handleLyricLineClick(line.time, index)"
            >
              <template v-if="line.translation">
                <div class="lyric-trans">{{ line.translation }}</div>
                <div class="lyric-original">{{ line.text }}</div>
              </template>
              <template v-else>
                <div class="lyric-text">{{ line.text }}</div>
              </template>
            </div>
          </div>
          <div v-else class="lyric-empty">纯音乐，请欣赏</div>
        </div>
      </div>

      <!-- 全局 Loading 遮罩 -->
      <div v-if="playerStore.isLoading" class="page-loading-overlay">
        <div class="page-loading-spinner"></div>
      </div>
    </div>
  </div>

  <!-- 空白状态防崩溃 -->
  <div
    class="play-page empty-fallback"
    v-else
    :class="{ 'is-exiting': isExiting, 'is-entering': isEntering }"
  >
    <div v-if="playerStore.isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>正在加载音乐...</span>
    </div>
    <button v-else class="nav-btn fallback-btn" @click="goBack">
      <ChevronDown :size="28" color="#333" />
      <span>未加载音乐，点击返回</span>
    </button>
  </div>

  <!-- PC 评论入口悬浮按钮组 -->
  <div class="comment-fab-group desktop-only" v-if="playerStore.currentSong">
    <button
      class="comment-fab"
      :class="{ active: showComments }"
      @click="showComments = !showComments"
      title="查看评论"
    >
      <MessageCircle :size="20" />
      <span v-if="fmtCommentBadge" class="comment-fab-badge">{{ fmtCommentBadge }}</span>
    </button>
    <div class="comment-fab-stats" v-if="heartCountDesc">
      <Heart :size="11" fill="currentColor" class="stat-heart" />
      <span>{{ heartCountDesc }}</span>
    </div>
  </div>

  <!-- 评论面板 -->
  <CommentPanel
    :song-id="playerStore.currentSong?.id ?? 0"
    :visible="showComments"
    @close="showComments = false"
    @update:count="commentCount = $event"
  />
</template>

<style lang="scss" scoped>
.play-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 500;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #222;
  transition:
    transform 0.35s cubic-bezier(0.33, 1, 0.68, 1),
    opacity 0.35s cubic-bezier(0.33, 1, 0.68, 1);
}

.play-page.is-exiting,
.play-page.is-entering {
  transform: translateY(100vh);
  opacity: 0;
}

/* 动态模糊背景：利用缩放放大（类似 mipmap）和硬件加速优化高斯模糊性能 */
.bg-blur {
  position: absolute;
  top: 50%;
  left: 50%;
  /* 减小一半的渲染面积，大大减少模糊计算量 */
  width: 50%;
  height: 50%;
  background-size: cover;
  background-position: center;
  /* 模糊半径可以适当减小，因为后续由 scale 放大后视觉效果翻倍 */
  filter: blur(80px);
  opacity: 0.6;
  z-index: -2;
  /* 居中，然后放大2.5倍以覆盖全屏外加出血位（隐藏掉模糊黑边），同时开启硬件加速 */
  transform: translate(-50%, -50%) scale(2.5) translateZ(0);
  will-change: transform;
}
.bg-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: -1;
}

/* 顶部导航条 */
.play-header {
  position: fixed;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  margin-top: env(safe-area-inset-top);
}
.nav-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* PC 评论入口悬浮按钮组 */
.comment-fab-group {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 550;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.comment-fab {
  position: relative;
  overflow: visible;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.active {
    background: rgba(255, 255, 255, 0.22);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.35);
  }
}

.comment-fab-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  box-sizing: border-box;
}

.comment-fab-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;

  .stat-heart {
    color: #ff5a5f;
    flex-shrink: 0;
  }
}

.quality-switcher {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
  min-width: 44px; /* balance the flex center */
}
.quality-badge {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
}
.quality-badge:active {
  background: rgba(255, 255, 255, 0.2);
}
.quality-actual {
  font-size: 9px;
  color: rgba(255, 149, 0, 0.9);
  margin-top: 2px;
  transform: scale(0.9);
  transform-origin: right;
  white-space: nowrap;
}
.header-info {
  flex: 1;
  text-align: center;
  overflow: hidden;
}
.song-title {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.song-artist {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.artist-link {
  cursor: pointer;
  transition: opacity var(--transition-fast);
  &:hover {
    opacity: 0.8;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  &:active {
    opacity: 0.6;
  }
}
.artist-sep {
  pointer-events: none;
}

/* 桌面端特有信息样式 */
.desktop-info {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;

  .song-title {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 0;
    text-align: center;
    max-width: 60%;
  }

  .song-dash {
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
  }

  .song-artist {
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
    font-weight: 400;
    text-align: center;
    max-width: 30%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* 短歌词区 (移动端) */
.mobile-short-lyrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 0 16px;
  margin-bottom: 8px;
}
.short-lyric-line {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  min-height: 21px;
  transition: all 0.3s ease;
}
.short-lyric-line.active {
  color: #fff;
  font-size: 15px;
  font-weight: 500;
}
.short-lyric-line.empty-line {
  color: transparent;
}

/* 核心展示区 */
.play-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px 0;
  gap: 20px;
  justify-content: center;
}

/* 左侧：封面与控制器 */
.left-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 30px;
}

/* 黑胶区域 */
.record-section {
  display: flex;
  align-items: center;
  justify-content: center;
}
.desktop-cover-container {
  width: 280px;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: none; /* 删掉阴影 */
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
  z-index: 1;
}

/* 黑胶旋转效果 - 保持定义以防其他地方用到，但在桌面端已停用 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.rotating {
  animation: spin 20s linear infinite;
}

/* 控制器区域 */
.controls-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 320px; /* 同步缩小为 320px */
}

.error-toast {
  text-align: center;
  color: #ff5a5f;
  background-color: rgba(255, 90, 95, 0.1);
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
}

.trial-notice {
  text-align: center;
  color: #ff9500;
  background-color: rgba(255, 149, 0, 0.1);
  padding: 8px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid rgba(255, 149, 0, 0.2);
}

/* 进度条 */
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}
.time-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  width: 40px;
  text-align: center;
}
.progress-slider-wrapper {
  flex: 1;
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}
.progress-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  pointer-events: none;
}
.progress-fill {
  height: 100%;
  background-color: #fff;
  border-radius: 2px;
}
.progress-slider {
  position: absolute;
  width: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

/* 移动端评论入口按钮：默认隐藏，仅在移动端以 flex 显示 */
.comment-row-mobile {
  display: none;
}

.comment-trigger-mobile {
  position: relative;
  overflow: visible;
}

@media (max-width: 768px) {
  .comment-row-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .comment-trigger-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.45);
    padding: 6px;
    cursor: pointer;
    transition: color 0.2s;

    &:active {
      color: rgba(255, 255, 255, 0.75);
    }

    .comment-fab-badge {
      top: 0;
      right: 0;
    }
  }

  .mobile-heart-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    pointer-events: none;

    .stat-heart {
      color: #ff5a5f;
      opacity: 0.7;
    }
  }
}

/* 控制按钮组 */
.actions-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
}
.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  transition: all 0.2s;

  &:active {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(0.95);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.play-btn {
  width: 56px;
  height: 56px;
}

/* 右侧：歌词区 */
.right-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.lyric-section {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  position: relative; /* 确保 offsetTop 计算基准正确 */
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  scroll-behavior: smooth;
}
.lyric-section::-webkit-scrollbar {
  display: none;
}
.lyric-wrapper {
  padding: 40% 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.lyric-line {
  color: rgba(255, 255, 255, 0.4);
  font-size: 24px;
  font-weight: 500;
  line-height: 1.5; /* 增加行高适配换行 */
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  transform-origin: left center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 85%; /* 设置最大宽度允许换行 */
  word-wrap: break-word;
  word-break: break-word;

  /* 径向渐变模糊：距离活动行越远越模糊，最小 1px，最大 3px
     通过 --distance CSS变量由 Vue 模板动态传入 */
  --blur-val: calc(0.5px + var(--distance, 0) * 0.4px);
  filter: blur(min(var(--blur-val), 3px));

  opacity: 0.6;
}

/* 用户手动滑动时取消模糊 */
.lyric-section.user-scrolling .lyric-line {
  filter: blur(0) !important;
}

.lyric-line.active {
  color: #fff;
  font-weight: 600;
  transform: scale(1.1);
  filter: blur(0); /* 激活时去除模糊 */
  opacity: 1;
}
.lyric-line.active .lyric-original {
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
}
.lyric-original {
  font-size: 16px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.4s ease;
}
.lyric-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: rgba(255, 255, 255, 0.6);
  font-size: 20px;
}

/* 响应式适配 (移动端) */
@media (max-width: 768px) {
  .play-header {
    position: static;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    flex-shrink: 0;
    margin-top: 10px;
  }
  .play-content {
    flex-direction: column;
    padding: 0 24px;
    gap: 0;
  }
  .left-side {
    order: 2; /* 进度条和控件放在下面 */
    flex: 0 0 auto;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    gap: 20px;
    padding: 20px 0 calc(30px + env(safe-area-inset-bottom));
    background: transparent;
    border-radius: 0;
  }
  .record-section {
    display: none !important; /* 移动端隐藏专辑封面 (非封面模式下) */
  }

  /* --- 大封面模式 --- */
  .play-content.show-cover .right-side {
    display: none !important;
  }
  .play-content.show-cover .left-side {
    flex: 1; /* 取消 0 0 auto，让其填满高度 */
    justify-content: space-between;
    padding: 10px 0 calc(30px + env(safe-area-inset-bottom));
  }
  .play-content.show-cover .record-section {
    display: flex !important;
    flex: 1;
    align-items: center;
    justify-content: center;
  }
  .mobile-square-cover {
    width: 85vw;
    max-width: 270px;
    height: 85vw;
    max-height: 270px;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  /* ---------------- */
  .controls-section {
    flex: none;
    width: 100%;
    gap: 16px;
  }
  .actions-row {
    gap: 24px; /* 间距变小 */
    justify-content: center;
  }
  .action-btn .lucide {
    width: 28px !important;
    height: 28px !important;
  }
  .progress-bar-container {
    margin-bottom: 8px;
    gap: 12px;
  }
  .time-text {
    width: 38px;
    font-size: 11px;
  }

  .right-side {
    order: 1; /* 歌词放在上面 */
    flex: 1;
    padding-top: 20px;
    width: 100%;
  }
  .lyric-section {
    mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 10%,
      black 90%,
      transparent 100%
    );
  }
  .lyric-wrapper {
    padding: 30% 0 30% 0;
  }
  .lyric-line {
    font-size: 20px;
    text-align: left;
    transform-origin: left center;
    gap: 10px;
  }
  .lyric-line.active {
    transform: scale(1.1);
  }
  .lyric-line.active .lyric-original {
    font-size: 16px;
  }
  .lyric-empty {
    justify-content: flex-start;
  }
}

.empty-fallback {
  background-color: var(--color-bg);
  justify-content: center;
  align-items: center;
}
.fallback-btn {
  color: var(--color-text);
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-secondary);
}

/* 全屏 Loading 遮罩 */
.page-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(34, 34, 34, 0.7);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
}
.page-loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}
@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式工具类 (确保权重，放在最后) */
.mobile-only {
  display: none !important;
}
@media (max-width: 768px) {
  .mobile-only {
    display: block !important;
  }
  .desktop-only {
    display: none !important;
  }
}
</style>
