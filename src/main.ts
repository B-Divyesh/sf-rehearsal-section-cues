import './style.css'
import { csvToSheet, emptySheet, newCue, normalizeSheet, sheetToCsv, type Cue, type CueSheet } from './model'
import { loadSheet, saveSheet } from './storage'
import {
  cachedUnlock,
  captureReturnedLicense,
  CHECKOUT_URL,
  PRICE_LABEL,
  storeLicense,
  verifyLicense,
} from './paid'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const app = document.querySelector<HTMLDivElement>('#app')!
let sheet: CueSheet = emptySheet()
let storageError = ''
let notice = ''
let saveTimer: number | undefined
let unlocked = false
let compactPrint = false
let installPrompt: BeforeInstallPromptEvent | null = null
let deletedCue: { cue: Cue; index: number } | null = null

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const formatDate = (date: string): string => new Intl.DateTimeFormat('en', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(date))

function completedCount(): number {
  return sheet.cues.filter((cue) => cue.complete).length
}

function setNotice(message: string): void {
  notice = message
  render()
}

async function persist(): Promise<void> {
  window.clearTimeout(saveTimer)
  sheet.updatedAt = new Date().toISOString()
  const saveState = document.querySelector<HTMLElement>('#save-state')
  if (saveState) saveState.textContent = 'SAVING…'
  try {
    await saveSheet(sheet)
    storageError = ''
    if (saveState) saveState.textContent = 'SAVED LOCALLY'
  } catch {
    storageError = 'This browser could not save locally. Export a JSON backup before closing this tab.'
    if (saveState) saveState.textContent = 'SAVE FAILED'
    const error = document.querySelector<HTMLElement>('#storage-error')
    if (error) {
      error.hidden = false
      error.textContent = storageError
    }
  }
}

function scheduleSave(): void {
  window.clearTimeout(saveTimer)
  const saveState = document.querySelector<HTMLElement>('#save-state')
  if (saveState) saveState.textContent = 'UNSAVED CHANGE'
  saveTimer = window.setTimeout(() => void persist(), 450)
}

function cueMarkup(cue: Cue, index: number): string {
  const n = index + 1
  return `
    <li class="cue-card ${cue.complete ? 'is-complete' : ''}" data-cue-id="${cue.id}">
      <div class="cue-rail" aria-hidden="true"><span>${String(n).padStart(2, '0')}</span></div>
      <div class="cue-body">
        <div class="cue-heading">
          <div>
            <p class="eyebrow">Section cue ${String(n).padStart(2, '0')}</p>
            <span class="status-word ${cue.complete ? 'complete' : ''}">${cue.complete ? 'Rehearsed' : 'To rehearse'}</span>
          </div>
          <div class="cue-actions no-print" aria-label="Actions for cue ${n}">
            <button class="icon-button" type="button" data-move="up" aria-label="Move cue ${n} up" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="icon-button" type="button" data-move="down" aria-label="Move cue ${n} down" ${index === sheet.cues.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="text-button danger" type="button" data-delete>Delete</button>
          </div>
        </div>
        <div class="cue-fields">
          <label class="field field-wide">
            <span>Section label <b aria-hidden="true">*</b></span>
            <input id="cue-${cue.id}-label" data-field="label" value="${escapeHtml(cue.label)}" maxlength="80" required autocomplete="off" placeholder="e.g. B — bridge pickup" />
            <strong class="print-value">${escapeHtml(cue.label || 'Unlabelled section')}</strong>
          </label>
          <label class="field">
            <span>Measure / reference</span>
            <input data-field="measure" value="${escapeHtml(cue.measure)}" maxlength="40" autocomplete="off" placeholder="e.g. m. 42" />
            <strong class="print-value">${escapeHtml(cue.measure || '—')}</strong>
          </label>
          <label class="field field-number">
            <span>Pass / repeat</span>
            <input data-field="repeat" value="${cue.repeat}" type="number" inputmode="numeric" min="1" max="99" />
            <strong class="print-value">${cue.repeat}</strong>
          </label>
          <label class="field field-wide">
            <span>Active players</span>
            <input data-field="players" value="${escapeHtml(cue.players)}" maxlength="180" autocomplete="off" placeholder="e.g. Flute, keys, bass" />
            <strong class="print-value">${escapeHtml(cue.players || 'All / not specified')}</strong>
          </label>
          <label class="field field-risk">
            <span>One technical risk</span>
            <input data-field="risk" value="${escapeHtml(cue.risk)}" maxlength="240" autocomplete="off" placeholder="e.g. Release together after the rest" />
            <strong class="print-value">${escapeHtml(cue.risk || 'None noted')}</strong>
          </label>
          <label class="field field-number">
            <span>Target BPM</span>
            <input data-field="tempo" value="${cue.tempo ?? ''}" type="number" inputmode="numeric" min="20" max="400" placeholder="96" />
            <strong class="print-value">${cue.tempo ? `${cue.tempo} BPM` : '—'}</strong>
          </label>
        </div>
        <button class="status-toggle no-print" type="button" data-complete aria-pressed="${cue.complete}">
          <span aria-hidden="true">${cue.complete ? '✓' : '○'}</span>
          ${cue.complete ? 'Mark as needing work' : 'Mark rehearsed'}
        </button>
      </div>
    </li>`
}

