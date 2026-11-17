export const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceHover: '#273549',
  border: '#334155',
  text: '#f8fafc',
  muted: '#94a3b8',
  accent: '#38bdf8',
  accentHover: '#0284c7',
}

export const WEIGHT_MULTIPLIER = Object.freeze({ 1: 14, 2: 7, 3: 2.5, 4: 0.7 })
export const SET_TOLERANCE_SECONDS = 240
export const MAX_GENERATION_ATTEMPTS = 300

export const DEFAULT_SETTINGS = Object.freeze({
  numSets: 4,
  targetMinutes: 45,
  bufferSeconds: 30,
  encoreCount: 2,
  maxTuningChanges: 2,
  maxGuitarChanges: 4,
  groupTuning: true,
  groupGuitars: true,
  includeWeight4: false,
})

export const DEFAULT_DISPLAY = Object.freeze({
  artist: false,
  genre: false,
  vocal: false,
  duration: false,
  guitars: false,
  tuning: false,
  tempo: false,
  key: false,
})

export const GOOGLE_SHEETS_READONLY_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
