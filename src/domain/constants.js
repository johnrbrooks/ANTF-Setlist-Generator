export const COLORS = {
  bg: '#070607',
  surface: '#141116',
  surfaceHover: '#241a29',
  border: '#43234f',
  text: '#ffffff',
  muted: '#c9b8ce',
  accent: '#b36bd5',
  accentHover: '#8e45b0',
}

export const WEIGHT_MULTIPLIER = Object.freeze({ 1: 14, 2: 7, 3: 2.5, 4: 0.7 })
export const SET_TOLERANCE_SECONDS = 240
export const MAX_GENERATION_ATTEMPTS = 300
export const MAX_VALID_CANDIDATES = 24

export const DEFAULT_SETTINGS = Object.freeze({
  numSets: 4,
  targetMinutes: 45,
  bufferSeconds: 30,
  encoreCount: 2,
  maxTuningChanges: 2,
  maxGuitarChanges: 4,
  groupTuning: true,
  groupGuitars: true,
  groupGenre: true,
  includeWeight4: false,
})

export const DEFAULT_DISPLAY = Object.freeze({
  artist: false,
  genre: false,
  vocal: false,
  duration: false,
  guitars: false,
  tuning: false,
  bassTuning: true,
  tempo: false,
  key: false,
})
