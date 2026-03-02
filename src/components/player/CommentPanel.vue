<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, ThumbsUp, Loader2, MessageCircle } from 'lucide-vue-next'
import { GetArtists as GetComments } from '@/api/comment/new'
import type { Comment, SortTypeItem } from '@/api/comment/new'

const props = defineProps<{
  songId: number
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  'update:count': [count: number]
}>()

const comments = ref<Comment[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const totalCount = ref(0)
const sortType = ref(1) // 1:推荐 2:热度 3:时间
const sortTypeList = ref<SortTypeItem[]>([
  { sortType: 1, sortTypeName: '推荐', target: '' },
  { sortType: 2, sortTypeName: '热度', target: '' },
  { sortType: 3, sortTypeName: '最新', target: '' },
])
const pageNo = ref(1)
const cursor = ref<string | undefined>(undefined)
const errorMsg = ref<string | null>(null)
const listRef = ref<HTMLElement | null>(null)

const loadComments = async (reset = false) => {
  if (reset) {
    if (isLoading.value) return
    isLoading.value = true
    comments.value = []
    pageNo.value = 1
    cursor.value = undefined
    hasMore.value = true
    errorMsg.value = null
  } else {
    if (isLoadingMore.value || !hasMore.value) return
    isLoadingMore.value = true
  }

  try {
    const res = await GetComments({
      id: props.songId,
      type: 0,
      pageNo: pageNo.value,
      pageSize: 20,
      sortType: sortType.value,
      cursor: sortType.value === 3 && pageNo.value > 1 ? cursor.value : undefined,
    })

    const respData = res.data
    if (respData.code === 200) {
      const d = respData.data
      if (reset) {
        comments.value = d.comments ?? []
        if (d.sortTypeList && d.sortTypeList.length > 0) {
          sortTypeList.value = d.sortTypeList
        }
      } else {
        comments.value = [...comments.value, ...(d.comments ?? [])]
      }
      hasMore.value = d.hasMore
      totalCount.value = d.totalCount
      emit('update:count', d.totalCount)
      if (d.cursor) cursor.value = d.cursor
      pageNo.value++
    }
  } catch {
    errorMsg.value = '评论加载失败，请稍后重试'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val && comments.value.length === 0) {
      loadComments(true)
    }
  },
)

watch(sortType, () => {
  loadComments(true)
  if (listRef.value) listRef.value.scrollTop = 0
})

watch(
  () => props.songId,
  () => {
    comments.value = []
    pageNo.value = 1
    cursor.value = undefined
    hasMore.value = true
    if (props.visible) loadComments(true)
  },
)

const handleScroll = (e: Event) => {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
    loadComments(false)
  }
}

const fmtCount = (n: number): string => {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return String(n)
}
</script>

<template>
  <!-- 遮罩 -->
  <Transition name="cp-backdrop">
    <div v-if="visible" class="comment-backdrop" @click="emit('close')" />
  </Transition>

  <!-- 面板 -->
  <Transition name="cp-panel">
    <div v-if="visible" class="comment-panel" role="dialog" aria-label="评论区">
      <!-- 头部 -->
      <div class="cp-header">
        <div class="cp-title-row">
          <div class="cp-title">
            <MessageCircle :size="16" />
            <span>评论</span>
            <span v-if="totalCount > 0" class="cp-count">{{ fmtCount(totalCount) }}</span>
          </div>
          <button class="cp-close" @click="emit('close')" aria-label="关闭评论">
            <X :size="20" />
          </button>
        </div>

        <!-- 排序标签 -->
        <div class="cp-sort">
          <button
            v-for="item in sortTypeList"
            :key="item.sortType"
            class="sort-btn"
            :class="{ active: sortType === item.sortType }"
            @click="sortType = item.sortType"
          >
            {{ item.sortTypeName }}
          </button>
        </div>
      </div>

      <!-- 列表 -->
      <div class="cp-list" ref="listRef" @scroll="handleScroll">
        <!-- 初始加载 -->
        <div v-if="isLoading" class="cp-center">
          <Loader2 :size="28" class="spin" />
        </div>

        <!-- 错误 -->
        <div v-else-if="errorMsg" class="cp-center cp-error">
          <span>{{ errorMsg }}</span>
          <button class="retry-btn" @click="loadComments(true)">重试</button>
        </div>

        <!-- 空 -->
        <div v-else-if="comments.length === 0" class="cp-center cp-empty">暂无评论</div>

        <!-- 评论列表 -->
        <template v-else>
          <div v-for="comment in comments" :key="comment.commentId" class="cp-item">
            <img
              class="cp-avatar"
              :src="comment.user.avatarUrl + '?param=80y80'"
              :alt="comment.user.nickname"
              loading="lazy"
            />
            <div class="cp-body">
              <div class="cp-meta">
                <span class="cp-name">{{ comment.user.nickname }}</span>
                <span v-if="comment.ipLocation?.location" class="cp-location">
                  {{ comment.ipLocation.location }}
                </span>
              </div>
              <p class="cp-content">{{ comment.content }}</p>

              <!-- 被回复内容 -->
              <div v-if="comment.beReplied && comment.beReplied.length > 0" class="cp-replied">
                <span class="cp-replied-name">@{{ comment.beReplied[0].user?.nickname }}：</span>
                {{ comment.beReplied[0].content }}
              </div>

              <div class="cp-footer">
                <span class="cp-time">{{ comment.timeStr }}</span>
                <button class="like-btn" :class="{ liked: comment.liked }">
                  <ThumbsUp :size="13" :fill="comment.liked ? 'currentColor' : 'none'" />
                  <span v-if="comment.likedCount > 0">{{ fmtCount(comment.likedCount) }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 加载更多 -->
          <div class="cp-more">
            <Loader2 v-if="isLoadingMore" :size="20" class="spin" />
            <span v-else-if="!hasMore" class="cp-end">— 已显示全部评论 —</span>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
/* ── 遮罩 ─────────────────────────────────────────────────── */
.comment-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 600;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* ── 面板通用 ─────────────────────────────────────────────── */
.comment-panel {
  position: fixed;
  z-index: 601;
  display: flex;
  flex-direction: column;
  background: rgba(28, 28, 32, 0.96);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  color: rgba(255, 255, 255, 0.9);

  /* PC：右侧抽屉 */
  top: 0;
  right: 0;
  bottom: 0;
  width: min(400px, 45vw);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
}

/* ── 头部 ─────────────────────────────────────────────────── */
.cp-header {
  flex-shrink: 0;
  padding: 20px 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  padding-bottom: 12px;
}

.cp-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.cp-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.cp-count {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.45);
}

