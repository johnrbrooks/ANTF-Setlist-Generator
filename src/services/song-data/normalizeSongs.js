import { songSchema } from '../../domain/songSchema'

const normalizeHeader = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const getValue = (row, aliases) => {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]))
  for (const alias of aliases) {
    const value = normalized.get(normalizeHeader(alias))
    if (value !== undefined && String(value).trim() !== '') return value
  }
  return ''
}

const parseBoolean = (value) => ['y', 'yes', 'true', '1', 'x'].includes(String(value ?? '').trim().toLowerCase())

export function parseDuration(value) {
  const text = String(value ?? '').trim()
  const match = /^(\d+):(\d{1,2})$/.exec(text)
  if (!match) return null
  const minutes = Number(match[1])
  const seconds = Number(match[2])
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || seconds > 59) return null
  return minutes * 60 + seconds
}

const legacyId = (song, artist) => `legacy-${`${song}-${artist}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

export function normalizeRows(rows) {
  const songs = []
  const issues = []
  const seenIds = new Set()
  let defaultedEnergyCount = 0

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const title = String(getValue(row, ['Song', 'Title'])).trim()
    const artist = String(getValue(row, ['Artist'])).trim()
    const rawId = String(getValue(row, ['Song ID', 'ID'])).trim()
    const durationSec = parseDuration(getValue(row, ['Song Length', 'Length', 'Duration']))
    const encoreOnly = parseBoolean(getValue(row, ['Encore Only']))
    const rawEnergy = getValue(row, ['Energy Rating', 'Energy'])
    const parsedEnergy = Number(rawEnergy)
    const energyRating = Number.isInteger(parsedEnergy) && parsedEnergy >= 1 && parsedEnergy <= 5 ? parsedEnergy : 3
    const id = rawId || legacyId(title, artist)

    if (!rawId && title) {
      issues.push({ row: rowNumber, level: 'warning', message: `Missing Song ID; using temporary ID “${id}”.` })
    }

    const candidate = {
      id,
      song: title,
      artist,
      key: String(getValue(row, ['Key'])).trim(),
      bpm: Number(getValue(row, ['BPM'])),
      length: durationSec === null ? String(getValue(row, ['Song Length', 'Length', 'Duration'])).trim() : `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`,
      durationSec: durationSec ?? 0,
      twoGuitars: parseBoolean(getValue(row, ['2 Guitars?', 'Two Guitars', 'Guitar'])),
      tuning: String(getValue(row, ['Tuning'])).trim(),
      bassTuning: String(getValue(row, ['Bass Tuning'])).trim(),
      weight: Number(getValue(row, ['Weighting', 'Weight'])),
      genre: String(getValue(row, ['Style', 'Genre'])).trim(),
      vocalDifficulty: Number(getValue(row, ['Vocal Difficulty', 'Vocal'])),
      energyRating,
      opener: parseBoolean(getValue(row, ['Opener'])),
      closer: parseBoolean(getValue(row, ['Closer'])),
      encore: parseBoolean(getValue(row, ['Encore'])) || encoreOnly,
      encoreOnly,
    }

    const parsed = songSchema.safeParse(candidate)
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
      issues.push({ row: rowNumber, level: 'error', message })
      return
    }
    if (seenIds.has(parsed.data.id)) {
      issues.push({ row: rowNumber, level: 'error', message: `Duplicate Song ID “${parsed.data.id}”; row skipped.` })
      return
    }
    seenIds.add(parsed.data.id)
    if (rawEnergy === '' || energyRating !== parsedEnergy) defaultedEnergyCount += 1
    songs.push(parsed.data)
  })

  if (defaultedEnergyCount > 0) {
    issues.push({
      row: 0,
      level: 'warning',
      message: `${defaultedEnergyCount} song${defaultedEnergyCount === 1 ? '' : 's'} had a missing or invalid Energy Rating; neutral value 3 was used.`,
    })
  }

  return { songs, issues, loadedAt: new Date().toISOString() }
}

export function rowsFromValues(values) {
  if (!Array.isArray(values) || values.length < 2) return []
  const [headers, ...data] = values
  return data
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}
