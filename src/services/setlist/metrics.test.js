import { describe, expect, it } from 'vitest'
import { calculateAverageEnergy, calculateSetMetrics, formatGigDuration } from './metrics'

describe('gig duration formatting', () => {
  it('uses readable hour and minute totals', () => {
    expect(formatGigDuration(0)).toBe('0 min')
    expect(formatGigDuration(45 * 60)).toBe('45 min')
    expect(formatGigDuration((2 * 60 + 17) * 60)).toBe('2 hr 17 min')
  })
})

describe('set energy metrics', () => {
  it('calculates a one-decimal average across every song in the set', () => {
    const songs = [
      { durationSec: 180, energyRating: 2 },
      { durationSec: 210, energyRating: 4 },
      { durationSec: 150, energyRating: 5 },
    ]
    expect(calculateAverageEnergy(songs)).toBe(3.7)
    expect(calculateSetMetrics(songs, 30).averageEnergy).toBe(3.7)
  })

  it('uses the neutral energy default for legacy song objects', () => {
    expect(calculateAverageEnergy([{ energyRating: 5 }, {}])).toBe(4)
    expect(calculateAverageEnergy([])).toBe(0)
  })
})
