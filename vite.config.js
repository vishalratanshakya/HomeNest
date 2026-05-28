import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@admin': path.resolve(__dirname, './admin'),
      '@vendor': path.resolve(__dirname, './vendor'),
      '@user': path.resolve(__dirname, './user'),
      '@auth': path.resolve(__dirname, './auth'),
      '@core': path.resolve(__dirname, './src/core'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-icons'],
          'chart-vendor': ['recharts'],
          'pdf-vendor': ['html2canvas', 'jspdf']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
