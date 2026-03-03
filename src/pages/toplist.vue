<script setup lang="ts">
defineOptions({ name: 'ToplistPage' })
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeLayout from '@/layouts/Home.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import PlaylistCard from '@/components/playlist/PlaylistCard.vue'
import { getToplists, type Toplist } from '@/api/toplist'

const router = useRouter()
const rawToplists = ref<Toplist[]>([])
const isLoading = ref(true)

type SortKey = 'playCount' | 'updateTime'
const sortKey = ref<SortKey>('playCount')

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'playCount', label: '按播放量' },
  { key: 'updateTime', label: '按更新时间' },
]

const sortedToplists = computed(() => {
  const list = [...rawToplists.value]
  if (sortKey.value === 'playCount') {
    return list.sort((a, b) => b.playCount - a.playCount)
  } else {
    return list.sort((a, b) => b.updateTime - a.updateTime)
  }
})

const fetchToplists = async () => {
  try {
    isLoading.value = true
    const res = await getToplists()
    if (res.data?.list) {
      rawToplists.value = res.data.list
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
        <SectionHeader title="全部榜单">
          <div class="sort-tabs">
            <button
              v-for="opt in sortOptions"
              :key="opt.key"
              class="sort-tab"
              :class="{ active: sortKey === opt.key }"
              @click="sortKey = opt.key"
            >
              {{ opt.label }}
            </button>
          </div>
        </SectionHeader>

        <LoadingSpinner v-if="isLoading" text="加载中..." />

        <div v-else class="toplist-grid">
          <PlaylistCard
            v-for="item in sortedToplists"
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

  /* ── 排序 Tab ──────────────────────────────────────────── */
  .sort-tabs {
    display: flex;
    gap: 6px;
  }

  .sort-tab {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      background var(--transition-fast),
      border-color var(--transition-fast);

    &:hover {
      color: var(--color-text);
      background: var(--color-surface-hover);
    }

    &.active {
      color: var(--color-primary);
      background: var(--color-primary-dim);
      border-color: transparent;
    }
  }

  /* ── 榜单网格 ─────────────────────────────────────────── */
  .toplist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 20px 16px;
  }

  @media (max-width: 640px) {
    padding: 8px 12px 100px;

    .toplist-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 14px 10px;
    }
  }
}
</style>
