import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Dropping a .glb into public/models trips Windows file locking while the
      // file is still being written, and the watcher turns that EBUSY into an
      // unhandled error that takes the whole dev server down. Nothing in here
      // needs hot reload — the models are fetched over HTTP at runtime, so a
      // page refresh already picks up a new one.
      ignored: ['**/public/models/**', '**/public/data/**'],
    },
  },
})
