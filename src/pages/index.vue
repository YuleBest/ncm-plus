<script setup lang="ts">
defineOptions({ name: 'IndexPage' })
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeLayout from '@/layouts/Home.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import PlaylistCard from '@/components/playlist/PlaylistCard.vue'
import { getHighQualityPlaylists, type HighQualityPlaylist } from '@/api/top/playlist/highquality'

const router = useRouter()
const playlists = ref<HighQualityPlaylist[]>([])
const isLoading = ref(true)

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

const goToPlaylist = (id: number) => {
  router.push(`/playlist/${id}`)
}

onMounted(() => {
  fetchPlaylists()
})
</script>

<template>
  <HomeLayout>
    <div class="index-page">
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
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 12px;
    }
  }
}
</style>
