import { MAX_GENERATION_ATTEMPTS, SET_TOLERANCE_SECONDS, WEIGHT_MULTIPLIER } from '../../domain/constants'
import { calculateSetMetrics, countTransitions } from './metrics'

export function weightedPick(pool, usedIds = new Set(), rng = Math.random) {
  const candidates = pool.filter((song) => !usedIds.has(song.id))
  if (!candidates.length) return null
  const weights = candidates.map((song) => WEIGHT_MULTIPLIER[song.weight] ?? 1)
  let roll = rng() * weights.reduce((total, weight) => total + weight, 0)
  for (let index = 0; index < candidates.length; index += 1) {
    roll -= weights[index]
    if (roll <= 0) return candidates[index]
  }
  return candidates.at(-1)
}

export function getActivePool(songs, settings, excludedIds, isEncore = false) {
  const excluded = excludedIds instanceof Set ? excludedIds : new Set(excludedIds)
  return songs.filter((song) => {
    if (excluded.has(song.id)) return false
    if (!settings.includeWeight4 && song.weight === 4) return false
    if (!isEncore && song.encoreOnly) return false
    return true
  })
}

function orderSetSongs(songs, groupTuning, groupGuitars, fixedIndices = new Set()) {
  if (songs.length <= 3) return songs
  const fixedMap = {}
  const movable = []
  songs.forEach((song, index) => {
    if (index === 0 || index === songs.length - 1 || fixedIndices.has(index)) fixedMap[index] = song
    else movable.push(song)
  })
  const opener = fixedMap[0]
  for (let slot = 1; slot <= 2; slot += 1) {
    if (!fixedMap[slot] && movable.length) {
      const previous = fixedMap[slot - 1]
      let match = movable.findIndex((song) => song.tuning === opener.tuning && previous && song.twoGuitars === previous.twoGuitars)
      if (match < 0) match = movable.findIndex((song) => song.tuning === opener.tuning)
      if (match >= 0) fixedMap[slot] = movable.splice(match, 1)[0]
    }
  }
  const openSlots = songs.map((_, index) => index).filter((index) => !fixedMap[index])
  const build = (ordered) => {
    const result = new Array(songs.length)
    Object.entries(fixedMap).forEach(([index, song]) => { result[Number(index)] = song })
    openSlots.forEach((slot, index) => { result[slot] = ordered[index] })
    return result.filter(Boolean)
  }
  if (movable.length <= 1) return build(movable)

  const strategyA = [...movable].sort((a, b) => {
    if (a.tuning !== b.tuning) return a.tuning === opener.tuning ? -1 : 1
    if (a.twoGuitars !== b.twoGuitars) return Number(a.twoGuitars) - Number(b.twoGuitars)
    return 0
  })
  const strategyB = [...movable].sort((a, b) => {
    if (a.tuning !== b.tuning) return a.tuning === opener.tuning ? -1 : 1
    if (a.twoGuitars !== b.twoGuitars) return Number(b.twoGuitars) - Number(a.twoGuitars)
    return 0
  })
  const strategyC = []
  const remaining = [...movable]
  let current = fixedMap[2] || fixedMap[1] || opener
  while (remaining.length) {
    let bestIndex = 0
    let bestScore = -Infinity
    remaining.forEach((song, index) => {
      let score = 0
      if (song.tuning === current.tuning) score += 2
      if (song.twoGuitars === current.twoGuitars) score += 1
      if (song.genre === current.genre) score += 1.5
      if (current.vocalDifficulty >= 4 && song.vocalDifficulty >= 4) score -= 4
      if (score > bestScore) { bestScore = score; bestIndex = index }
    })
    current = remaining.splice(bestIndex, 1)[0]
    strategyC.push(current)
  }

  return [build(strategyA), build(strategyB), build(strategyC)].reduce((best, candidate) => {
    const transitions = countTransitions(candidate)
    let vocalFatigue = 0
    for (let index = 1; index < candidate.length; index += 1) {
      if (candidate[index].vocalDifficulty >= 4 && candidate[index - 1].vocalDifficulty >= 4) vocalFatigue += 1
    }
    const cost = transitions.tuningChanges * (groupTuning ? 10 : 1)
      + transitions.guitarChanges * (groupGuitars ? 5 : 1)
      + vocalFatigue * 10
    return !best || cost < best.cost ? { songs: candidate, cost } : best
  }, null).songs
}

