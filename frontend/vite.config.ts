import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Enable HMR with better error overlay
    hmr: {
      overlay: true,
    },
  },
  // Enable detailed source maps in development
  build: {
    sourcemap: true,
  },
  // CSS source maps
  css: {
    devSourcemap: true,
  },
})