function render(): void {
  const complete = completedCount()
  const completion = sheet.cues.length ? Math.round((complete / sheet.cues.length) * 100) : 0
  app.innerHTML = `
    <header class="site-header no-print">
      <a class="brand" href="/" aria-label="Rehearsal Section Cues home">
        <img src="/icons/app-mark.svg" width="40" height="40" alt="" />
        <span>Section cues</span>
      </a>
      <nav aria-label="Utility navigation">
        <a href="#guide">How it works</a>
        <a href="#unlock">Conductor unlock</a>
        <button id="install-button" class="text-button" type="button" ${installPrompt ? '' : 'hidden'}>Install app</button>
      </nav>
    </header>

    <main id="main">
      <section class="intro no-print" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="drawing-number">DRAWING RSC—01 <span>REV A</span></p>
          <h1 id="page-title">Rehearsal<br />Section Cues</h1>
          <p class="lede">Turn “where are we?” into one shared plan. Mark the start, the pass, who plays, and the one thing to watch.</p>
          <a class="primary-button" href="#cue-sheet">Build the cue sheet <span aria-hidden="true">↓</span></a>
          <p class="privacy-note"><span aria-hidden="true">◆</span> Stored only on this device. Works offline.</p>
        </div>
        <figure class="hero-figure">
          <picture>
            <source media="(max-width: 640px)" srcset="/assets/rehearsal-blueprint-hero-640.webp" type="image/webp" />
            <source srcset="/assets/rehearsal-blueprint-hero-1024.webp" type="image/webp" />
            <img src="/assets/rehearsal-blueprint-hero-1024.jpg" width="1024" height="683" fetchpriority="high" alt="A rehearsal planning card, metronome, ruler and pencils arranged on warm blueprint paper." />
          </picture>
          <figcaption><span>Fig. A</span> The operating sheet beside the score</figcaption>
        </figure>
      </section>

      <section id="cue-sheet" class="workspace" aria-labelledby="sheet-heading">
        <div class="workspace-heading">
          <div>
            <p class="eyebrow">Working drawing / saved automatically</p>
            <h2 id="sheet-heading">Build the rehearsal run</h2>
          </div>
          <div class="local-state">
            <span id="save-state" role="status">SAVED LOCALLY</span>
            <span class="online-state" id="online-state">${navigator.onLine ? 'ONLINE' : 'OFFLINE — CHANGES STILL SAVE'}</span>
          </div>
        </div>

        <p id="storage-error" class="alert error" role="alert" ${storageError ? '' : 'hidden'}>${escapeHtml(storageError)}</p>
        <p id="form-notice" class="alert" role="status" ${notice ? '' : 'hidden'}>${escapeHtml(notice)}</p>

        <div class="sheet-meta">
          <label class="field title-field">
            <span>Plan title</span>
            <input id="sheet-title" value="${escapeHtml(sheet.title)}" maxlength="100" autocomplete="off" />
            <strong class="print-value print-title">${escapeHtml(sheet.title)}</strong>
          </label>
          <div class="progress-spec" aria-label="${complete} of ${sheet.cues.length} cues rehearsed">
            <span>${complete}/${sheet.cues.length || 0} rehearsed</span>
            <div class="progress-track"><i style="width:${completion}%"></i></div>
            <b>${completion}%</b>
          </div>
          <p class="print-meta">Updated ${formatDate(sheet.updatedAt)} · ${complete} of ${sheet.cues.length} rehearsed</p>
        </div>

        ${sheet.cues.length ? `
          <ol class="cue-list" aria-label="Rehearsal section cues">
            ${sheet.cues.map(cueMarkup).join('')}
          </ol>` : `
          <div class="empty-state">
            <div class="empty-mark" aria-hidden="true"><span>01</span></div>
            <div>
              <p class="eyebrow">The drafting board is clear</p>
              <h3>Start where the ensemble starts.</h3>
              <p>Add a section, then record the practical cue the score does not carry.</p>
              <button class="primary-button" type="button" data-add>Add the first cue</button>
            </div>
          </div>`}

        <div class="add-row no-print">
          ${sheet.cues.length ? '<button class="primary-button" type="button" data-add>+ Add section cue</button>' : ''}
          <span>Shortcut: <kbd>Ctrl</kbd> + <kbd>Enter</kbd></span>
        </div>
      </section>

      <section class="output-board no-print" aria-labelledby="output-heading">
        <div>
          <p class="eyebrow">Issue the drawing</p>
          <h2 id="output-heading">Take it to the stand</h2>
          <p>Print a high-contrast sheet, or move your editable data between devices. JSON and CSV export are always free.</p>
        </div>
        <div class="output-actions">
          <button class="primary-button" type="button" id="print-button">Print cue sheet</button>
          <button class="secondary-button" type="button" data-export="json">Export JSON</button>
          <button class="secondary-button" type="button" data-export="csv">Export CSV</button>
          <button class="secondary-button" type="button" id="import-button">Import JSON / CSV</button>
          <input id="import-file" type="file" accept=".json,.csv,application/json,text/csv" hidden />
        </div>
        <p class="output-note">Free printing includes up to 6 section cues. Export, import, and offline access stay free with any sheet size.</p>
        <label class="compact-option ${unlocked ? '' : 'locked'}">
          <input id="compact-print" type="checkbox" ${compactPrint ? 'checked' : ''} ${unlocked ? '' : 'disabled'} />
          <span><b>Condensed ensemble layout</b><small>${unlocked ? 'Fit more cues per page.' : 'Included with Conductor unlock.'}</small></span>
        </label>
      </section>

      <section id="guide" class="guide no-print" aria-labelledby="guide-heading">
        <div class="guide-title">
          <p class="eyebrow">Four field notes</p>
          <h2 id="guide-heading">Agree before the downbeat</h2>
        </div>
        <ol>
          <li><b>01</b><span><strong>Name the landing</strong>Use the rehearsal letter or measure reference everyone already has.</span></li>
          <li><b>02</b><span><strong>Call the pass</strong>Make repeats explicit so “again” means the same thing to everyone.</span></li>
          <li><b>03</b><span><strong>Assign the sound</strong>List only the players active on that pass.</span></li>
          <li><b>04</b><span><strong>Expose one risk</strong>Choose the technical snag most likely to cost the run.</span></li>
        </ol>
      </section>

      <section id="unlock" class="unlock no-print" aria-labelledby="unlock-heading">
        <div class="unlock-stamp" aria-hidden="true">${unlocked ? 'UNLOCKED' : 'OPTIONAL'}</div>
        <div>
          <p class="eyebrow">One-time utility license</p>
          <h2 id="unlock-heading">Conductor unlock</h2>
          <p>Print unlimited cues and use the condensed ensemble layout for <strong>${PRICE_LABEL}</strong>. No subscription. Core planning, accessibility, offline use, and data export stay free.</p>
          ${unlocked ? '<p class="license-active">✓ License active on this device.</p>' : `
            <div class="unlock-actions">
              <a class="primary-button" href="${CHECKOUT_URL}">Buy Conductor unlock</a>
              <details>
                <summary>Have a license? Restore it</summary>
                <form id="license-form">
                  <label class="field"><span>License token</span><input id="license-token" required autocomplete="off" spellcheck="false" /></label>
                  <button class="secondary-button" type="submit">Verify license</button>
                </form>
              </details>
            </div>`}
          <p class="legal-line">Secure checkout is hosted by Sociobot; Dodo is merchant of record. Refunds are handled there and revoke the license. See <a href="/privacy/">privacy</a> and <a href="/terms/">terms</a>.</p>
        </div>
      </section>
    </main>

    <footer class="site-footer no-print">
      <div><img src="/icons/app-mark.svg" width="32" height="32" alt="" /><strong>Rehearsal Section Cues</strong></div>
      <p>Your notes stay in this browser. No accounts, scores, trackers, or cloud rooms.</p>
      <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav>
      <small>Original editorial image generated for this product with the factory image model. © 2026 Sociobot.</small>
    </footer>

    <div id="toast" class="toast no-print" role="status" ${deletedCue ? '' : 'hidden'}>
      <span>Cue deleted.</span><button type="button" id="undo-delete">Undo</button>
    </div>`

  document.body.classList.toggle('compact-print', compactPrint && unlocked)
  bindEvents()
}

