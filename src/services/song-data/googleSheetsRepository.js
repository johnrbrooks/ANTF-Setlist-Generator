import { normalizeRows, rowsFromValues } from './normalizeSongs'

export class GoogleSheetsError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'GoogleSheetsError'
    this.code = code
  }
}

export class GoogleSheetsSongRepository {
  constructor({ spreadsheetId, range, accessToken }) {
    this.spreadsheetId = spreadsheetId
    this.range = range
    this.accessToken = accessToken
  }

  async listSongs() {
    if (!this.spreadsheetId || !this.range) throw new GoogleSheetsError('Google Sheet ID or range is not configured.', 'CONFIG')
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(this.spreadsheetId)}/values/${encodeURIComponent(this.range)}?majorDimension=ROWS`
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${this.accessToken}` } })
    if (response.status === 401) throw new GoogleSheetsError('Google authorization expired. Reconnect to continue.', 'AUTH_EXPIRED')
    if (response.status === 403) throw new GoogleSheetsError('This Google account cannot read the configured Sheet.', 'FORBIDDEN')
    if (response.status === 404) throw new GoogleSheetsError('The configured Google Sheet or range was not found.', 'NOT_FOUND')
    if (response.status === 429) throw new GoogleSheetsError('Google Sheets is temporarily rate-limiting requests. Try again shortly.', 'RATE_LIMIT')
    if (!response.ok) throw new GoogleSheetsError(`Google Sheets request failed (${response.status}).`, 'HTTP')
    const payload = await response.json()
    return normalizeRows(rowsFromValues(payload.values ?? []))
  }
}
