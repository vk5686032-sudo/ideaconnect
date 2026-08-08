import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // expose on LAN so other devices can open the app
    port: 5173,
    strictPort: true,  // fail fast instead of silently hopping ports
  },
})
