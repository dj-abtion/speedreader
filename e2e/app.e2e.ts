import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { encodeText } from '../src/core/link.ts'

const story = [
  'A Long Story',
  '',
  ...Array.from({ length: 12 }, (_, i) => `Sentence number ${i} has a handful of words in it.`),
].join('\n')

async function pasteAndRead(page: Page, text: string) {
  await page.getByRole('button', { name: 'Paste text' }).click()
  await page.getByLabel('Paste the text you want to read').fill(text)
  await page.getByRole('button', { name: 'Read', exact: true }).click()
  await expect(page.locator('.frame')).toBeVisible()
}

test('resumes reading at the same sentence after a reload', async ({ page }) => {
  await page.goto('./')
  await pasteAndRead(page, story)

  await page.keyboard.press('Space')
  await page.waitForTimeout(3500)
  await page.keyboard.press('Space')
  const sentence = await page.locator('.context').innerText()
  expect(sentence).not.toContain('A Long Story')

  // Returning to the library waits for the saved position; a reload in the same instant as the
  // pause can cancel the in-flight IndexedDB write, which the spec accepts as losing a few seconds.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /^A Long Story/ })).not.toContainText('Not started')
  await page.reload()
  await page.getByRole('button', { name: /^A Long Story/ }).click()
  await expect(page.locator('.context')).toHaveText(sentence)
})

test('loads offline after the first visit', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Didread' })).toBeVisible()
  await expect(page.getByText('Too long? Did read.')).toBeVisible()
  await pasteAndRead(page, 'Reading works offline too.')
  await expect(page.locator('.frame')).toHaveText('Reading')
})

test('handles shared text on the device without the network', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  // Offline proves the service worker answers the share itself; nothing reaches a server.
  await context.setOffline(true)
  await page.evaluate(() => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.enctype = 'multipart/form-data'
    form.action = 'share'
    for (const [name, value] of [
      ['title', 'Private note'],
      ['text', 'Confidential words stay here.'],
    ]) {
      const input = document.createElement('input')
      input.name = name
      input.value = value
      form.append(input)
    }
    document.body.append(form)
    form.submit()
  })

  await expect(page.locator('.frame')).toHaveText('Confidential')
  expect(page.url()).not.toContain('Confidential')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /^Private note/ })).toBeVisible()
})

test('still accepts shares from the older GET share target', async ({ page }) => {
  await page.goto('./?title=Shared%20note&text=Shared%20words%20arrive%20here.')
  await expect(page.locator('.frame')).toHaveText('Shared')
  await expect(page).toHaveURL(/\/speedreader\/$/)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /^Shared note/ })).toBeVisible()
})

test('explains that shared links are not supported', async ({ page }) => {
  await page.goto('./?url=https%3A%2F%2Fexample.com%2Farticle')
  await expect(page.getByRole('status')).toHaveText(/Links can't be opened yet/)
})

test('shows several words per flash and remembers the setting', async ({ page }) => {
  await page.goto('./')
  await pasteAndRead(page, 'One two three four, five six seven.')
  await expect(page.locator('.frame')).toHaveText('One')

  await page.keyboard.press('2')
  await expect(page.locator('.frame')).toHaveText('One two')
  await expect(page.getByRole('button', { name: 'Words per flash' })).toHaveText('2 words')
  await expect(page.locator('.context .current')).toHaveText(['One', 'two'])

  await page.getByRole('button', { name: 'Words per flash' }).click()
  await expect(page.locator('.frame')).toHaveText('One two three')

  await page.reload()
  await pasteAndRead(page, 'Alpha beta gamma delta.')
  await expect(page.locator('.frame')).toHaveText('Alpha beta gamma')
})

test('shows the build version on the home screen', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.version')).toHaveText(/^Version [0-9a-f]{7} · \d{1,2} [A-Z][a-z]{2} \d{4}$/)
  await expect(page.locator('.version a')).toHaveAttribute(
    'href',
    /^https:\/\/github\.com\/dj-abtion\/speedreader\/commit\/[0-9a-f]{40}$/,
  )
})

