<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ChevronDown, Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { ref, watch, nextTick, computed, onMounted } from 'vue'

const router = useRouter()
const route = useRoute()
const playerStore = usePlayerStore()

// 返回上一页
const goBack = () => {
  router.back()
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

// 进度条百分比
const progressPercent = computed(() => {
  if (!playerStore.duration) return 0
  return (displayTime.value / playerStore.duration) * 100
})

// 时长格式化
const formatTime = (timeInSeconds: number) => {
  if (!timeInSeconds || isNaN(timeInSeconds)) return '00:00'
  const m = Math.floor(timeInSeconds / 60)
  const s = Math.floor(timeInSeconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ----- 歌词同步滚动区 -----
const lyricListRef = ref<HTMLElement | null>(null)

// 响应歌词行的变化，自动滚动到正中央
watch(
  () => playerStore.currentLyricIndex,
  async (newIndex) => {
    if (!lyricListRef.value || newIndex < 0) return
    await nextTick()

    const container = lyricListRef.value
    const activeEl = container.querySelector('.lyric-line.active') as HTMLElement
    if (activeEl) {
      // 计算偏移：使高亮歌词行处于可视区域中间
      // 使用 offsetTop 配合 container 的 position: relative 确保计算准确
      const offset = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2
      container.scrollTo({
        top: Math.max(0, Math.floor(offset)),
        behavior: 'smooth',
      })
    }
  },
)
</script>

<template>
  <div class="play-page" v-if="playerStore.currentSong">
    <!-- 动态模糊背景 -->
    <div
      class="bg-blur"
      :style="{ backgroundImage: `url(${playerStore.currentSong.al.picUrl})` }"
    ></div>
    <div class="bg-mask"></div>

    <!-- 顶部导航条 -->
    <header class="play-header">
      <button class="nav-btn" @click="goBack">
        <ChevronDown :size="28" color="#fff" />
      </button>
      <div class="header-info">
        <div class="song-title">{{ playerStore.currentSong.name }}</div>
        <div class="song-artist">{{ playerStore.currentSong.ar?.[0]?.name }}</div>
      </div>
      <div class="nav-placeholder"></div>
    </header>

    <!-- 核心视图区 -->
    <div class="play-content">
      <!-- 左侧 / 上侧：封面与控制器 -->
      <div class="left-side">
        <div class="record-section">
          <!-- 桌面端：黑胶唱片 -->
          <div class="record-disk desktop-only" :class="{ rotating: playerStore.isPlaying }">
            <img
              :src="playerStore.currentSong.al.picUrl + '?param=400y400'"
              alt="cover"
              class="cover-img"
            />
          </div>
          <!-- 移动端：方形圆角封面 -->
          <img
            :src="playerStore.currentSong.al.picUrl + '?param=200y200'"
            alt="cover"
            class="mobile-square-cover mobile-only"
          />
        </div>

        <div class="controls-section">
          <div class="error-toast" v-if="playerStore.errorMessage">
            {{ playerStore.errorMessage }}
          </div>
          <div class="trial-notice" v-if="playerStore.currentSong.fee === 1">
            VIP 歌曲，当前仅支持试听前 30 秒
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
            <button class="action-btn" disabled>
              <SkipBack :size="32" color="rgba(255,255,255,0.4)" />
            </button>
            <button class="action-btn play-btn-main" @click="playerStore.togglePlay">
              <Pause v-if="playerStore.isPlaying" :size="36" color="#fff" />
              <Play v-else :size="36" color="#fff" style="margin-left: 4px" />
            </button>
            <button class="action-btn" disabled>
              <SkipForward :size="32" color="rgba(255,255,255,0.4)" />
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧 / 下侧：歌词区 -->
      <div class="right-side">
        <div class="lyric-section" ref="lyricListRef">
          <div v-if="playerStore.lyrics.length > 0" class="lyric-wrapper">
            <div
              v-for="(line, index) in playerStore.lyrics"
              :key="index"
              class="lyric-line"
              :class="{
                active: playerStore.currentLyricIndex === index,
                'has-trans': !!line.translation,
              }"
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
    </div>
  </div>

  <!-- 空白状态防崩溃 -->
  <div class="play-page empty-fallback" v-else>
    <div v-if="playerStore.isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>正在加载音乐...</span>
    </div>
    <button v-else class="nav-btn fallback-btn" @click="goBack">
      <ChevronDown :size="28" color="#333" />
      <span>未加载音乐，点击返回</span>
    </button>
  </div>
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
}

/* 动态模糊背景 */
.bg-blur {
  position: absolute;
  top: -10%;
  left: -10%;
  right: -10%;
  bottom: -10%;
  background-size: cover;
  background-position: center;
  filter: blur(40px);
  opacity: 0.6;
  z-index: -2;
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
.nav-placeholder {
  width: 44px; /* balance the flex center */
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

/* 核心展示区 */
.play-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px 0;
  gap: 125px; /* 减小间距 */
  justify-content: center;
}

/* 左侧：封面与控制器 */
.left-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end; /* 向中轴线靠拢 */
  gap: 40px;
}

/* 黑胶区域 */
.record-section {
  display: flex;
  align-items: center;
  justify-content: center;
}
.record-disk {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background-color: #000;
  border: 10px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      transparent 40%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 60%,
      rgba(255, 255, 255, 0.03) 70%,
      transparent 80%
    );
    pointer-events: none;
  }
}
.cover-img {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  z-index: 1;
}

