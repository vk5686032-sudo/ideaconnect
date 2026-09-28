import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Where the dev API lives. Matches the backend default port; the proxy below
// makes the browser see one origin, so the frontend no longer needs a LAN IP.
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // expose on LAN so other devices can open the app
    port: 5173,
    strictPort: true,  // fail fast instead of silently hopping ports
    // Same shape as the deployed app: nginx proxies /api and /socket.io in
    // frontend/nginx.conf, and the client uses relative/same-origin URLs. That
    // is why VITE_API_URL=/api/v1 and VITE_SOCKET_URL="" work in CI. Without
    // this proxy, dev would need a hardcoded LAN IP that goes stale whenever
    // the wifi changes.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      // ws:true is required for the websocket upgrade, not just polling.
      '/socket.io': { target: API_TARGET, changeOrigin: true, ws: true },
    },
  },
})
