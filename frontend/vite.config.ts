import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine the WebSocket server URL based on environment
const wsServerUrl = process.env.VITE_WS_SERVER_URL || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: wsServerUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
