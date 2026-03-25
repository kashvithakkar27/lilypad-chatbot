import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/mcp': {
        target: 'https://mcp.lilypad.co.in',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
