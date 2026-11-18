import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { createSetlistCsv } from './csvExport'

describe('CSV export', () => {
  it('round-trips titles containing commas', () => {
    const csv = createSetlistCsv([{ title: 'Set 1', songs: [{ song: 'Dance, Dance', artist: 'Fall Out Boy', genre: 'Emo Classic', vocalDifficulty: 1, energyRating: 4, key: 'B Minor', bpm: 114, length: '3:00', tuning: 'Standard', bassTuning: 'Drop D', twoGuitars: true, weight: 1 }] }])
    const parsed = Papa.parse(csv, { header: true })
    expect(parsed.data[0].Song).toBe('Dance, Dance')
    expect(parsed.data[0]['2 Guitars']).toBe('Y')
    expect(parsed.data[0]['Energy Rating']).toBe('4')
    expect(parsed.data[0]['Bass Tuning']).toBe('Drop D')
  })
})