/* 黑胶旋转效果 */
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
}
.action-btn:disabled {
  cursor: not-allowed;
}
.play-btn-main {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.2s;
}
.play-btn-main:active {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(0.95);
}

/* 右侧：歌词区 */
.right-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start; /* 向中轴线靠拢 */
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
  line-height: 1.4;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  transform-origin: left center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lyric-line.active {
  color: #fff;
  font-size: 32px;
  font-weight: 800;
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
@media (max-width: 900px) {
  .play-content {
    flex-direction: column;
    padding: 10px 16px;
    gap: 12px;
  }
  .left-side {
    flex: 0 0 auto;
    width: 100%;
    flex-direction: row; /* 水平排列封面与控件 */
    align-items: center; /* 垂直居中对齐 */
    justify-content: flex-start;
    gap: 16px;
    background-color: rgba(255, 255, 255, 0.05); /* 给顶栏加个淡背板增加层次感 */
    padding: 12px;
    box-sizing: border-box;
    border-radius: 12px;
  }
  .record-section {
    flex: 0 0 90px; /* 固定封面宽度 */
    min-height: auto;
    align-items: flex-start;
  }
  .mobile-square-cover {
    width: 90px;
    height: 90px;
    border-radius: 8px;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .controls-section {
    flex: 1;
    width: auto; /* 覆盖 desktop 的 380px */
    max-width: none;
    gap: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .actions-row {
    gap: 16px;
    justify-content: flex-start;
  }
  .play-btn-main {
    width: 44px;
    height: 44px;
    gap: 0;
  }
  .action-btn .lucide {
    width: 24px !important;
    height: 24px !important;
  }
  .progress-bar-container {
    margin-bottom: 4px;
    gap: 8px;
  }
  .time-text {
    width: 32px;
    font-size: 10px;
  }

  .right-side {
    padding-top: 0;
  }
  .lyric-wrapper {
    padding: 20% 0 50% 0; /* 减少顶部留白，增加底部留白 */
  }
  .lyric-line {
    font-size: 18px;
    text-align: left;
    transform-origin: left center;
  }
  .lyric-line.active {
    font-size: 24px;
  }
  .lyric-line.active .lyric-original {
    font-size: 15px;
  }
  .lyric-empty {
    justify-content: center;
  }
}

.empty-fallback {
  background-color: #f5f5f5;
  justify-content: center;
  align-items: center;
}
.fallback-btn {
  color: #333;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #666;
}

/* 响应式工具类 (确保权重，放在最后) */
.mobile-only {
  display: none !important;
}
@media (max-width: 900px) {
  .mobile-only {
    display: block !important;
  }
  .desktop-only {
    display: none !important;
  }
}
</style>
