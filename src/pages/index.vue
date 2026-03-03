<script setup lang="ts">
defineOptions({ name: 'IndexPage' })
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeLayout from '@/layouts/Home.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import PlaylistCard from '@/components/playlist/PlaylistCard.vue'
import { getHighQualityPlaylists, type HighQualityPlaylist } from '@/api/top/playlist/highquality'
import { getToplists, type Toplist } from '@/api/toplist'

const router = useRouter()
const playlists = ref<HighQualityPlaylist[]>([])
const isLoading = ref(true)

const toplists = ref<Toplist[]>([])
const isToplistLoading = ref(true)

const fetchPlaylists = async () => {
  try {
    isLoading.value = true
    const res = await getHighQualityPlaylists({ limit: 12 })
    if (res.data?.playlists) {
      playlists.value = res.data.playlists
    }
  } catch (error) {
    console.error('Failed to fetch playlists:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchToplists = async () => {
  try {
    isToplistLoading.value = true
    const res = await getToplists()
    if (res.data?.list) {
      toplists.value = [...res.data.list].sort((a, b) => b.playCount - a.playCount).slice(0, 7)
    }
  } catch (error) {
    console.error('Failed to fetch toplists:', error)
  } finally {
    isToplistLoading.value = false
  }
}

const goToPlaylist = (id: number) => {
  router.push(`/playlist/${id}`)
}

onMounted(() => {
  fetchPlaylists()
  fetchToplists()
})
</script>

<template>
  <HomeLayout>
    <div class="index-page">
      <!-- 榜单预览 -->
      <div class="section-container toplist-section">
        <SectionHeader title="音乐榜单">
          <button class="view-all-btn" @click="router.push('/toplist')">查看全部</button>
        </SectionHeader>

        <LoadingSpinner v-if="isToplistLoading" text="加载中..." />

        <div v-else class="playlist-grid">
          <PlaylistCard
            v-for="item in toplists"
            :key="item.id"
            :id="item.id"
            :name="item.name"
            :coverImgUrl="item.coverImgUrl"
            :playCount="item.playCount"
            @click="goToPlaylist"
          />
        </div>
      </div>

      <!-- 精品推荐歌单 -->
      <div class="section-container">
        <SectionHeader title="精品推荐歌单" />

        <LoadingSpinner v-if="isLoading" text="加载中..." />

        <div v-else class="playlist-grid">
          <PlaylistCard
            v-for="item in playlists"
            :key="item.id"
            :id="item.id"
            :name="item.name"
            :coverImgUrl="item.coverImgUrl"
            :playCount="item.playCount"
            :creatorNickname="item.creator?.nickname"
            @click="goToPlaylist"
          />
        </div>
      </div>
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
.index-page {
  padding: 8px 16px 60px;

  .section-container {
    padding: 0;
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  /* ── 查看全部按钮 ──────────────────────────────────────── */
  .view-all-btn {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition:
      color var(--transition-base),
      background var(--transition-base);

    &:hover {
      color: var(--color-primary);
      background: var(--color-primary-dim);
    }
  }

  /* ── 歌单网格 ─────────────────────────────────────────── */
  .playlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 20px 16px;
  }

  /* ── 移动端适配 ───────────────────────────────────────── */
  @media (max-width: 640px) {
    padding: 8px 12px 80px;

    .playlist-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 14px 10px;
    }

    /* 榜单预览：移动端只显示前三个 */
    .toplist-section .playlist-grid .playlist-card:nth-child(n + 4) {
      display: none;
    }
  }
}
</style>
