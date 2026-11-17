import fs from 'node:fs/promises'
import Papa from 'papaparse'

const path = new URL('../Song List - MASTER LIST.csv', import.meta.url)
const source = await fs.readFile(path, 'utf8')
const parsed = Papa.parse(source, { header: true, skipEmptyLines: 'greedy' })

if (parsed.errors.length) {
  throw new Error(parsed.errors.map((error) => error.message).join('; '))
}

const slug = (song, artist) => `${song}-${artist}`
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const rows = parsed.data.map((row) => ({
  'Song ID': row['Song ID'] || slug(row.Song, row.Artist),
  Song: row.Song,
  Artist: row.Artist,
  Key: row.Key,
  BPM: row.BPM,
  'Song Length': row['Song Length'],
  '2 Guitars?': row['2 Guitars?'],
  Tuning: row.Tuning,
  Weighting: row.Weighting,
  Style: row.Style,
  'Vocal Difficulty': row['Vocal Difficulty'],
  Opener: row.Opener,
  Closer: row.Closer,
  Encore: row.Encore,
  'Encore Only': row['Encore Only'] || (row.Song === 'Welcome to the Black Parade' ? 'Y' : ''),
}))

await fs.writeFile(path, `${Papa.unparse(rows, { newline: '\n' })}\n`)
console.log(`Migrated ${rows.length} songs with stable IDs and Encore Only metadata.`)
