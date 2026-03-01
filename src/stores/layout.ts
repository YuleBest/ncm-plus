import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  // 从 localStorage 恢复状态，如果没有记录则根据屏幕宽度初始化
  const savedState = localStorage.getItem('isSidebarCollapsed')
  const defaultCollapsed = savedState !== null ? savedState === 'true' : window.innerWidth < 768

  const isSidebarCollapsed = ref(defaultCollapsed)

  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
    // 记忆用户的展开/收起选择
    localStorage.setItem('isSidebarCollapsed', String(isSidebarCollapsed.value))
  }

  const handleResize = () => {
    const isNarrowScreen = window.innerWidth < 768
    // 窄屏强制收起侧边栏
    if (isNarrowScreen) {
      isSidebarCollapsed.value = true
    } else {
      // 宽屏时，如果用户之前没有显式保存过"收起"状态，则默认展开
      const saved = localStorage.getItem('isSidebarCollapsed')
      if (saved !== 'true') {
        isSidebarCollapsed.value = false
      }
    }
  }

  const closeSidebar = () => {
    isSidebarCollapsed.value = true
    localStorage.setItem('isSidebarCollapsed', 'true')
  }

  return {
    isSidebarCollapsed,
    toggleSidebar,
    closeSidebar,
    handleResize,
  }
})
