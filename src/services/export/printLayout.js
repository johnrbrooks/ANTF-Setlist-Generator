const PRINT_BADGE_FILTER_KEYS = ['genre', 'vocal', 'duration', 'guitars', 'tuning', 'tempo', 'key']
const PRINT_SONG_AREA_POINTS = 700
const PRINT_TRANSITION_ROW_POINTS = 9
const PRINT_BADGES_PER_LINE = 4
const PRINT_BADGE_LINE_COST_POINTS = 7

export const PRINT_ROW_HEIGHT_BREAKPOINTS = Object.freeze([
  { density: 'spacious', minEffectiveRowHeight: 52 },
  { density: 'roomy', minEffectiveRowHeight: 44 },
  { density: 'standard', minEffectiveRowHeight: 36 },
  { density: 'compact', minEffectiveRowHeight: 29 },
  { density: 'dense', minEffectiveRowHeight: 0 },
])

export function groupSetsForPrint(sets) {
  const indexedSets = sets.map((set, setIndex) => ({ set, setIndex }))
  const pages = []
  for (let index = 0; index < indexedSets.length; index += 2) pages.push(indexedSets.slice(index, index + 2))
  return pages
}

export function countPrintTransitionRows(songs) {
  let rows = 0
  for (let index = 1; index < songs.length; index += 1) {
    if (songs[index].tuning !== songs[index - 1].tuning || songs[index].twoGuitars !== songs[index - 1].twoGuitars) rows += 1
  }
  return rows
}

export function calculateEffectivePrintRowHeight(set, display) {
  if (!set.songs.length) return PRINT_SONG_AREA_POINTS
  const transitionRows = countPrintTransitionRows(set.songs)
  const visibleBadgeCount = PRINT_BADGE_FILTER_KEYS.filter((key) => display[key]).length
  const badgeLines = visibleBadgeCount ? Math.ceil(visibleBadgeCount / PRINT_BADGES_PER_LINE) : 0
  const availableSongPoints = PRINT_SONG_AREA_POINTS - transitionRows * PRINT_TRANSITION_ROW_POINTS
  const allocatedRowHeight = availableSongPoints / set.songs.length
  return Math.max(0, allocatedRowHeight - badgeLines * PRINT_BADGE_LINE_COST_POINTS)
}

export function getPrintDensity(sets, display) {
  const effectiveRowHeight = Math.min(...sets.map((set) => calculateEffectivePrintRowHeight(set, display)))
  return PRINT_ROW_HEIGHT_BREAKPOINTS.find(({ minEffectiveRowHeight }) => effectiveRowHeight >= minEffectiveRowHeight).density
}

export function buildPrintPages(sets, display) {
  return groupSetsForPrint(sets).map((items, pageIndex) => {
    const pageSets = items.map(({ set }) => set)
    const effectiveRowHeight = Math.min(...pageSets.map((set) => calculateEffectivePrintRowHeight(set, display)))
    return {
      id: `print-page-${pageIndex + 1}`,
      items,
      density: getPrintDensity(pageSets, display),
      effectiveRowHeight: Math.round(effectiveRowHeight * 10) / 10,
    }
  })
}
