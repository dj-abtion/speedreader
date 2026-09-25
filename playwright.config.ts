import { defineConfig, devices } from '@playwright/test'

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
  },
})
