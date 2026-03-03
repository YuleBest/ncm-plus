<script setup lang="ts">
defineOptions({ name: 'ToplistPage' })
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeLayout from '@/layouts/Home.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import PlaylistCard from '@/components/playlist/PlaylistCard.vue'
import { getToplists, type Toplist } from '@/api/toplist'

const router = useRouter()
const toplists = ref<Toplist[]>([])
const isLoading = ref(true)

const fetchToplists = async () => {
  try {
    isLoading.value = true
    const res = await getToplists()
    if (res.data?.list) {
      toplists.value = res.data.list
    }
  } catch (error) {
    console.error('Failed to fetch toplists:', error)
  } finally {
    isLoading.value = false
  }
}

const goToPlaylist = (id: number) => {
  router.push(`/playlist/${id}`)
}

onMounted(() => {
  fetchToplists()
})
</script>

<template>
  <HomeLayout>
    <div class="toplist-page">
      <div class="section-container">
        <SectionHeader title="全部榜单" />

        <LoadingSpinner v-if="isLoading" text="加载中..." />

        <div v-else class="toplist-grid">
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
    </div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
.toplist-page {
  padding: 8px 16px 60px;

  .section-container {
    padding: 0;
  }

  .toplist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 20px 16px;
  }

  @media (max-width: 640px) {
    padding: 8px 12px 80px;

    .toplist-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 12px;
    }
  }
}
</style>
