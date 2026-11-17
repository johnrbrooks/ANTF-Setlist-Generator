import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../../domain/constants'
import { normalizeRows } from '../song-data/normalizeSongs'
import { calculateSetMetrics } from './metrics'
import { generateSetlist, getActivePool, weightedPick } from './generator'

const csv = fs.readFileSync(path.resolve(process.cwd(), 'Song List - MASTER LIST.csv'), 'utf8')
const songs = normalizeRows(Papa.parse(csv, { header: true, skipEmptyLines: true }).data).songs

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
    expect(songs.find((song) => song.song === 'Welcome to the Black Parade')?.encoreOnly).toBe(true)
  })

  it('builds a valid deterministic four-set gig', () => {
    const result = generateSetlist({ songs, settings: { ...DEFAULT_SETTINGS }, rng: seeded(42) })
    expect(result.ok, result.error).toBe(true)
    const allSongs = result.sets.flatMap((set) => set.songs)
    expect(new Set(allSongs.map((song) => song.id)).size).toBe(allSongs.length)
    result.sets.filter((set) => set.title !== 'Encore').forEach((set) => {
      const metrics = calculateSetMetrics(set.songs, DEFAULT_SETTINGS.bufferSeconds)
      expect(metrics.totalSeconds).toBeGreaterThanOrEqual(DEFAULT_SETTINGS.targetMinutes * 60 - 240)
      expect(metrics.totalSeconds).toBeLessThanOrEqual(DEFAULT_SETTINGS.targetMinutes * 60 + 240)
      expect(metrics.tuningChanges).toBeLessThanOrEqual(DEFAULT_SETTINGS.maxTuningChanges)
      expect(metrics.guitarChanges).toBeLessThanOrEqual(DEFAULT_SETTINGS.maxGuitarChanges)
      expect(new Set(set.songs.slice(0, 3).map((song) => song.tuning)).size).toBe(1)
      expect(set.songs.some((song) => song.encoreOnly)).toBe(false)
    })
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
})
