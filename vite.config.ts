import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // CRITICAL: This allows the app to work in any subdirectory (GitHub Pages)
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/'
    }
  },
  build: {
    chunkSizeWarningLimit: 1500, // Increased limit for large chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})