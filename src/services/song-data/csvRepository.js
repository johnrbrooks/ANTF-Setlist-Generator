import Papa from 'papaparse'
import { normalizeRows } from './normalizeSongs'

export function parseSongCsv(text) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: 'greedy', transformHeader: (header) => header.trim() })
  const result = normalizeRows(parsed.data)
  const parserIssues = parsed.errors.map((error) => ({
    row: (error.row ?? 0) + 2,
    level: 'error',
    message: error.message,
  }))
  return { ...result, issues: [...parserIssues, ...result.issues] }
}

export class CsvSongRepository {
  constructor(file) {
    this.file = file
  }

  async listSongs() {
    const text = await this.file.text()
    return parseSongCsv(text)
  }
}
