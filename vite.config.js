import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The admin app installs from its own host, and Android reads the manifest that
// is in the HTML when the page loads — a link swapped in later by JS is too late
// for the install prompt. So the built index.html (members) gets a sibling
// admin.html whose manifest, home-screen icon and title are the admin app's from
// the first byte; nginx serves it as the root of the admin host. Same hashed
// bundle, so it is the same app, only pointed at the right manifest.
function emitAdminHtml() {
  return {
    name: 'emit-admin-html',
    enforce: 'post',
    apply: 'build',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
      const adminHtml = html
        .replace('/manifest.webmanifest', '/admin.webmanifest')
        .replace('/icons/apple-touch-icon.png', '/icons/admin-apple-touch-icon.png')
        .replace(
          '<meta name="apple-mobile-web-app-title" content="스윙팝" />',
          '<meta name="apple-mobile-web-app-title" content="스윙팝 운영" />'
        )
      if (adminHtml === html) {
        throw new Error('emit-admin-html: index.html did not contain the expected members manifest/icon/title')
      }
      writeFileSync(resolve(dist, 'admin.html'), adminHtml)
    },
  }
}

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
  plugins: [react(), emitAdminHtml()],
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
