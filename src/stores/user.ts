import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLoginStatus } from '../api/login/status'
import type { LoginProfile } from '../api/login/status'
import { getLogout } from '../api/logout'

export const useUserStore = defineStore('user', () => {
  const isLogin = ref<boolean>(false)
  const profile = ref<LoginProfile | null>(null)

  const checkLogin = async () => {
    try {
      const res = await getLoginStatus()
      if (res.data?.data?.code === 200 && res.data?.data?.account) {
        isLogin.value = true
        profile.value = res.data.data.profile
      } else {
        isLogin.value = false
        profile.value = null
      }
    } catch {
      isLogin.value = false
      profile.value = null
    }
  }

  const logout = async () => {
    try {
      await getLogout()
      isLogin.value = false
      profile.value = null
    } catch {}
  }

  return {
    isLogin,
    profile,
    checkLogin,
    logout,
  }
})
