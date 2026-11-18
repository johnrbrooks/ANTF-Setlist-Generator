import { parseSongCsv } from './csvRepository'

export class PublicGoogleSheetsError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'PublicGoogleSheetsError'
    this.code = code
  }
}

export function buildPublicSheetCsvUrl(sheetUrl, range = 'A:Q') {
  let parsed
  try {
    parsed = new URL(sheetUrl)
  } catch {
    throw new PublicGoogleSheetsError('The configured Google Sheet URL is invalid.', 'CONFIG')
  }

  const idMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/)
  const spreadsheetId = idMatch?.[1]
  const gid = parsed.searchParams.get('gid') || new URLSearchParams(parsed.hash.replace(/^#/, '')).get('gid') || '0'
  if (!spreadsheetId) throw new PublicGoogleSheetsError('The configured URL is not a Google Sheets sharing link.', 'CONFIG')

  const endpoint = new URL(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq`)
  endpoint.searchParams.set('tqx', 'out:csv')
  endpoint.searchParams.set('gid', gid)
  endpoint.searchParams.set('range', range || 'A:Q')
  return endpoint.toString()
}

export class PublicGoogleSheetsSongRepository {
  constructor({ sheetUrl, range = 'A:Q' }) {
    this.sheetUrl = sheetUrl
    this.range = range
  }

  async listSongs() {
    if (!this.sheetUrl) throw new PublicGoogleSheetsError('VITE_GOOGLE_SHEET_URL is not configured.', 'CONFIG')
    const endpoint = buildPublicSheetCsvUrl(this.sheetUrl, this.range)
    const response = await fetch(endpoint, { cache: 'no-store' })

    if (response.status === 401 || response.status === 403) {
      throw new PublicGoogleSheetsError('The configured Google Sheet is not publicly readable. Set General access to “Anyone with the link” and Viewer.', 'NOT_PUBLIC')
    }
    if (response.status === 404) throw new PublicGoogleSheetsError('The configured Google Sheet or tab was not found.', 'NOT_FOUND')
    if (response.status === 429) throw new PublicGoogleSheetsError('Google Sheets is temporarily rate-limiting requests. Try again shortly.', 'RATE_LIMIT')
    if (!response.ok) throw new PublicGoogleSheetsError(`Google Sheets request failed (${response.status}).`, 'HTTP')

    const text = await response.text()
    if (/^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
      throw new PublicGoogleSheetsError('Google returned a sign-in page. Confirm the Sheet is shared as “Anyone with the link” with Viewer access.', 'NOT_PUBLIC')
    }

    const result = parseSongCsv(text)
    if (!result.songs.length) {
      throw new PublicGoogleSheetsError('No valid songs were found in the public Sheet. Check the selected tab, A:Q headers, and sharing settings.', 'NO_SONGS')
    }
    return result
  }
}
