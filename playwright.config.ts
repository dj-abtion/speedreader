import { defineConfig, devices } from '@playwright/test'

export const LINK_FETCHER_URL = 'https://fetch.didread.test/'

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:4173/speedreader/',
    ...devices['Pixel 7'],
    // Lets a machine with a preinstalled Chromium run the suite without `playwright install`.
    launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE || undefined },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/speedreader/',
    reuseExistingServer: !process.env.CI,
    // Links are fetched through a stand-in that the tests answer with page.route.
    env: { VITE_LINK_FETCHER_URL: LINK_FETCHER_URL },
  },
})
