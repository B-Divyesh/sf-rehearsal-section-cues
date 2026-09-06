import { expect, test } from '@playwright/test'

const sampleTitle = 'Thursday trio rehearsal'
const sampleFirstCue = 'A — opening groove'

async function openDemo(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/demo')
  await expect(page.getByRole('heading', { level: 1, name: 'Make a rehearsal cue sheet' })).toBeVisible()
  await expect(page.getByLabel('Cue sheet title')).toHaveValue(sampleTitle)
  await expect(page.getByText('Demo — sample data, nothing is saved to your real plan.')).toBeVisible()
}

async function waitForSave(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('#save-state')).toContainText('SAVED LOCALLY')
}

async function downloadText(download: import('@playwright/test').Download): Promise<string> {
  const stream = await download.createReadStream()
  if (!stream) throw new Error('The browser did not provide the downloaded file.')
  let text = ''
  for await (const chunk of stream) text += chunk.toString()
  return text
}

async function addCuesToSeven(page: import('@playwright/test').Page): Promise<void> {
  while (await page.locator('.cue-card').count() < 7) {
    await page.getByRole('button', { name: /Add section cue/ }).click()
    const last = page.locator('.cue-card').last()
    await last.getByLabel('Section label *').fill(`Extra section ${await page.locator('.cue-card').count()}`)
  }
  await waitForSave(page)
}

function demoUrl(): string {
  return new URL('/demo', test.info().project.use.baseURL as string).toString()
}

test('@claim:demo-sample opens a realistic filled rehearsal plan in one click', async ({ page }) => {
  await openDemo(page)
  await expect(page.getByLabel('Cue sheet title')).toHaveValue(sampleTitle)
  await expect(page.locator('.cue-card')).toHaveCount(4)
  await expect(page.getByLabel('Section label *').first()).toHaveValue(sampleFirstCue)
  await expect(page.getByLabel('One technical risk').nth(1)).toHaveValue('Release together after the rest')
})

test('@claim:demo-isolation resets sample data without changing the real plan', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Cue sheet title').fill('My real rehearsal')
  await page.getByRole('button', { name: 'Add the first cue' }).click()
  await page.getByLabel('Section label *').fill('Real intro')
  await waitForSave(page)

  await openDemo(page)
  await page.getByLabel('Section label *').first().fill('Demo-only edit')
  await waitForSave(page)
  await page.getByRole('button', { name: 'Reset demo' }).first().click()
  await expect(page.getByLabel('Section label *').first()).toHaveValue(sampleFirstCue)
  await page.getByRole('button', { name: 'Start for real' }).first().click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByLabel('Cue sheet title')).toHaveValue('My real rehearsal')
  await expect(page.getByLabel('Section label *')).toHaveValue('Real intro')
})

test('@claim:automatic-saving keeps cue edits after reload', async ({ page }) => {
  await openDemo(page)
  await page.getByLabel('Section label *').first().fill('A — edited opening groove')
  await waitForSave(page)
  await page.reload()
  await expect(page.getByLabel('Section label *').first()).toHaveValue('A — edited opening groove')
})

test('@claim:device-only keeps cue edits on the product origin', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await openDemo(page)
  await page.getByLabel('One technical risk').first().fill('Listen for the bass entrance')
  await waitForSave(page)
  const origin = new URL(test.info().project.use.baseURL as string).origin
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true)
})

test('@claim:offline-reload loads the demo and edits without console errors after the first visit', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  const messages: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text())
  })
  try {
    await page.goto(demoUrl())
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller))
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByLabel('Cue sheet title')).toHaveValue(sampleTitle)
    await expect(page.locator('#online-state')).toContainText('OFFLINE')
    await page.getByRole('button', { name: 'Mark rehearsed' }).first().click()
    await expect(page.getByText('2/4 rehearsed')).toBeVisible()
    expect(messages).toEqual([])
  } finally {
    await context.close()
  }
})

test('@claim:keyboard-add adds a cue and moves focus to its label', async ({ page }) => {
  await openDemo(page)
  await page.keyboard.press('Control+Enter')
  await expect(page.locator('.cue-card')).toHaveCount(5)
  await expect(page.getByLabel('Section label *').last()).toBeFocused()
})

test('@claim:mobile-layout keeps the demo usable at 390 pixels', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  try {
    await page.goto(demoUrl())
    await expect(page.locator('.cue-card')).toHaveCount(4)
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(horizontalOverflow).toBe(false)
    const addButton = page.getByRole('button', { name: /Add section cue/ })
    const box = await addButton.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  } finally {
    await context.close()
  }
})

test('@claim:reduced-motion removes interface motion when requested', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  try {
    await page.goto(demoUrl())
    const motion = await page.locator('.primary-button').first().evaluate((element) => getComputedStyle(element).transitionDuration)
    expect(Number.parseFloat(motion)).toBeLessThanOrEqual(0.0001)
  } finally {
    await context.close()
  }
})

