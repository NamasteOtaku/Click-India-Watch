import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Click-India-Watch/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
})