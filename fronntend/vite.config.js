import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/": {
        target: "http://localhost:3000", // Change this to your backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
