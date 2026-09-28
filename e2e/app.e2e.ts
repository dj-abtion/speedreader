import { expect, test, type Page } from '@playwright/test'

const story = [
  'A Long Story',
  '',
  ...Array.from({ length: 12 }, (_, i) => `Sentence number ${i} has a handful of words in it.`),
].join('\n')

async function pasteAndRead(page: Page, text: string) {
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
  await expect(page.getByRole('button', { name: /^A Long Story/ })).not.toContainText('0%')
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
  await expect(page.getByRole('heading', { name: 'Speedreader' })).toBeVisible()
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
  await expect(page.locator('footer.version')).toHaveText(/^Version [0-9a-f]{7} · \d{1,2} [A-Z][a-z]{2} \d{4}$/)
  await expect(page.locator('footer.version a')).toHaveAttribute(
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
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)')
  await page.getByText('Display').click()
  await expect(page.getByLabel('Dark')).toBeChecked()
  await page.getByRole('button', { name: /^Short words/ }).click()
  const frame = page.locator('.frame')
  await expect(frame).toHaveCSS('font-family', /serif/)
  const largeSize = await frame.evaluate((el) => getComputedStyle(el).fontSize)
  expect(parseFloat(largeSize)).toBeGreaterThan(parseFloat(defaultSize))
})
