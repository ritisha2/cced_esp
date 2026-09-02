import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/agent': {
        target: process.env.VITE_AGENT_API_BASE || 'http://127.0.0.1:8090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/agent/, '/api/ui'),
      },
      '/api': {
        target: process.env.VITE_CORE_API_BASE || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: (process.env.VITE_CORE_API_BASE || 'http://127.0.0.1:8000').replace(/^http/, 'ws'),
        ws: true,
      },
    },
  },
})