.cp-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition:
    background 0.2s,
    color 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
}

/* 排序 tabs */
.cp-sort {
  display: flex;
  gap: 4px;
}

.sort-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  padding: 5px 12px;
  border-radius: 20px;
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    color: rgba(255, 255, 255, 0.75);
    background: rgba(255, 255, 255, 0.06);
  }

  &.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    font-weight: 500;
  }
}

/* ── 列表 ─────────────────────────────────────────────────── */
.cp-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }
}

/* ── 中间状态 ─────────────────────────────────────────────── */
.cp-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 200px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.cp-error {
  color: rgba(255, 100, 100, 0.8);
}

.cp-empty {
  color: rgba(255, 255, 255, 0.3);
}

.retry-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
}

/* ── 评论条目 ─────────────────────────────────────────────── */
.cp-item {
  display: flex;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  &:last-child {
    border-bottom: none;
  }
}

.cp-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.08);
}

.cp-body {
  flex: 1;
  min-width: 0;
}

.cp-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 5px;
}

.cp-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
}

.cp-location {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

.cp-content {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.6;
  margin: 0 0 6px;
  word-break: break-word;
}

/* 被回复内容引用块 */
.cp-replied {
  background: rgba(255, 255, 255, 0.06);
  border-left: 2px solid rgba(255, 255, 255, 0.2);
  padding: 6px 10px;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 6px;
  line-height: 1.5;
  word-break: break-word;
}

.cp-replied-name {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.cp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cp-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 12px;
  transition:
    color 0.2s,
    background 0.2s;

  &:hover {
    color: rgba(255, 255, 255, 0.65);
    background: rgba(255, 255, 255, 0.06);
  }

  &.liked {
    color: #ff5a5f;
  }
}

/* ── 加载更多 / 结尾 ──────────────────────────────────────── */
.cp-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0 28px;
  min-height: 60px;
  color: rgba(255, 255, 255, 0.25);
  font-size: 12px;
}

.cp-end {
  color: rgba(255, 255, 255, 0.2);
  font-size: 12px;
}

/* ── 旋转动画 ─────────────────────────────────────────────── */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spin {
  animation: spin 0.9s linear infinite;
  color: rgba(255, 255, 255, 0.4);
}

/* ── PC 面板过渡动画 ──────────────────────────────────────── */
.cp-panel-enter-active,
.cp-panel-leave-active {
  transition:
    transform 0.32s cubic-bezier(0.33, 1, 0.68, 1),
    opacity 0.32s ease;
}
.cp-panel-enter-from,
.cp-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 遮罩过渡 */
.cp-backdrop-enter-active,
.cp-backdrop-leave-active {
  transition: opacity 0.28s ease;
}
.cp-backdrop-enter-from,
.cp-backdrop-leave-to {
  opacity: 0;
}

/* ── 移动端：底部弹出 ─────────────────────────────────────── */
@media (max-width: 768px) {
  .comment-panel {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 72vh;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .cp-header {
    padding: 14px 18px 0;
    padding-bottom: 10px;

    /* 拖拽把手 */
    &::before {
      content: '';
      display: block;
      width: 36px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      margin: 0 auto 14px;
    }
  }

  .cp-item {
    padding: 12px 18px;
  }

  /* 移动端面板：从下方弹入 */
  .cp-panel-enter-from,
  .cp-panel-leave-to {
    transform: translateY(100%);
    opacity: 1;
  }
}
</style>