function download(filename: string, content: string, type: string): void {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type }))
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

function safeFilename(): string {
  return sheet.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rehearsal-cues'
}

function moveCue(id: string, direction: 'up' | 'down'): void {
  const index = sheet.cues.findIndex((cue) => cue.id === id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || target < 0 || target >= sheet.cues.length) return
  ;[sheet.cues[index], sheet.cues[target]] = [sheet.cues[target], sheet.cues[index]]
  render()
  scheduleSave()
  document.querySelector<HTMLElement>(`[data-cue-id="${id}"]`)?.focus({ preventScroll: true })
}

function addCue(): void {
  const cue = newCue()
  sheet.cues.push(cue)
  notice = ''
  render()
  scheduleSave()
  document.querySelector<HTMLInputElement>(`#cue-${cue.id}-label`)?.focus()
}

async function importFile(file: File): Promise<void> {
  try {
    const text = await file.text()
    const imported = file.name.toLowerCase().endsWith('.csv')
      ? csvToSheet(text, file.name.replace(/\.csv$/i, ''))
      : normalizeSheet(JSON.parse(text) as unknown)
    sheet = imported
    deletedCue = null
    notice = `Imported ${sheet.cues.length} cue${sheet.cues.length === 1 ? '' : 's'} from ${file.name}.`
    render()
    await persist()
  } catch (error) {
    setNotice(error instanceof Error ? `Import failed: ${error.message}` : 'Import failed. Choose a Rehearsal Section Cues JSON or CSV file.')
  }
}

