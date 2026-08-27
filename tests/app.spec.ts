import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('creates, saves, reloads, and exports a rehearsal cue', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Rehearsal Section Cues/i })).toBeVisible()
  await page.getByLabel('Plan title').fill('Thursday trio run')
  await page.getByRole('button', { name: 'Add the first cue' }).click()
  await page.getByLabel('Section label *').fill('B — bridge pickup')
  await page.getByLabel('Measure / reference').fill('m. 42')
  await page.getByLabel('Pass / repeat').fill('2')
  await page.getByLabel('Active players').fill('Flute, keys, bass')
  await page.getByLabel('One technical risk').fill('Release together after the rest')
  await page.getByLabel('Target BPM').fill('96')
  await page.getByRole('button', { name: 'Mark rehearsed' }).click()
  await expect(page.getByText('1/1 rehearsed')).toBeVisible()
  await expect(page.locator('#save-state')).toContainText('SAVED LOCALLY')

  await page.reload()
  await expect(page.getByLabel('Plan title')).toHaveValue('Thursday trio run')
  await expect(page.getByLabel('Section label *')).toHaveValue('B — bridge pickup')
  await expect(page.getByText('Rehearsed', { exact: true })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('thursday-trio-run.json')
})

test('supports the keyboard path, mobile width, and serious accessibility checks', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+Enter')
  await expect(page.getByLabel('Section label *')).toBeFocused()
  await page.getByLabel('Section label *').fill('Coda')
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))
  expect(serious, serious.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([])
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalOverflow).toBe(false)
})

test('reloads the complete shell and keeps editing offline', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
    }
  })
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: /Rehearsal Section Cues/i })).toBeVisible()
  await expect(page.locator('#online-state')).toContainText('OFFLINE')
  await page.getByRole('button', { name: 'Add the first cue' }).click()
  await page.getByLabel('Section label *').fill('Offline coda')
  await expect(page.getByLabel('Section label *')).toHaveValue('Offline coda')
})
