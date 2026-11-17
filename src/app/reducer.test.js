import { describe, expect, it } from 'vitest'
import { appReducer, initialState } from './reducer'

const song = (id, encoreOnly = false) => ({ id, song: id, encoreOnly })

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
})