function tryPrint(): void {
  if (!sheet.cues.length) {
    setNotice('Add at least one section cue before printing.')
    document.querySelector<HTMLElement>('[data-add]')?.focus()
    return
  }
  const incomplete = sheet.cues.find((cue) => !cue.label.trim())
  if (incomplete) {
    setNotice('Give every cue a section label before printing.')
    document.querySelector<HTMLInputElement>(`#cue-${incomplete.id}-label`)?.focus()
    return
  }
  if (sheet.cues.length > 6 && !unlocked) {
    setNotice('Free printing supports 6 cues. Export remains available, or use Conductor unlock for the full sheet.')
    document.querySelector('#unlock')?.scrollIntoView({ behavior: 'smooth' })
    return
  }
  notice = ''
  render()
  window.print()
}

function cueFromElement(target: Element): Cue | undefined {
  const id = target.closest<HTMLElement>('[data-cue-id]')?.dataset.cueId
  return sheet.cues.find((cue) => cue.id === id)
}

function bindEvents(): void {
  document.querySelectorAll<HTMLElement>('[data-add]').forEach((button) => button.addEventListener('click', addCue))

  document.querySelector<HTMLInputElement>('#sheet-title')?.addEventListener('input', (event) => {
    sheet.title = (event.currentTarget as HTMLInputElement).value
    scheduleSave()
  })

  document.querySelectorAll<HTMLInputElement>('.cue-card input[data-field]').forEach((input) => {
    input.addEventListener('input', (event) => {
      const element = event.currentTarget as HTMLInputElement
      const cue = cueFromElement(element)
      if (!cue) return
      const field = element.dataset.field as keyof Pick<Cue, 'label' | 'measure' | 'repeat' | 'players' | 'risk' | 'tempo'>
      if (field === 'repeat') cue.repeat = Math.max(1, Math.min(99, Number.parseInt(element.value || '1', 10)))
      else if (field === 'tempo') cue.tempo = element.value ? Math.max(20, Math.min(400, Number.parseInt(element.value, 10))) : null
      else cue[field] = element.value
      scheduleSave()
    })
  })

  document.querySelectorAll<HTMLElement>('[data-move]').forEach((button) => button.addEventListener('click', () => {
    const id = button.closest<HTMLElement>('[data-cue-id]')?.dataset.cueId
    const direction = button.dataset.move as 'up' | 'down'
    if (id) moveCue(id, direction)
  }))

  document.querySelectorAll<HTMLElement>('[data-complete]').forEach((button) => button.addEventListener('click', () => {
    const cue = cueFromElement(button)
    if (!cue) return
    cue.complete = !cue.complete
    render()
    scheduleSave()
  }))

  document.querySelectorAll<HTMLElement>('[data-delete]').forEach((button) => button.addEventListener('click', () => {
    const cue = cueFromElement(button)
    if (!cue) return
    const index = sheet.cues.indexOf(cue)
    const name = cue.label.trim() || `cue ${index + 1}`
    if (!window.confirm(`Delete “${name}” from this rehearsal plan?`)) return
    deletedCue = { cue, index }
    sheet.cues.splice(index, 1)
    render()
    scheduleSave()
  }))

  document.querySelector('#undo-delete')?.addEventListener('click', () => {
    if (!deletedCue) return
    sheet.cues.splice(deletedCue.index, 0, deletedCue.cue)
    const restoredId = deletedCue.cue.id
    deletedCue = null
    render()
    scheduleSave()
    document.querySelector<HTMLInputElement>(`#cue-${restoredId}-label`)?.focus()
  })

  document.querySelector('#print-button')?.addEventListener('click', tryPrint)
  document.querySelectorAll<HTMLElement>('[data-export]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.export === 'csv') download(`${safeFilename()}.csv`, sheetToCsv(sheet), 'text/csv;charset=utf-8')
    else download(`${safeFilename()}.json`, JSON.stringify(sheet, null, 2), 'application/json')
    setNotice(`Exported ${button.dataset.export?.toUpperCase()} backup.`)
  }))
  document.querySelector('#import-button')?.addEventListener('click', () => document.querySelector<HTMLInputElement>('#import-file')?.click())
  document.querySelector<HTMLInputElement>('#import-file')?.addEventListener('change', (event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (file) void importFile(file)
  })

  document.querySelector<HTMLInputElement>('#compact-print')?.addEventListener('change', (event) => {
    compactPrint = (event.currentTarget as HTMLInputElement).checked
    document.body.classList.toggle('compact-print', compactPrint && unlocked)
  })

  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const token = document.querySelector<HTMLInputElement>('#license-token')?.value ?? ''
    try {
      storeLicense(token)
      setNotice('Checking this license…')
      unlocked = await verifyLicense(true)
      setNotice(unlocked ? 'Conductor unlock restored on this device.' : 'This license is not active. Check the token or use the purchase link.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not verify this license. Try again when online.')
    }
  })

  document.querySelector('#install-button')?.addEventListener('click', async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    installPrompt = null
    render()
  })
}

