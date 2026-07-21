import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Stamped into the bundle so the admin screen can say which build it is running.
// Deploys here are manual and a phone can hold an old bundle, so "is this the
// version I just shipped?" was otherwise only answerable by hunting for a
// feature that changed.
function buildVersion() {
  // sv-SE formats as YYYY-MM-DD HH:mm; Seoul because that is where it is read.
  const stamp = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })
    .slice(0, 16)
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    return `${stamp} · ${sha}`
  } catch {
    // Building outside a git checkout is fine; the timestamp alone still tells
    // one build from another.
    return stamp
  }
}

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion()),
  },
  server: {
    // swingpopphoto/ is a source-photo dropbox, not app code. Watching it makes
    // the dev server crash with EBUSY while files are being copied in.
    watch: {
      ignored: ['**/swingpopphoto/**'],
    },
  },
})
