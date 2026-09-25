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

test('opens shared text in the reader and saves it to the library', async ({ page }) => {
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
