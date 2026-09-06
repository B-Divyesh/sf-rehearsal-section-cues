#!/usr/bin/env bash
set -euo pipefail

target_url="${1:?Usage: scripts/verify-url.sh <url>}"

node --input-type=module - "$target_url" <<'NODE'
import { chromium } from '@playwright/test'

const target = process.argv[2]
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', (error) => errors.push(error.message))

try {
  const response = await page.goto(target, { waitUntil: 'networkidle' })
  const report = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    mainCount: document.querySelectorAll('main').length,
    h1Count: document.querySelectorAll('h1').length,
    missingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
  }))
  if (!response?.ok()) throw new Error(`Expected a successful page response, got ${response?.status()}`)
  if (!report.title || !report.lang || report.mainCount !== 1 || report.h1Count !== 1 || report.missingAlt) {
    throw new Error(`Basic document check failed: ${JSON.stringify(report)}`)
  }
  if (errors.length) throw new Error(`Console errors: ${errors.join(' | ')}`)
  console.log(JSON.stringify({ url: page.url(), ...report, consoleErrors: 0 }))
} finally {
  await context.close()
  await browser.close()
}
NODE