test('remembers the chosen theme, font and size', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('./')
  await pasteAndRead(page, 'Short words.')
  const defaultSize = await page.locator('.frame').evaluate((el) => getComputedStyle(el).fontSize)

  await page.getByRole('button', { name: 'Display settings' }).click()
  await page.getByLabel('Dark').check()
  await page.getByLabel('Serif').check()
  await page.getByLabel('XL').check()

  await page.reload()
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 19, 17)')
  await page.getByRole('button', { name: 'Display settings' }).click()
  await expect(page.getByLabel('Dark')).toBeChecked()
  await page.getByRole('button', { name: /^Short words/ }).click()
  const frame = page.locator('.frame')
  await expect(frame).toHaveCSS('font-family', /serif/)
  const largeSize = await frame.evaluate((el) => getComputedStyle(el).fontSize)
  expect(parseFloat(largeSize)).toBeGreaterThan(parseFloat(defaultSize))
})

test('opens a reader link and keeps its text out of the URL', async ({ page }) => {
  const reply = '## Short answer\n\nThe text travels **inside** the link. Nothing reaches a server.'
  const link = `./#t=${await encodeText(reply)}`
  await page.goto(link)
  await expect(page.locator('.frame')).toHaveText('Short')
  await expect(page).toHaveURL(/\/speedreader\/$/)

  await page.keyboard.press('Space')
  await page.waitForTimeout(2500)
  await page.keyboard.press('Space')
  await page.keyboard.press('Escape')
  const saved = page.getByRole('button', { name: /^Short answer/ })
  await expect(saved).not.toContainText('Not started')

  // Opening the same link again resumes the saved copy instead of adding another.
  await page.goto(link)
  await expect(page.locator('.frame')).not.toHaveText('Short')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /^Short answer/ })).toHaveCount(1)
})

test('explains when a reader link is damaged', async ({ page }) => {
  await page.goto('./#t=notavalidpayload')
  await expect(page.getByRole('status')).toHaveText(/couldn't be opened/)
  await expect(page).toHaveURL(/\/speedreader\/$/)
})

test('reads Markdown from the clipboard as plain text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('./')
  await page.evaluate(() =>
    navigator.clipboard.writeText('# Copied reply\n\n```js\nconsole.log(1)\n```\n\nSome **bold** words.'),
  )
  await page.getByRole('button', { name: 'Read clipboard' }).click()
  await expect(page.locator('.frame')).toHaveText('Copied')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /^Copied reply/ })).toBeVisible()
})

test('opens a reader link copied to the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('./')
  const link = `${new URL(page.url()).origin}/speedreader/#t=${await encodeText('Linked words arrive.')}`
  await page.evaluate((text) => navigator.clipboard.writeText(text), link)
  await page.getByRole('button', { name: 'Read clipboard' }).click()
  await expect(page.locator('.frame')).toHaveText('Linked')
})

test('celebrates a finished text and stamps it in the library', async ({ page }) => {
  await page.goto('./')
  await pasteAndRead(page, 'Four short words.')
  await page.keyboard.press('Space')

  await expect(page.getByRole('heading', { name: 'Did read' })).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('dl')).toContainText('words 3')
  await page.getByRole('button', { name: 'Library' }).click()

  const card = page.getByRole('button', { name: /^Four short words/ })
  await expect(card).toContainText('Did read')
})

test('confirms a speed change made while playing', async ({ page }) => {
  await page.goto('./')
  await pasteAndRead(page, story)
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('status')).toHaveText('325 wpm')

  await page.keyboard.press('Space')
  await expect(page.locator('.wpm')).toHaveText('325 wpm')
  await expect(page.getByText('Tap anywhere to resume')).toBeVisible()
})

