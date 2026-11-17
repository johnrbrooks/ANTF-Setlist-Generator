import { describe, expect, it } from 'vitest'
import { formatGigDuration } from './metrics'

describe('gig duration formatting', () => {
  it('uses readable hour and minute totals', () => {
    expect(formatGigDuration(0)).toBe('0 min')
    expect(formatGigDuration(45 * 60)).toBe('45 min')
    expect(formatGigDuration((2 * 60 + 17) * 60)).toBe('2 hr 17 min')
  })
})
