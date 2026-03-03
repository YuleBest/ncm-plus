import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import VueRouter from 'unplugin-vue-router/vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [VueRouter(), vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // Vite 6+ 默认使用 lightningcss 压缩 CSS。
    // 在这会导致 backdrop-filter: blur(x) saturate(y) 被错误压缩为没有空格导致属性失效。
    // 这里改回传统的 esbuild 压缩。
    cssMinify: 'esbuild',
  },
})