test('stops on a code block and shows the code until reading continues', async ({ page }) => {
  await page.goto('./')
  await pasteAndRead(page, 'Run this:\n\n```sh\nnpm run build\nnpm test\n```\n\nAfter the code.')
  await page.keyboard.press('Space')

  const code = page.getByRole('region', { name: 'Code block' })
  await expect(code).toContainText('npm run build\nnpm test', { timeout: 10_000 })
  await expect(code).toContainText('sh')
  await expect(page.locator('.frame')).toHaveCount(0)

  await page.getByRole('button', { name: 'Continue reading' }).click()
  await expect(page.locator('.frame')).toHaveText(/After|the|code\./)
})

test('opens the Claude guide from the footer and goes back', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Use with Claude' }).click()
  await expect(page.getByRole('heading', { name: 'Use with Claude' })).toBeVisible()
  await expect(page).toHaveURL(/#claude$/)
  await expect(page.getByRole('link', { name: 'Download skill' })).toHaveAttribute(
    'href',
    'https://github.com/dj-abtion/speedreader/releases/download/speedread-skill/speedread.zip',
  )

  await page.getByRole('button', { name: 'Back to library' }).click()
  await expect(page.getByText('Too long? Did read.')).toBeVisible()
  await expect(page).not.toHaveURL(/#/)

  await page.getByRole('link', { name: 'Use with Claude' }).click()
  await page.goBack()
  await expect(page.getByText('Too long? Did read.')).toBeVisible()
})

test('opens the Claude guide from a shared link', async ({ page }) => {
  await page.goto('./#claude')
  await expect(page.getByRole('heading', { name: 'Use with Claude' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Too long? Did read.')).toBeVisible()
  await expect(page).not.toHaveURL(/#/)
})

// The Brewale copy of the /speedread skill downloads this file, so it must match the plugin's.
test('serves the /speedread script next to the app', async ({ request }) => {
  const response = await request.get('./speedread.mjs')
  expect(response.ok()).toBe(true)
  expect(await response.text()).toBe(readFileSync('plugins/speedread/skills/speedread/speedread.mjs', 'utf8'))
})

// Chromium only offers installing once its own checks pass, so the tests hand the app a stand-in
// install prompt that records being shown.
async function offerInstall(page: Page, outcome: 'accepted' | 'dismissed' = 'accepted') {
  await page.evaluate((outcome) => {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: async () => void ((window as unknown as { prompted: boolean }).prompted = true),
      userChoice: Promise.resolve({ outcome }),
    })
    dispatchEvent(event)
  }, outcome)
}

test('offers to install once the library has a text', async ({ page }) => {
  await page.goto('./')
  await offerInstall(page)
  const banner = page.getByRole('complementary', { name: 'Install Didread' })
  await expect(banner).toBeHidden()

  await pasteAndRead(page, 'Something to keep.')
  await page.keyboard.press('Escape')
  await expect(banner).toContainText('Put Didread on your home screen.')
  await expect(banner).toContainText('share text straight to it')

  await banner.getByRole('button', { name: 'Install' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted)).toBe(true)
  await expect(banner).toBeHidden()
})

test('remembers a dismissed install offer', async ({ page }) => {
  await page.goto('./')
  await pasteAndRead(page, 'Something to keep.')
  await page.keyboard.press('Escape')
  await offerInstall(page)
  const banner = page.getByRole('complementary', { name: 'Install Didread' })
  await banner.getByRole('button', { name: "Don't show again" }).click()
  await expect(banner).toBeHidden()

  await page.reload()
  await offerInstall(page)
  await expect(page.getByRole('button', { name: /^Something to keep/ })).toBeVisible()
  await expect(banner).toBeHidden()
})

test.describe('on an iPhone', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  })

  test('explains how to add Didread to the home screen', async ({ page }) => {
    await page.goto('./')
    await pasteAndRead(page, 'Something to keep.')
    await page.keyboard.press('Escape')
    const banner = page.getByRole('complementary', { name: 'Install Didread' })
    await expect(banner).toContainText('then Add to Home Screen.')
    await expect(banner.getByRole('img', { name: 'Share' })).toBeVisible()
    await expect(banner.getByRole('button', { name: 'Install' })).toHaveCount(0)
  })
})
