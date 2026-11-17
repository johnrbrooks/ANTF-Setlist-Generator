import Papa from 'papaparse'

export const EXPORT_HEADERS = ['Set', 'Order', 'Song', 'Artist', 'Genre', 'Vocal Difficulty', 'Key', 'BPM', 'Length', 'Tuning', '2 Guitars', 'Weight']

export function createSetlistCsv(sets) {
  const rows = sets.flatMap((set) => set.songs.map((song, index) => ({
    Set: set.title,
    Order: index + 1,
    Song: song.song,
    Artist: song.artist,
    Genre: song.genre,
    'Vocal Difficulty': song.vocalDifficulty,
    Key: song.key,
    BPM: song.bpm,
    Length: song.length,
    Tuning: song.tuning,
    '2 Guitars': song.twoGuitars ? 'Y' : 'N',
    Weight: song.weight,
  })))
  return Papa.unparse(rows, { columns: EXPORT_HEADERS, newline: '\n' })
}

export function downloadSetlistCsv(sets, filename = 'ANTF_Gig_Setlist_3.0.csv') {
  const blob = new Blob([createSetlistCsv(sets)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