function lockedForSet(lockedSlots, setIndex, allSongs) {
  const byId = new Map(allSongs.map((song) => [song.id, song]))
  return Object.entries(lockedSlots)
    .map(([key, id]) => ({ parts: key.split('-').map(Number), song: byId.get(id) }))
    .filter(({ parts, song }) => parts[0] === setIndex && song)
    .map(({ parts, song }) => ({ index: parts[1], song }))
    .sort((a, b) => a.index - b.index)
}

function applyLockedReplacements(songs, locks, usedIds) {
  const result = [...songs]
  for (const lock of locks) {
    while (result.length <= lock.index) result.push(null)
    const existingIndex = result.findIndex((song) => song?.id === lock.song.id)
    if (existingIndex >= 0) result[existingIndex] = null
    const displaced = result[lock.index]
    if (displaced && !locks.some((entry) => entry.song.id === displaced.id)) usedIds.delete(displaced.id)
    result[lock.index] = lock.song
    usedIds.add(lock.song.id)
  }
  return result.filter(Boolean)
}

function attemptBuild({ songs, settings, excludedIds, lockedSlots, rng }) {
  const usedIds = new Set(Object.values(lockedSlots))
  const regularPool = getActivePool(songs, settings, excludedIds, false)
  const sets = []
  const targetSeconds = settings.targetMinutes * 60
  const minSeconds = targetSeconds - SET_TOLERANCE_SECONDS
  const maxSeconds = targetSeconds + SET_TOLERANCE_SECONDS

  for (let setIndex = 0; setIndex < settings.numSets; setIndex += 1) {
    const locks = lockedForSet(lockedSlots, setIndex, songs)
    const fixedIndices = new Set(locks.map((lock) => lock.index))
    const lockedAt = (index) => locks.find((lock) => lock.index === index)?.song
    let setSongs = []
    let opener = lockedAt(0)
    if (!opener) {
      const openers = regularPool.filter((song) => song.opener && !usedIds.has(song.id))
      opener = weightedPick(openers.length ? openers : regularPool, usedIds, rng)
    }
    if (!opener || opener.encoreOnly) return null
    setSongs.push(opener)
    usedIds.add(opener.id)

    for (let slot = 1; slot <= 2; slot += 1) {
      let pick = lockedAt(slot)
      if (!pick) pick = weightedPick(regularPool.filter((song) => song.tuning === opener.tuning), usedIds, rng)
      if (!pick || pick.tuning !== opener.tuning || pick.encoreOnly) return null
      setSongs.push(pick)
      usedIds.add(pick.id)
    }

    let currentSeconds = calculateSetMetrics(setSongs, settings.bufferSeconds).totalSeconds
    const highestLockIndex = locks.reduce((highest, lock) => Math.max(highest, lock.index), -1)
    let middleCount = 0
    while (currentSeconds < minSeconds || setSongs.length < highestLockIndex) {
      let pool = regularPool.filter((song) => !usedIds.has(song.id))
      if (settings.maxTuningChanges === 0) pool = pool.filter((song) => song.tuning === opener.tuning)
      if (!pool.length) break
      const last = setSongs.at(-1)
      if (last?.vocalDifficulty >= 4) {
        const safer = pool.filter((song) => song.vocalDifficulty < 4)
        if (safer.length) pool = safer
      }
      let pick = null
      if (settings.maxTuningChanges <= 1 && rng() < 0.75) pick = weightedPick(pool.filter((song) => song.tuning === opener.tuning), usedIds, rng)
      pick ||= weightedPick(pool, usedIds, rng)
      if (!pick) break
      const projected = currentSeconds + settings.bufferSeconds + pick.durationSec
      if (projected > maxSeconds + 120) {
        const shorter = pool.filter((song) => currentSeconds + settings.bufferSeconds + song.durationSec <= maxSeconds + 120)
        pick = weightedPick(shorter, usedIds, rng)
        if (!pick) break
      }
      setSongs.push(pick)
      usedIds.add(pick.id)
      currentSeconds += settings.bufferSeconds + pick.durationSec
      middleCount += 1
      if (currentSeconds >= minSeconds && setSongs.length >= highestLockIndex) break
      if (middleCount >= 12) break
    }

    let closerPool = regularPool.filter((song) => song.closer && !usedIds.has(song.id))
    if (settings.maxTuningChanges === 0) closerPool = closerPool.filter((song) => song.tuning === opener.tuning)
    let closer = weightedPick(closerPool, usedIds, rng)
    if (!closer) {
      let fallback = regularPool.filter((song) => !usedIds.has(song.id))
      if (settings.maxTuningChanges === 0) fallback = fallback.filter((song) => song.tuning === opener.tuning)
      closer = weightedPick(fallback, usedIds, rng)
    }
    if (!closer) return null
    usedIds.add(closer.id)
    setSongs.push(closer)
    setSongs = orderSetSongs(setSongs, settings.groupTuning, settings.groupGuitars, fixedIndices)
    setSongs = applyLockedReplacements(setSongs, locks, usedIds)

    if (setSongs.length < 4 || new Set(setSongs.map((song) => song.id)).size !== setSongs.length) return null
    const metrics = calculateSetMetrics(setSongs, settings.bufferSeconds)
    if (metrics.totalSeconds < minSeconds || metrics.totalSeconds > maxSeconds) return null
    if (metrics.tuningChanges > settings.maxTuningChanges || metrics.guitarChanges > settings.maxGuitarChanges) return null
    sets.push({ id: `set-${setIndex + 1}`, title: `Set ${setIndex + 1}`, songs: setSongs })
  }

  if (settings.encoreCount > 0) {
    const setIndex = settings.numSets
    const locks = lockedForSet(lockedSlots, setIndex, songs)
    const encorePool = getActivePool(songs, settings, excludedIds, true)
    const encoreSongs = []
    for (let index = 0; index < settings.encoreCount; index += 1) {
      let pick = locks.find((lock) => lock.index === index)?.song
      if (!pick) {
        pick = weightedPick(encorePool.filter((song) => song.encore), usedIds, rng)
          || weightedPick(encorePool.filter((song) => song.closer), usedIds, rng)
          || weightedPick(encorePool, usedIds, rng)
      }
      if (!pick || usedIds.has(pick.id) && !locks.some((lock) => lock.song.id === pick.id)) return null
      encoreSongs.push(pick)
      usedIds.add(pick.id)
    }
    const transitions = countTransitions(encoreSongs)
    if (transitions.tuningChanges > settings.maxTuningChanges || transitions.guitarChanges > settings.maxGuitarChanges) return null
    sets.push({ id: 'encore', title: 'Encore', songs: encoreSongs })
  }
  return sets
}

export function generateSetlist({ songs, settings, excludedIds = [], lockedSlots = {}, rng = Math.random }) {
  const regularPool = getActivePool(songs, settings, excludedIds, false)
  const encorePool = getActivePool(songs, settings, excludedIds, true)
  const minimumRegular = settings.numSets * 4
  if (regularPool.length < minimumRegular) {
    return { ok: false, error: `Active regular pool has ${regularPool.length} songs; at least ${minimumRegular} are required.` }
  }
  if (new Set([...regularPool, ...encorePool].map((song) => song.id)).size < minimumRegular + settings.encoreCount) {
    return { ok: false, error: 'The active pool does not contain enough unique songs for these sets and encore.' }
  }
  const lockIds = Object.values(lockedSlots)
  if (new Set(lockIds).size !== lockIds.length) return { ok: false, error: 'The same song is locked in more than one slot.' }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const sets = attemptBuild({ songs, settings, excludedIds, lockedSlots, rng })
    if (sets) return { ok: true, sets }
  }
  return {
    ok: false,
    error: 'Could not build sets within the ±4 minute duration window and selected transition limits. Relax a limit, include more songs, or adjust the target length.',
  }
}
