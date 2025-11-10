import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // 確保資源使用相對路徑
  build: {
    outDir: '../exam-system-backend/src/main/resources/static', // 直接 build 到後端
    emptyOutDir: true, // build 前清空目錄
    rollupOptions: {
      output: {
        // 資源檔案使用 hash 命名，利於快取
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  define: {
    // 修復 sockjs-client 的 global is not defined 問題
    global: 'globalThis',
  },
  optimizeDeps: {
    // 預編譯 sockjs-client 和相關依賴
    include: ['sockjs-client', '@stomp/stompjs'],
  },
})
