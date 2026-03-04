<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Repeat, Repeat1, Shuffle, Trash2, X, Volume2 } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const playerStore = usePlayerStore()

const listRef = ref<HTMLElement | null>(null)

// 播放模式文案
const playModeText = computed(() => {
  switch (playerStore.playMode) {
    case 'single':
      return '单曲循环'
    case 'random':
      return '随机播放'
    case 'list':
    default:
      return '列表循环'
  }
})

// 切换播放模式
const togglePlayMode = () => {
  const modes: ('list' | 'single' | 'random')[] = ['list', 'single', 'random']
  const idx = modes.indexOf(playerStore.playMode)
  const nextIdx = (idx + 1) % modes.length
  playerStore.setPlayMode(modes[nextIdx]!)
}

// 播放列表中某首歌
const playPlaylistItem = (index: number) => {
  if (index === playerStore.currentPlaylistIndex) return
  playerStore.currentPlaylistIndex = index
  playerStore.playSong(playerStore.playlist[index]!.id)
}

// 删除歌曲
const removeSong = (index: number, e: Event) => {
  e.stopPropagation()
  playerStore.removeSong(index)
}

// 滚动到当前歌曲
const scrollToCurrent = () => {
  if (!listRef.value || playerStore.currentPlaylistIndex < 0) return
  nextTick(() => {
    const activeEl = listRef.value?.querySelector('.playlist-item.active') as HTMLElement
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

// 监听打开状态，打开时滚动到当前歌曲
watch(
  () => props.visible,
  (val) => {
    if (val) {
      setTimeout(scrollToCurrent, 100)
    }
  },
)

// 歌曲切换时如果面板开着也滚动
watch(
  () => playerStore.currentPlaylistIndex,
  () => {
    if (props.visible) {
      setTimeout(scrollToCurrent, 100)
    }
  },
)
</script>

<template>
  <div class="playlist-panel-overlay" :class="{ 'is-visible': visible }" @click="emit('close')">
    <div class="playlist-panel" @click.stop>
      <div class="panel-header">
        <div class="header-left" @click="togglePlayMode">
          <Repeat v-if="playerStore.playMode === 'list'" :size="18" />
          <Repeat1 v-else-if="playerStore.playMode === 'single'" :size="18" />
          <Shuffle v-else :size="18" />
          <span class="mode-text">{{ playModeText }} ({{ playerStore.playlist.length }})</span>
        </div>
        <div class="header-right">
          <button class="icon-btn" @click="emit('close')">
            <X :size="20" />
          </button>
        </div>
      </div>

      <div class="panel-list" ref="listRef">
        <div
          v-for="(song, index) in playerStore.playlist"
          :key="song.id"
          class="playlist-item"
          :class="{ active: index === playerStore.currentPlaylistIndex }"
          @click="playPlaylistItem(index)"
        >
          <div class="item-info">
            <Volume2
              v-if="index === playerStore.currentPlaylistIndex"
              :size="16"
              class="active-icon"
            />
            <span class="song-name">{{ song.name }}</span>
            <span class="song-dash">-</span>
            <span class="song-artist" v-if="song.ar">
              {{ song.ar.map((ar) => ar.name).join('/') }}
            </span>
          </div>
          <button class="delete-btn" @click="removeSong(index, $event)">
            <Trash2 :size="16" />
          </button>
        </div>
        <div v-if="playerStore.playlist.length === 0" class="empty-list">
          列表为空，去添加些音乐吧
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.playlist-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 600;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;

  &.is-visible {
    opacity: 1;
    pointer-events: auto;

    .playlist-panel {
      transform: translateY(0);
    }
  }
}

.playlist-panel {
  background-color: #2b2b2b;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  height: 60vh;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
  color: #fff;
  padding-bottom: env(safe-area-inset-bottom);
}

.panel-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  user-select: none;

  .mode-text {
    font-size: 15px;
    font-weight: 500;
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.icon-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #fff;
  }
}

.panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &.active {
    .song-name,
    .active-icon {
      color: #ff5a5f;
    }
  }
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;

  .active-icon {
    flex-shrink: 0;
  }

  .song-name {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .song-dash {
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
  }

  .song-artist {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.delete-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #ff5a5f;
  }
}

.empty-list {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 40px 0;
  font-size: 14px;
}
</style>
