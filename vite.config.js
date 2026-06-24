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
      '@owner': path.resolve(__dirname, './owner'),
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
          'react-owner': ['react', 'react-dom', 'react-router-dom'],
          'firebase-owner': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-owner': ['framer-motion', 'lucide-react', 'react-icons'],
          'chart-owner': ['recharts'],
          'pdf-owner': ['html2canvas', 'jspdf']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