test('@claim:high-contrast-print renders a black-on-white printable cue sheet', async ({ page }) => {
  await openDemo(page)
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('button', { name: 'Print cue sheet' })).toBeHidden()
  await expect(page.locator('.print-value').first()).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(0, 0, 0)')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
})

test('@claim:json-export downloads the complete sample cue sheet as JSON', async ({ page }) => {
  await openDemo(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadPromise
  const contents = JSON.parse(await downloadText(download)) as { title: string, cues: unknown[] }
  expect(download.suggestedFilename()).toBe('thursday-trio-rehearsal.json')
  expect(contents.title).toBe(sampleTitle)
  expect(contents.cues).toHaveLength(4)
})

test('@claim:csv-export downloads one CSV row per sample cue', async ({ page }) => {
  await openDemo(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV' }).click()
  const download = await downloadPromise
  const contents = await downloadText(download)
  expect(download.suggestedFilename()).toBe('thursday-trio-rehearsal.csv')
  expect(contents.trim().split('\n')).toHaveLength(5)
  expect(contents).toContain('active_players')
})

test('@claim:import-recovery reports a bad file and then imports a valid cue sheet', async ({ page }) => {
  await openDemo(page)
  await page.getByRole('button', { name: 'Import JSON / CSV' }).click()
  await page.locator('#import-file').setInputFiles({ name: 'wrong.csv', mimeType: 'text/csv', buffer: Buffer.from('name,email\nAda,ada@example.com') })
  await expect(page.locator('#form-notice')).toContainText('does not use the Rehearsal Section Cues column order')
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('#import-file').setInputFiles({ name: 'valid.csv', mimeType: 'text/csv', buffer: Buffer.from('order,section,measure,repeat,active_players,technical_risk,tempo_bpm,complete\n1,Encore,m. 121,2,Full trio,Keep the cut-off together,104,true') })
  await expect(page.getByLabel('Cue sheet title')).toHaveValue('valid')
  await expect(page.getByLabel('Section label *')).toHaveValue('Encore')
  await expect(page.getByText('Rehearsed', { exact: true })).toBeVisible()
})

test('@claim:free-print-limit explains the six-cue printing boundary', async ({ page }) => {
  await openDemo(page)
  await addCuesToSeven(page)
  await page.getByRole('button', { name: 'Print cue sheet' }).click()
  await expect(page.locator('#form-notice')).toContainText('Free printing supports 6 cues')
})

test('@claim:free-data-tools still export a seven-cue sheet', async ({ page }) => {
  await openDemo(page)
  await addCuesToSeven(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV' }).click()
  const download = await downloadPromise
  const contents = await downloadText(download)
  expect(contents.trim().split('\n')).toHaveLength(8)
})

test('@claim:paid-unlimited-print prints more than six cues with a cached valid license', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:rehearsal-section-cues', 'verified-demo-license')
    localStorage.setItem('sb_license_verdict:rehearsal-section-cues', JSON.stringify({ valid: true, checkedAt: Date.now() }))
    window.print = () => { document.documentElement.dataset.printed = 'yes' }
  })
  await openDemo(page)
  await addCuesToSeven(page)
  await page.getByRole('button', { name: 'Print cue sheet' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-printed', 'yes')
})

test('@claim:paid-condensed-print enables the condensed layout with a cached valid license', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:rehearsal-section-cues', 'verified-demo-license')
    localStorage.setItem('sb_license_verdict:rehearsal-section-cues', JSON.stringify({ valid: true, checkedAt: Date.now() }))
  })
  await openDemo(page)
  const option = page.getByLabel('Condensed ensemble layout')
  await expect(option).toBeEnabled()
  await option.check()
  await expect(page.locator('body')).toHaveClass(/compact-print/)
})

test('@claim:one-time-price discloses the paid offer in the terms page', async ({ page }) => {
  await page.goto('/terms/')
  await expect(page.getByRole('heading', { level: 1, name: /Terms for using this cue-sheet tool/ })).toBeVisible()
  await expect(page.getByText('$12 as a one-time purchase')).toBeVisible()
  await expect(page.getByText('It is not a subscription.')).toBeVisible()
})

test('@claim:checkout-redirect starts the registered hosted checkout', async ({ page }) => {
  const response = await page.request.get('https://api.sociobot.in/api/v1/products/rehearsal-section-cues/checkout', { maxRedirects: 0 })
  expect([302, 303]).toContain(response.status())
  expect(response.headers().location).toMatch(/^https:\/\/checkout\.dodopayments\.com\//)
})

test('@claim:no-accounts-or-trackers lets visitors use the sample without third-party requests', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await openDemo(page)
  await page.getByRole('button', { name: 'Mark rehearsed' }).first().click()
  const origin = new URL(test.info().project.use.baseURL as string).origin
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true)
})

test('@claim:no-score-or-cloud-storage keeps entered rehearsal notes off the network', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await openDemo(page)
  await page.getByLabel('Measure / reference').first().fill('m. 12, rehearsal copy')
  await page.getByLabel('One technical risk').first().fill('No score upload: tune the unison')
  await waitForSave(page)
  const origin = new URL(test.info().project.use.baseURL as string).origin
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true)
})
