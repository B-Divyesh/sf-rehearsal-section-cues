export const PRODUCT_SLUG = 'rehearsal-section-cues'
export const PRICE_LABEL = '$12 one-time'
export const CHECKOUT_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/checkout`

const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`
const VERDICT_KEY = `sb_license_verdict:${PRODUCT_SLUG}`
const DAY = 86_400_000

interface Verdict {
  valid: boolean
  checkedAt: number
}

export function captureReturnedLicense(): void {
  const url = new URL(window.location.href)
  const license = url.searchParams.get('license')
  if (!license) return
  localStorage.setItem(LICENSE_KEY, license.trim())
  url.searchParams.delete('license')
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

export function storeLicense(license: string): void {
  const clean = license.trim()
  if (!clean) throw new Error('Enter the license token from your purchase email.')
  localStorage.setItem(LICENSE_KEY, clean)
  localStorage.removeItem(VERDICT_KEY)
}

export function cachedUnlock(): boolean {
  const token = localStorage.getItem(LICENSE_KEY)
  if (!token) return false
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as Verdict
    return verdict.valid
  } catch {
    return false
  }
}

export async function verifyLicense(force = false): Promise<boolean> {
  const token = localStorage.getItem(LICENSE_KEY)
  if (!token) return false
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as Verdict
    if (!force && Date.now() - cached.checkedAt < DAY) return cached.valid
  } catch {
    // A missing or malformed cache should be refreshed.
  }
  const endpoint = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`
  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('License verification is temporarily unavailable.')
  const data = await response.json() as { valid?: boolean }
  const valid = data.valid === true
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid, checkedAt: Date.now() } satisfies Verdict))
  return valid
}
