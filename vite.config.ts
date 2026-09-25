import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the site from /speedreader/; the PWA manifest scope must match.
  base: '/speedreader/',
  plugins: [svelte()],
})
