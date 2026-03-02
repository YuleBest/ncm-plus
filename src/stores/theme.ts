import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'ncm-theme'

export const useThemeStore = defineStore('theme', () => {
  const getSystemDark = (): boolean =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  const isDark = ref<boolean>(saved ? saved === 'dark' : getSystemDark())

  const applyTheme = (dark: boolean) => {
    const html = document.documentElement
    if (dark) {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
    }
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }

  // Apply immediately on store init to avoid flash
  applyTheme(isDark.value)

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  const mode = computed<ThemeMode>(() => (isDark.value ? 'dark' : 'light'))

  return { isDark, mode, toggleTheme }
})
