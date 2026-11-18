import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../../domain/constants'
import { normalizeRows } from '../song-data/normalizeSongs'
import { calculateSetMetrics } from './metrics'
import { calculateCompleteSetlistCost, calculateOrderCost, generateSetlist, getActivePool, getReplacementCandidates, selectSwapSong, weightedPick } from './generator'

const csv = fs.readFileSync(path.resolve(process.cwd(), 'Song List - MASTER LIST.csv'), 'utf8')
const normalizedSongs = normalizeRows(Papa.parse(csv, { header: true, skipEmptyLines: true }).data)
const songs = normalizedSongs.songs

function seeded(seed = 123456) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

describe('setlist generator', () => {
  it('loads the migrated 85-song master list', () => {
    expect(songs).toHaveLength(85)
    expect(normalizedSongs.issues).toEqual([])
    expect(new Set(songs.map((song) => song.energyRating))).toEqual(new Set([1, 2, 3, 4, 5]))
    expect(songs.filter((song) => song.bassTuning)).toHaveLength(6)
    expect(songs.find((song) => song.song === 'Welcome to the Black Parade')?.encoreOnly).toBe(true)
  })

  it('builds a valid deterministic four-set gig', () => {
    const result = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, rng: seeded(42) })
    expect(result.ok, result.error).toBe(true)
    expect(result.diagnostics.validCandidateCount).toBeGreaterThan(1)
    expect(result.diagnostics.averageEnergyBySet).toHaveLength(result.sets.length)
    const allSongs = result.sets.flatMap((set) => set.songs)
    expect(new Set(allSongs.map((song) => song.id)).size).toBe(allSongs.length)
    result.sets.filter((set) => set.title !== 'Encore').forEach((set) => {
      const metrics = calculateSetMetrics(set.songs, DEFAULT_SETTINGS.bufferSeconds)
      expect(metrics.totalSeconds).toBeGreaterThanOrEqual(DEFAULT_SETTINGS.targetMinutes * 60 - 240)
      expect(metrics.totalSeconds).toBeLessThanOrEqual(DEFAULT_SETTINGS.targetMinutes * 60 + 240)
      expect(metrics.tuningChanges).toBeLessThanOrEqual(DEFAULT_SETTINGS.maxTuningChanges)
      expect(metrics.guitarChanges).toBeLessThanOrEqual(DEFAULT_SETTINGS.maxGuitarChanges)
      expect(new Set(set.songs.slice(0, 3).map((song) => song.tuning)).size).toBe(1)
      expect(set.songs.slice(0, 3).every((song) => song.weight === 1)).toBe(true)
      expect(set.songs[0].opener).toBe(true)
      expect(set.songs.at(-1).closer).toBe(true)
      expect(set.songs.some((song) => song.encoreOnly)).toBe(false)
    })
  })

  it('builds every supported regular-set count', () => {
    for (let numSets = 1; numSets <= 4; numSets += 1) {
      const settings = { ...DEFAULT_SETTINGS, numSets, encoreCount: 0 }
      const result = generateSetlist({ songs, settings, rng: seeded(400 + numSets) })
      expect(result.ok, `${numSets} set(s): ${result.error}`).toBe(true)
      expect(result.sets).toHaveLength(numSets)
    }
  })

  it('supports a 90-minute single set without an artificial song-count cap', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      numSets: 1,
      targetMinutes: 90,
      bufferSeconds: 1,
      encoreCount: 0,
      maxTuningChanges: 99,
      maxGuitarChanges: 99,
      includeWeight4: true,
    }
    const result = generateSetlist({ songs, settings, rng: seeded(9090) })
    expect(result.ok, result.error).toBe(true)
    const metrics = calculateSetMetrics(result.sets[0].songs, settings.bufferSeconds)
    expect(result.sets[0].songs.length).toBeGreaterThan(16)
    expect(metrics.totalSeconds).toBeGreaterThanOrEqual(86 * 60)
    expect(metrics.totalSeconds).toBeLessThanOrEqual(94 * 60)
  })

  it('preserves opener and closer roles across randomized generations', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const result = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, rng: seeded(seed) })
      expect(result.ok, `seed ${seed}: ${result.error}`).toBe(true)
      result.sets.filter((set) => set.title !== 'Encore').forEach((set) => {
        expect(set.songs[0].opener, `seed ${seed}: ${set.title} opener`).toBe(true)
        expect(set.songs.at(-1).closer, `seed ${seed}: ${set.title} closer`).toBe(true)
      })
    }
  })

  it('honors a locked middle slot', () => {
    const lockedSong = songs.find((song) => song.song === 'Numb')
    const result = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, lockedSlots: { '0-4': lockedSong.id }, rng: seeded(91) })
    expect(result.ok, result.error).toBe(true)
    expect(result.sets[0].songs[4].id).toBe(lockedSong.id)
  })

  it('filters weight 4 and encore-only songs from the regular pool', () => {
    const pool = getActivePool(songs, DEFAULT_SETTINGS, new Set(), false)
    expect(pool.some((song) => song.weight === 4)).toBe(false)
    expect(pool.some((song) => song.encoreOnly)).toBe(false)
  })

  it('uses configured weighting', () => {
    const pick = weightedPick([{ ...songs[0], id: 'a', weight: 1 }, { ...songs[1], id: 'b', weight: 4 }], new Set(), () => 0)
    expect(pick.id).toBe('a')
  })

  it('treats two-to-three song genre runs as a tertiary ordering preference', () => {
    const base = { ...songs[0], tuning: 'Standard', twoGuitars: false, vocalDifficulty: 1 }
    const grouped = [
      { ...base, id: 'a1', genre: 'A' },
      { ...base, id: 'a2', genre: 'A' },
      { ...base, id: 'b1', genre: 'B' },
      { ...base, id: 'b2', genre: 'B' },
    ]
    const scattered = [grouped[0], grouped[2], grouped[1], grouped[3]]
    const enabled = { groupTuning: true, groupGuitars: true, groupGenre: true }
    const disabled = { ...enabled, groupGenre: false }
    expect(calculateOrderCost(grouped, enabled)).toBeLessThan(calculateOrderCost(scattered, enabled))
    expect(calculateOrderCost(grouped, disabled)).toBe(calculateOrderCost(scattered, disabled))
  })

  it('penalizes abrupt energy and tempo jumps as soft ordering costs', () => {
    const base = { ...songs[0], tuning: 'Standard', twoGuitars: false, vocalDifficulty: 1, genre: 'A' }
    const smooth = [
      { ...base, id: 'a', energyRating: 2, bpm: 110 },
      { ...base, id: 'b', energyRating: 3, bpm: 125 },
      { ...base, id: 'c', energyRating: 4, bpm: 140 },
    ]
    const abrupt = [smooth[0], { ...smooth[2] }, { ...smooth[1] }]
    expect(calculateOrderCost(smooth, DEFAULT_SETTINGS)).toBeLessThan(calculateOrderCost(abrupt, DEFAULT_SETTINGS))
  })

  it('selects a deterministic best candidate that is no worse than the first valid build', () => {
    const first = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, rng: seeded(77), maxValidCandidates: 1 })
    const best = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, rng: seeded(77) })
    const repeated = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, rng: seeded(77) })
    expect(best.ok, best.error).toBe(true)
    expect(best.sets).toEqual(repeated.sets)
    expect(calculateCompleteSetlistCost(best.sets, DEFAULT_SETTINGS)).toBeLessThanOrEqual(calculateCompleteSetlistCost(first.sets, DEFAULT_SETTINGS))
  })

  it('swaps with a candidate that preserves generator constraints and priorities', () => {
    const generated = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, rng: seeded(42) })
    expect(generated.ok, generated.error).toBe(true)
    const result = selectSwapSong({
      sets: generated.sets,
      setIndex: 0,
      songIndex: 4,
      songs,
      settings: { ...DEFAULT_SETTINGS },
      rng: seeded(17),
    })
    expect(result.ok, result.error).toBe(true)
    const updated = generated.sets[0].songs.map((song, index) => index === 4 ? result.song : song)
    const metrics = calculateSetMetrics(updated, DEFAULT_SETTINGS.bufferSeconds)
    expect(updated.slice(0, 3).every((song) => song.weight === 1)).toBe(true)
    expect(new Set(updated.slice(0, 3).map((song) => song.tuning)).size).toBe(1)
    expect(metrics.tuningChanges).toBeLessThanOrEqual(DEFAULT_SETTINGS.maxTuningChanges)
    expect(metrics.guitarChanges).toBeLessThanOrEqual(DEFAULT_SETTINGS.maxGuitarChanges)
    expect(metrics.totalSeconds).toBeGreaterThanOrEqual(DEFAULT_SETTINGS.targetMinutes * 60 - 240)
    expect(metrics.totalSeconds).toBeLessThanOrEqual(DEFAULT_SETTINGS.targetMinutes * 60 + 240)
  })

  it('manual replacement candidates still block duplicates and regular-set Encore-only songs', () => {
    const generated = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, rng: seeded(42) })
    const candidates = getReplacementCandidates({ sets: generated.sets, setIndex: 0, songIndex: 4, songs, settings: DEFAULT_SETTINGS, override: true })
    const usedIds = new Set(generated.sets.flatMap((set) => set.songs.map((song) => song.id)))
    expect(candidates.some(({ song }) => usedIds.has(song.id))).toBe(false)
    expect(candidates.some(({ song }) => song.encoreOnly)).toBe(false)
  })

  it('rejects a non-Weight 1 lock in an opening slot', () => {
    const nonPrioritySong = songs.find((song) => song.weight === 2)
    const result = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, lockedSlots: { '0-1': nonPrioritySong.id }, rng: seeded(8) })
    expect(result).toMatchObject({ ok: false })
    expect(result.error).toContain('must be Weight 1')
  })

  it('rejects a Weight 1 lock that is not marked as an opener in slot one', () => {
    const nonOpener = songs.find((song) => song.weight === 1 && !song.opener)
    const result = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, lockedSlots: { '0-0': nonOpener.id }, rng: seeded(8) })
    expect(result).toMatchObject({ ok: false })
    expect(result.error).toContain('must be marked as an opener')
  })
})