function setOnlineState(force?: boolean): void {
  const state = document.querySelector<HTMLElement>('#online-state')
  const online = force ?? navigator.onLine
  if (state) state.textContent = online ? 'ONLINE' : 'OFFLINE — CHANGES STILL SAVE'
}

async function checkConnectivity(): Promise<void> {
  try {
    await fetch(`/connectivity-check.txt?t=${Date.now()}`, { cache: 'no-store' })
    setOnlineState(true)
  } catch {
    setOnlineState(false)
  }
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    if (registration.waiting) setNotice('An app update is ready. Reload to use it.')
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          setNotice('An app update is ready. Reload to use it.')
        }
      })
    })
  } catch {
    // The core app still works when service-worker registration is unavailable.
  }
}

async function init(): Promise<void> {
  try {
    captureReturnedLicense()
    unlocked = cachedUnlock()
  } catch {
    // Private browsing may restrict localStorage; the free app remains usable.
  }
  try {
    const stored = await loadSheet()
    if (stored) sheet = normalizeSheet(stored)
  } catch {
    storageError = 'Local storage is unavailable. You can still draft and export this session.'
  }
  render()
  window.addEventListener('online', () => void checkConnectivity())
  window.addEventListener('offline', () => setOnlineState(false))
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt = event as BeforeInstallPromptEvent
    render()
  })
  window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      addCue()
    }
  })
  void registerServiceWorker()
  void checkConnectivity()
  if (localStorage.getItem('sb_license:rehearsal-section-cues')) {
    void verifyLicense().then((valid) => {
      if (valid !== unlocked) {
        unlocked = valid
        if (!valid) notice = 'License no longer active. Free planning and exports still work.'
        render()
      }
    }).catch(() => undefined)
  }
}

void init()
