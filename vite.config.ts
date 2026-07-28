import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Some environments don't emit native filesystem events, which breaks
    // hot-reload. Polling ensures edits are always picked up.
    watch: { usePolling: true, interval: 300 },
  },
})
