import { DEFAULT_DISPLAY, DEFAULT_SETTINGS } from '../domain/constants'
import { isValidSettingValue } from '../domain/settingsValidation'

export const initialState = {
  title: 'ANTF Lighthorse 12-16-26',
  songs: [],
  dataIssues: [],
  source: { type: 'none', label: 'No songs loaded', loadedAt: null },
  sourceChanged: false,
  settings: { ...DEFAULT_SETTINGS },
  display: { ...DEFAULT_DISPLAY },
  excludedIds: new Set(),
  lockedSlots: {},
  sets: [],
  generationError: '',
  generationDiagnostics: null,
}

function rebuildLocks(sets, lockedIds) {
  const locks = {}
  sets.forEach((set, setIndex) => set.songs.forEach((song, songIndex) => {
    if (lockedIds.has(song.id)) locks[`${setIndex}-${songIndex}`] = song.id
  }))
  return locks
}

function updateSetSong(state, setIndex, songIndex, song) {
  const sets = state.sets.map((set, index) => index === setIndex ? { ...set, songs: set.songs.map((item, itemIndex) => itemIndex === songIndex ? song : item) } : set)
  const lockedSlots = { ...state.lockedSlots }
  delete lockedSlots[`${setIndex}-${songIndex}`]
  return { ...state, sets, lockedSlots, generationDiagnostics: null }
}

export function moveSongInSets(sourceSets, { fromSet, fromIndex, toSet, toIndex }) {
  const sets = sourceSets.map((set) => ({ ...set, songs: [...set.songs] }))
  const [moved] = sets[fromSet].songs.splice(fromIndex, 1)
  let targetIndex = toIndex
  if (fromSet === toSet && fromIndex < toIndex) targetIndex -= 1
  targetIndex = Math.max(0, Math.min(targetIndex, sets[toSet].songs.length))
  sets[toSet].songs.splice(targetIndex, 0, moved)
  return sets
}

export function regularStartsUseWeightOne(sets) {
  return sets
    .filter((set) => set.title !== 'Encore')
    .every((set) => set.songs.slice(0, 3).every((song) => song.weight === 1))
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'SET_TITLE': return { ...state, title: action.value }
    case 'SET_SETTING': {
      if (!isValidSettingValue(action.name, action.value)) return state
      return { ...state, settings: { ...state.settings, [action.name]: action.value }, lockedSlots: action.name === 'numSets' ? {} : state.lockedSlots }
    }
    case 'SET_DISPLAY': return { ...state, display: { ...state.display, [action.name]: action.value } }
    case 'LOAD_SONGS': {
      const validIds = new Set(action.songs.map((song) => song.id))
      const excludedIds = new Set([...state.excludedIds].filter((id) => validIds.has(id)))
      const lockedSlots = Object.fromEntries(Object.entries(state.lockedSlots).filter(([, id]) => validIds.has(id)))
      return {
        ...state,
        songs: action.songs,
        dataIssues: action.issues,
        source: action.source,
        excludedIds,
        lockedSlots,
        sourceChanged: state.sets.length > 0,
        generationError: '',
      }
    }
    case 'GENERATION_SUCCESS': return { ...state, sets: action.sets, generationDiagnostics: action.diagnostics ?? null, generationError: '', sourceChanged: false }
    case 'GENERATION_ERROR': return { ...state, generationError: action.error, generationDiagnostics: action.clear ? null : state.generationDiagnostics, sets: action.clear ? [] : state.sets }
    case 'TOGGLE_EXCLUDE': {
      const excludedIds = new Set(state.excludedIds)
      if (excludedIds.has(action.id)) excludedIds.delete(action.id)
      else excludedIds.add(action.id)
      return { ...state, excludedIds }
    }
    case 'TOGGLE_LOCK': {
      const key = `${action.setIndex}-${action.songIndex}`
      const lockedSlots = { ...state.lockedSlots }
      if (lockedSlots[key]) delete lockedSlots[key]
      else lockedSlots[key] = state.sets[action.setIndex].songs[action.songIndex].id
      return { ...state, lockedSlots }
    }
    case 'CLEAR_LOCKS': return { ...state, lockedSlots: {} }
    case 'REPLACE_SONG': return updateSetSong(state, action.setIndex, action.songIndex, action.song)
    case 'ADD_SONG': {
      const sets = state.sets.map((set, index) => index === action.setIndex ? { ...set, songs: [...set.songs, action.song] } : set)
      return { ...state, sets, generationDiagnostics: null }
    }
    case 'MOVE_SONG': {
      const lockedIds = new Set(Object.values(state.lockedSlots))
      const sets = moveSongInSets(state.sets, action)
      if (!regularStartsUseWeightOne(sets)) return state
      return { ...state, sets, lockedSlots: rebuildLocks(sets, lockedIds), generationDiagnostics: null }
    }
    case 'MOVE_SET': {
      const regularSets = state.sets.filter((set) => set.title !== 'Encore')
      const encore = state.sets.find((set) => set.title === 'Encore')
      if (action.fromIndex < 0 || action.fromIndex >= regularSets.length || action.toIndex < 0 || action.toIndex >= regularSets.length || action.fromIndex === action.toIndex) return state
      const lockedIds = new Set(Object.values(state.lockedSlots))
      const [moved] = regularSets.splice(action.fromIndex, 1)
      regularSets.splice(action.toIndex, 0, moved)
      const relabeled = regularSets.map((set, index) => ({ ...set, title: `Set ${index + 1}` }))
      const sets = encore ? [...relabeled, encore] : relabeled
      return { ...state, sets, lockedSlots: rebuildLocks(sets, lockedIds), generationDiagnostics: null }
    }
    default: return state
  }
}
