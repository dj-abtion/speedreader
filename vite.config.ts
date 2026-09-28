import { svelte } from '@sveltejs/vite-plugin-svelte'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the site from /speedreader/; the manifest scope and start_url must match
// it exactly or the service worker and install prompt break.
const base = '/speedreader/'

// Baked into the bundle so the app can show which deploy is running.
function git(args: string): string {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_APP_COMMIT': JSON.stringify(git('rev-parse HEAD')),
    'import.meta.env.VITE_APP_COMMIT_DATE': JSON.stringify(git('log -1 --format=%cI')),
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'sw',
      filename: 'sw.ts',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Didread',
        short_name: 'Didread',
        description: 'Too long? Did read. Read faster, one word at a time.',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#141311',
        theme_color: '#141311',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // POST keeps shared text out of URLs (and so out of history and server logs); the
        // service worker answers it on the device.
        share_target: {
          action: `${base}share`,
          method: 'POST',
          enctype: 'multipart/form-data',
          params: { title: 'title', text: 'text', url: 'url' },
        },
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
      },
    }),
  ],
})
