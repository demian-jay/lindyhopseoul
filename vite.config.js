import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // swingpopphoto/ is a source-photo dropbox, not app code. Watching it makes
    // the dev server crash with EBUSY while files are being copied in.
    watch: {
      ignored: ['**/swingpopphoto/**'],
    },
  },
})
