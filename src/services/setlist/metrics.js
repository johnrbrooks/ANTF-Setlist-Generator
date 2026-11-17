import { SET_TOLERANCE_SECONDS } from '../../domain/constants'

export function formatSeconds(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function countTransitions(songs) {
  let tuningChanges = 0
  let guitarChanges = 0
  for (let index = 1; index < songs.length; index += 1) {
    if (songs[index].tuning !== songs[index - 1].tuning) tuningChanges += 1
    if (songs[index].twoGuitars !== songs[index - 1].twoGuitars) guitarChanges += 1
  }
  return { tuningChanges, guitarChanges }
}

export function calculateSetMetrics(songs, bufferSeconds) {
  const songSeconds = songs.reduce((total, song) => total + song.durationSec, 0)
  const bufferTotal = Math.max(0, songs.length - 1) * bufferSeconds
  return {
    songSeconds,
    bufferSeconds: bufferTotal,
    totalSeconds: songSeconds + bufferTotal,
    ...countTransitions(songs),
  }
}

export function validateSet(set, settings) {
  const metrics = calculateSetMetrics(set.songs, settings.bufferSeconds)
  const warnings = []
  if (set.title === 'Encore') {
    if (set.songs.length !== settings.encoreCount) warnings.push(`Encore has ${set.songs.length} songs; setting requests ${settings.encoreCount}.`)
  } else {
    const targetSeconds = settings.targetMinutes * 60
    if (set.songs.length < 4) warnings.push('Regular sets require at least 4 songs.')
    if (metrics.totalSeconds < targetSeconds - SET_TOLERANCE_SECONDS || metrics.totalSeconds > targetSeconds + SET_TOLERANCE_SECONDS) {
      warnings.push(`Duration ${formatSeconds(metrics.totalSeconds)} is outside the ±4 minute target window.`)
    }
    if (set.songs[0] && !set.songs[0].opener) warnings.push('First song is not marked as an opener.')
    if (set.songs.at(-1) && !set.songs.at(-1).closer) warnings.push('Last song is not marked as a closer.')
    const firstThree = set.songs.slice(0, 3)
    if (firstThree.length === 3 && new Set(firstThree.map((song) => song.tuning)).size > 1) warnings.push('The first three songs do not share a tuning.')
    if (set.songs.some((song) => song.encoreOnly)) warnings.push('Encore-only song is in a regular set.')
  }
  if (metrics.tuningChanges > settings.maxTuningChanges) warnings.push(`${metrics.tuningChanges} tuning changes exceed the selected limit.`)
  if (metrics.guitarChanges > settings.maxGuitarChanges) warnings.push(`${metrics.guitarChanges} guitar changes exceed the selected limit.`)
  return { ...metrics, warnings }
}

export function calculateGigMetrics(sets, bufferSeconds) {
  return sets.reduce(
    (totals, set) => {
      const metrics = calculateSetMetrics(set.songs, bufferSeconds)
      totals.totalSongs += set.songs.length
      totals.totalSeconds += metrics.totalSeconds
      return totals
    },
    { totalSongs: 0, totalSeconds: 0 },
  )
}
