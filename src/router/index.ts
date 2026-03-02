import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 深链守卫：直接访问 /play?id=xxx 时，加载歌曲并打开播放器，重定向到首页
router.beforeEach((to, _from, next) => {
  if (to.path === '/play') {
    const id = Number(to.query.id)
    if (id) {
      // 延迟导入避免循环依赖（pinia 在 main.ts 中 app.use 后才可用）
      import('@/stores/player').then(({ usePlayerStore }) => {
        const playerStore = usePlayerStore()
        playerStore.playSong(id)
        playerStore.openPlayer()
      })
    }
    next('/')
  } else {
    next()
  }
})

export default router
