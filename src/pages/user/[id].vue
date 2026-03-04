<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserDetail, type UserDetailResponse } from '@/api/user/detail'
import { getUserPlaylist, type UserPlaylistItem } from '@/api/user/playlist'
import { useUserStore } from '@/stores/user'
import HomeLayout from '@/layouts/Home.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import PlaylistCard from '@/components/playlist/PlaylistCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userId = (route.params as { id: string }).id
const userInfo = ref<UserDetailResponse | null>(null)
const isLoading = ref(true)

const playlists = ref<UserPlaylistItem[]>([])
const isPlaylistLoading = ref(true)

const fetchUserDetail = async () => {
  try {
    isLoading.value = true
    const res = await getUserDetail(userId)
    if (res.data?.code === 200) {
      userInfo.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch user detail:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchUserPlaylists = async () => {
  try {
    isPlaylistLoading.value = true
    const res = await getUserPlaylist({ uid: Number(userId) })
    if (res.data?.code === 200 && res.data.playlist) {
      playlists.value = res.data.playlist
    }
  } catch (error) {
    console.error('Failed to fetch user playlists:', error)
  } finally {
    isPlaylistLoading.value = false
  }
}

const handleLogout = async () => {
  await userStore.logout()
  window.location.href = '/' // 或者 router.push('/')
}

onMounted(() => {
  fetchUserDetail()
  fetchUserPlaylists()
})
</script>

<template>
  <HomeLayout>
    <div class="user-page" v-if="!isLoading && userInfo">
      <!-- 顶部背景 -->
      <div
        class="user-background"
        :style="{ backgroundImage: `url(${userInfo.profile.backgroundUrl}?param=800y300)` }"
      >
        <div class="user-background-mask"></div>
      </div>

      <!-- 用户信息部分 -->
      <div class="user-info-section">
        <div class="avatar-container">
          <img
            :src="`${userInfo.profile.avatarUrl}?param=200y200`"
            class="user-avatar"
            alt="avatar"
          />
        </div>

        <div class="user-profile">
          <h1 class="nickname">{{ userInfo.profile.nickname }}</h1>

          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-num">{{ userInfo.profile.eventCount }}</span>
              <span class="stat-label">动态</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">{{ userInfo.profile.follows }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">{{ userInfo.profile.followeds }}</span>
              <span class="stat-label">粉丝</span>
            </div>
          </div>

          <div class="user-meta">
            <span class="meta-tag">Lv.{{ userInfo.level }}</span>
            <span class="meta-tag" v-if="userInfo.profile.vipType > 0">VIP</span>
          </div>

          <p class="signature" v-if="userInfo.profile.signature">
            {{ userInfo.profile.signature }}
          </p>
        </div>

        <div class="user-actions" v-if="userStore.profile?.userId === Number(userId)">
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </div>
      </div>

      <!-- 其他内容区 -->
      <div class="user-content-section">
        <div class="content-block">
          <SectionHeader title="听歌排行" />
          <div class="listen-count">
            累计听歌: <strong>{{ userInfo.listenSongs }}</strong> 首
          </div>
        </div>

        <div class="content-block">
          <SectionHeader title="个人介绍" />
          <div class="intro-text">创建天数: {{ userInfo.createDays }} 天</div>
        </div>

        <div class="content-block">
          <SectionHeader title="歌手歌单" />

          <LoadingSpinner v-if="isPlaylistLoading" text="加载中..." />
          <div v-else class="playlist-grid">
            <PlaylistCard
              v-for="item in playlists"
              :key="item.id"
              :id="item.id"
              :name="item.name"
              :coverImgUrl="item.coverImgUrl"
              :playCount="item.playCount"
              :creatorNickname="item.creator?.nickname"
              @click="router.push(`/playlist/${item.id}`)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-state">正在加载用户信息...</div>

    <div v-else class="error-state">无法加载用户信息</div>
  </HomeLayout>
</template>

<style lang="scss" scoped>
.user-page {
  position: relative;
  min-height: calc(100vh - 140px);
}

.user-background {
  height: 240px;
  background-size: cover;
  background-position: center;
  position: relative;

  .user-background-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), var(--color-bg));
  }
}

.user-info-section {
  position: relative;
  padding: 0 24px;
  margin-top: -60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-container {
  margin-bottom: 16px;

  .user-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid var(--color-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    object-fit: cover;
  }
}

.user-profile {
  margin-bottom: 24px;

  .nickname {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 16px;
  }
}

.user-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    .stat-num {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }
  }

  .stat-divider {
    width: 1px;
    height: 24px;
    background-color: var(--color-border);
    margin: 0 24px;
  }
}

.user-meta {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;

  .meta-tag {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    background-color: var(--color-primary-dim);
    color: var(--color-primary);
    font-weight: 500;
  }
}

.signature {
  font-size: 14px;
  color: var(--color-text-secondary);
  max-width: 400px;
  margin: 0 auto;
}

.user-actions {
  margin-bottom: 32px;

  .logout-btn {
    padding: 8px 24px;
    border-radius: 20px;
    background-color: var(--color-background-soft);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    font-size: 14px;
    cursor: pointer;
    transition: all var(--transition-base);

    &:hover {
      background-color: var(--color-background-hover);
    }
  }
}

.user-content-section {
  padding: 0 24px 60px;
  max-width: 800px;
  margin: 0 auto;

  .content-block {
    margin-bottom: 32px;

    .listen-count,
    .intro-text {
      font-size: 15px;
      color: var(--color-text-primary);
      margin-top: 12px;
    }
  }

  .playlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 20px 16px;
    margin-top: 16px;
  }
}

.loading-state,
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .user-background {
    height: 200px;
  }

  .user-info-section {
    padding: 0 16px;
  }

  .user-stats .stat-divider {
    margin: 0 16px;
  }

  .user-content-section .playlist-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px 10px;
  }
}
</style>
