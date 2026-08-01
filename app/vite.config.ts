import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Só usado em `npm run dev` local, contra o backend em server/.
      '/api': 'http://localhost:4000',
    },
  },
})
