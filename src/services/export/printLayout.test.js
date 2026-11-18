import { describe, expect, it } from 'vitest'
import { PRINT_ROW_HEIGHT_BREAKPOINTS, buildPrintPages, calculateEffectivePrintRowHeight, countPrintTransitionRows, getPrintDensity, groupSetsForPrint } from './printLayout'

const song = (id, tuning = 'Standard', twoGuitars = false) => ({ id, tuning, twoGuitars })
const set = (id, count) => ({ id, title: id, songs: Array.from({ length: count }, (_, index) => song(`${id}-${index}`)) })

describe('print layout', () => {
  it('limits each explicit print page to two sets while preserving set indexes', () => {
    const sets = [set('Set 1', 12), set('Set 2', 11), set('Set 3', 13), set('Set 4', 12), set('Encore', 2)]
    const pages = groupSetsForPrint(sets)

    expect(pages.map((page) => page.length)).toEqual([2, 2, 1])
    expect(pages.flat().map(({ setIndex }) => setIndex)).toEqual([0, 1, 2, 3, 4])
  })

  it('counts a combined tuning and guitar change as one printed transition row', () => {
    const songs = [song('1'), song('2', 'Drop D', true), song('3', 'Drop D', false)]
    expect(countPrintTransitionRows(songs)).toBe(2)
  })

  it('uses definitive row-height breakpoints as songs and filters consume space', () => {
    const noFilters = { artist: false, genre: false, vocal: false, duration: false, guitars: false, tuning: false, tempo: false, key: false }
    const allFilters = Object.fromEntries(Object.keys(noFilters).map((key) => [key, true]))

    expect(PRINT_ROW_HEIGHT_BREAKPOINTS.map(({ density }) => density)).toEqual(['spacious', 'roomy', 'standard', 'compact', 'dense'])
    expect(calculateEffectivePrintRowHeight(set('Short', 10), noFilters)).toBe(70)
    expect(calculateEffectivePrintRowHeight(set('Filtered', 14), allFilters)).toBe(36)
    expect(getPrintDensity([set('Short', 10)], noFilters)).toBe('spacious')
    expect(getPrintDensity([set('Filtered', 14)], allFilters)).toBe('standard')
    expect(getPrintDensity([set('Long', 20)], allFilters)).toBe('dense')
    expect(buildPrintPages([set('Set 1', 10)], noFilters)[0]).toMatchObject({ density: 'spacious', effectiveRowHeight: 70 })
  })
})
