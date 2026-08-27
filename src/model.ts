export interface Cue {
  id: string
  label: string
  measure: string
  repeat: number
  players: string
  risk: string
  tempo: number | null
  complete: boolean
}

export interface CueSheet {
  version: 1
  title: string
  updatedAt: string
  cues: Cue[]
}

export const emptySheet = (): CueSheet => ({
  version: 1,
  title: 'New rehearsal plan',
  updatedAt: new Date().toISOString(),
  cues: [],
})

export const newCue = (): Cue => ({
  id: crypto.randomUUID(),
  label: '',
  measure: '',
  repeat: 1,
  players: '',
  risk: '',
  tempo: null,
  complete: false,
})

const csvCell = (value: string | number | boolean | null): string => {
  const raw = value === null ? '' : String(value)
  return /[",\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw
}

export function sheetToCsv(sheet: CueSheet): string {
  const headings = ['order', 'section', 'measure', 'repeat', 'active_players', 'technical_risk', 'tempo_bpm', 'complete']
  const rows = sheet.cues.map((cue, index) => [
    index + 1,
    cue.label,
    cue.measure,
    cue.repeat,
    cue.players,
    cue.risk,
    cue.tempo,
    cue.complete,
  ].map(csvCell).join(','))
  return [headings.join(','), ...rows].join('\n')
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted && char === '"' && text[i + 1] === '"') {
      cell += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell)
      if (row.some((entry) => entry.trim())) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

export function csvToSheet(text: string, title = 'Imported rehearsal plan'): CueSheet {
  const rows = parseCsvRows(text)
  const headings = rows.shift()?.map((item) => item.trim().toLowerCase())
  const expected = ['order', 'section', 'measure', 'repeat', 'active_players', 'technical_risk', 'tempo_bpm', 'complete']
  if (!headings || expected.some((item, index) => headings[index] !== item)) {
    throw new Error('This CSV does not use the Rehearsal Section Cues column order.')
  }
  const cues = rows.map((cells): Cue => {
    const repeat = Number.parseInt(cells[3] ?? '1', 10)
    const tempo = Number.parseInt(cells[6] ?? '', 10)
    return {
      id: crypto.randomUUID(),
      label: cells[1]?.trim() ?? '',
      measure: cells[2]?.trim() ?? '',
      repeat: Number.isFinite(repeat) && repeat > 0 ? repeat : 1,
      players: cells[4]?.trim() ?? '',
      risk: cells[5]?.trim() ?? '',
      tempo: Number.isFinite(tempo) && tempo > 0 ? tempo : null,
      complete: (cells[7]?.trim().toLowerCase() ?? '') === 'true',
    }
  })
  return { version: 1, title, updatedAt: new Date().toISOString(), cues }
}

export function normalizeSheet(input: unknown): CueSheet {
  if (!input || typeof input !== 'object') throw new Error('The file does not contain a cue sheet.')
  const value = input as Partial<CueSheet>
  if (!Array.isArray(value.cues)) throw new Error('The file has no cue list.')
  const cues = value.cues.map((item): Cue => {
    if (!item || typeof item !== 'object') throw new Error('A cue in the file is not valid.')
    const raw = item as Partial<Cue>
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID(),
      label: typeof raw.label === 'string' ? raw.label.slice(0, 80) : '',
      measure: typeof raw.measure === 'string' ? raw.measure.slice(0, 40) : '',
      repeat: typeof raw.repeat === 'number' && raw.repeat > 0 ? Math.min(99, Math.round(raw.repeat)) : 1,
      players: typeof raw.players === 'string' ? raw.players.slice(0, 180) : '',
      risk: typeof raw.risk === 'string' ? raw.risk.slice(0, 240) : '',
      tempo: typeof raw.tempo === 'number' && raw.tempo > 0 ? Math.min(400, Math.round(raw.tempo)) : null,
      complete: raw.complete === true,
    }
  })
  return {
    version: 1,
    title: typeof value.title === 'string' && value.title.trim() ? value.title.slice(0, 100) : 'Imported rehearsal plan',
    updatedAt: new Date().toISOString(),
    cues,
  }
}
