<script setup lang="ts">
import { Play, Pause, Loader2, SkipForward, SkipBack } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { useRouter } from 'vue-router'

const playerStore = usePlayerStore()
const router = useRouter()

const goDetail = () => {
  if (playerStore.currentSong) {
    router.push('/play')
  }
}
</script>

<template>
  <div class="mini-player glass-effect" v-if="playerStore.currentSong" @click="goDetail">
    <div class="mp-cover" :class="{ rotating: playerStore.isPlaying }">
      <img :src="playerStore.currentSong.al.picUrl + '?param=60y60'" alt="cover" />
    </div>

    <div class="mp-info">
      <div class="mp-name">{{ playerStore.currentSong.name }}</div>
      <div class="controls">
        <button
          class="control-btn"
          @click.stop="playerStore.prevSong"
          title="上一首"
          :disabled="playerStore.playlist.length <= 1"
        >
          <SkipBack
            :size="24"
            :color="playerStore.playlist.length <= 1 ? '#ccc' : '#333'"
            :fill="playerStore.playlist.length <= 1 ? '#ccc' : '#333'"
          />
        </button>
        <button class="control-btn play-btn" @click.stop="playerStore.togglePlay" title="播放/暂停">
          <Loader2 v-if="playerStore.isLoading" class="icon-spin" :size="24" color="#333" />
          <Pause v-else-if="playerStore.isPlaying" :size="24" color="#333" fill="#333" />
          <Play v-else :size="24" color="#333" fill="#333" style="margin-left: 2px" />
        </button>
        <button
          class="control-btn"
          @click.stop="playerStore.nextSong"
          title="下一首"
          :disabled="playerStore.playlist.length <= 1"
        >
          <SkipForward
            :size="24"
            :color="playerStore.playlist.length <= 1 ? '#ccc' : '#333'"
            :fill="playerStore.playlist.length <= 1 ? '#ccc' : '#333'"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini-player {
  position: absolute;
  bottom: 60px; /* Default above BottomBar (60px) */
  left: 16px;
  right: 16px;
  height: 56px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 8px;
  cursor: pointer;
  z-index: 100;
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); 改为扁平化 */
  border: 1px solid rgba(0, 0, 0, 0.06);
  background-color: rgba(255, 255, 255, 0.85); /* 稍微提升不透明度 */
  transition:
    transform 0.3s ease,
    bottom 0.3s ease;
}

button {
  background: none !important;
  border: none !important;
}

/* 宽屏隐藏 BottomBar, 迷你播放器下沉贴底 */
@media (min-width: 768px) {
  .mini-player {
    bottom: 16px;
    max-width: 400px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.mp-cover {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.mp-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 黑胶旋转 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.rotating {
  animation: spin 8s linear infinite;
}

.mp-info {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.mp-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.mp-artist {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mp-controls {
  padding: 0 8px;
}
.mp-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.mp-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.icon-spin {
  animation: spin 1s linear infinite;
}
.ml-1 {
  margin-left: 2px;
}
</style>
