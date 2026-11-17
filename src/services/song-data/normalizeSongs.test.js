import { describe, expect, it } from 'vitest'
import { normalizeRows, parseDuration, rowsFromValues } from './normalizeSongs'

const validRow = {
  'Song ID': 'dance-dance',
  Song: 'Dance, Dance',
  Artist: 'Fall Out Boy',
  Key: 'B Minor',
  BPM: '114',
  'Song Length': '3:00',
  '2 Guitars?': 'Y',
  Tuning: 'Standard',
  Weighting: '1',
  Style: 'Emo Classic',
  'Vocal Difficulty': '1',
  Opener: '',
  Closer: '',
  Encore: '',
  'Encore Only': '',
}

describe('song normalization', () => {
  it('normalizes the external contract', () => {
    const result = normalizeRows([validRow])
    expect(result.issues).toEqual([])
    expect(result.songs[0]).toMatchObject({ song: 'Dance, Dance', durationSec: 180, twoGuitars: true })
  })

  it('marks encore-only songs as encore candidates', () => {
    const result = normalizeRows([{ ...validRow, 'Song ID': 'black-parade', 'Encore Only': 'TRUE' }])
    expect(result.songs[0]).toMatchObject({ encore: true, encoreOnly: true })
  })

  it('keeps valid rows and reports malformed and duplicate rows', () => {
    const result = normalizeRows([validRow, { ...validRow }, { ...validRow, 'Song ID': 'bad', BPM: 'not-a-number' }])
    expect(result.songs).toHaveLength(1)
    expect(result.issues).toHaveLength(2)
    expect(result.issues.map((issue) => issue.message).join(' ')).toContain('Duplicate Song ID')
  })

  it('converts Sheets value arrays and validates durations', () => {
    expect(rowsFromValues([['Song', 'Artist'], ['Test', 'Band']])).toEqual([{ Song: 'Test', Artist: 'Band' }])
    expect(parseDuration('4:09')).toBe(249)
    expect(parseDuration('4:99')).toBeNull()
  })
})
