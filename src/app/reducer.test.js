import { describe, expect, it } from 'vitest'
import { appReducer, initialState } from './reducer'

const song = (id, encoreOnly = false, weight = 1) => ({ id, song: id, encoreOnly, weight })

describe('app reducer', () => {
  it('remaps locks when songs move between sets', () => {
    const state = { ...initialState, sets: [{ id: 'set-1', title: 'Set 1', songs: [song('a'), song('b')] }, { id: 'set-2', title: 'Set 2', songs: [song('c')] }], lockedSlots: { '0-1': 'b' } }
    const next = appReducer(state, { type: 'MOVE_SONG', fromSet: 0, fromIndex: 1, toSet: 1, toIndex: 0 })
    expect(next.sets[1].songs.map((item) => item.id)).toEqual(['b', 'c'])
    expect(next.lockedSlots).toEqual({ '1-0': 'b' })
  })

  it('reconciles exclusions and locks after source refresh', () => {
    const state = { ...initialState, excludedIds: new Set(['a', 'missing']), lockedSlots: { '0-0': 'a', '0-1': 'missing' } }
    const next = appReducer(state, { type: 'LOAD_SONGS', songs: [song('a')], issues: [], source: { type: 'google' } })
    expect([...next.excludedIds]).toEqual(['a'])
    expect(next.lockedSlots).toEqual({ '0-0': 'a' })
  })

  it('rejects invalid configuration values at the state boundary', () => {
    const invalidMinutes = appReducer(initialState, { type: 'SET_SETTING', name: 'targetMinutes', value: 91 })
    const invalidBuffer = appReducer(initialState, { type: 'SET_SETTING', name: 'bufferSeconds', value: 61 })
    expect(invalidMinutes).toBe(initialState)
    expect(invalidBuffer).toBe(initialState)
  })

  it('accepts the expanded set, duration, and buffer ranges', () => {
    const oneSet = appReducer(initialState, { type: 'SET_SETTING', name: 'numSets', value: 1 })
    const longSet = appReducer(oneSet, { type: 'SET_SETTING', name: 'targetMinutes', value: 90 })
    const flexibleBuffer = appReducer(longSet, { type: 'SET_SETTING', name: 'bufferSeconds', value: 17 })
    expect(flexibleBuffer.settings).toMatchObject({ numSets: 1, targetMinutes: 90, bufferSeconds: 17 })
  })

  it('moves a regular set to a new position, relabels it, and remaps locks', () => {
    const state = {
      ...initialState,
      sets: [
        { id: 'original-1', title: 'Set 1', songs: [song('a')] },
        { id: 'original-2', title: 'Set 2', songs: [song('b')] },
        { id: 'encore', title: 'Encore', songs: [song('c')] },
      ],
      lockedSlots: { '0-0': 'a' },
    }
    const next = appReducer(state, { type: 'MOVE_SET', fromIndex: 0, toIndex: 1 })
    expect(next.sets.map((set) => [set.id, set.title])).toEqual([
      ['original-2', 'Set 1'],
      ['original-1', 'Set 2'],
      ['encore', 'Encore'],
    ])
    expect(next.lockedSlots).toEqual({ '1-0': 'a' })
  })

  it('blocks song moves that would put a non-Weight 1 song in an opening slot', () => {
    const state = {
      ...initialState,
      sets: [{ id: 'set-1', title: 'Set 1', songs: [song('a'), song('b'), song('c'), song('heavy', false, 2)] }],
    }
    const next = appReducer(state, { type: 'MOVE_SONG', fromSet: 0, fromIndex: 3, toSet: 0, toIndex: 1 })
    expect(next).toBe(state)
  })

  it('clears every lock without changing the current sets', () => {
    const sets = [{ id: 'set-1', title: 'Set 1', songs: [song('a')] }]
    const next = appReducer({ ...initialState, sets, lockedSlots: { '0-0': 'a' } }, { type: 'CLEAR_LOCKS' })
    expect(next.lockedSlots).toEqual({})
    expect(next.sets).toBe(sets)
  })
})
