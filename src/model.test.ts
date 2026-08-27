import { describe, expect, it } from 'vitest'
import { csvToSheet, normalizeSheet, sheetToCsv, type CueSheet } from './model'

describe('cue sheet data ownership', () => {
  it('round-trips commas, quotes, and newlines through CSV', () => {
    const sheet: CueSheet = {
      version: 1,
      title: 'Bridge work',
      updatedAt: new Date(0).toISOString(),
      cues: [{
        id: 'a', label: 'B, reprise', measure: '42', repeat: 2,
        players: 'Flute & "low brass"', risk: 'Count\nthrough rest', tempo: 96, complete: true,
      }],
    }
    const restored = csvToSheet(sheetToCsv(sheet))
    expect(restored.cues[0]).toMatchObject({
      label: 'B, reprise', players: 'Flute & "low brass"', risk: 'Count\nthrough rest', tempo: 96, complete: true,
    })
  })

  it('rejects unrelated CSV files', () => {
    expect(() => csvToSheet('name,email\nAda,a@example.com')).toThrow(/column order/)
  })

  it('normalizes imported values and limits unsafe ranges', () => {
    const restored = normalizeSheet({ title: 'Plan', cues: [{ repeat: 999, tempo: 900, complete: 'yes' }] })
    expect(restored.cues[0]).toMatchObject({ repeat: 99, tempo: 400, complete: false })
  })
})
