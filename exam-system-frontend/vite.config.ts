import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 修復 sockjs-client 的 global is not defined 問題
    global: 'globalThis',
  },
  optimizeDeps: {
    // 預編譯 sockjs-client 和相關依賴
    include: ['sockjs-client', '@stomp/stompjs'],
  },
})
