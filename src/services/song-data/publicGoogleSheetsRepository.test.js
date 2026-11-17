import { afterEach, describe, expect, it, vi } from 'vitest'
import { PublicGoogleSheetsSongRepository, buildPublicSheetCsvUrl } from './publicGoogleSheetsRepository'

const csv = `Song ID,Song,Artist,Key,BPM,Song Length,2 Guitars?,Tuning,Weighting,Style,Vocal Difficulty,Opener,Closer,Encore,Encore Only
dance-dance,"Dance, Dance",Fall Out Boy,B Minor,114,3:00,Y,Standard,1,Emo Classic,1,,,,`

afterEach(() => vi.restoreAllMocks())

describe('public Google Sheets repository', () => {
  it('builds a public CSV query URL from the normal sharing link', () => {
    const endpoint = new URL(buildPublicSheetCsvUrl('https://docs.google.com/spreadsheets/d/sheet-123/edit?gid=456#gid=456'))
    expect(endpoint.pathname).toBe('/spreadsheets/d/sheet-123/gviz/tq')
    expect(endpoint.searchParams.get('tqx')).toBe('out:csv')
    expect(endpoint.searchParams.get('gid')).toBe('456')
    expect(endpoint.searchParams.get('range')).toBe('A:O')
  })

  it('loads and normalizes public CSV data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv' } })))
    const repository = new PublicGoogleSheetsSongRepository({
      sheetUrl: 'https://docs.google.com/spreadsheets/d/sheet-123/edit?gid=456',
      range: 'A:O',
    })
    const result = await repository.listSongs()
    expect(result.songs).toHaveLength(1)
    expect(result.songs[0]).toMatchObject({ id: 'dance-dance', song: 'Dance, Dance', durationSec: 180 })
  })

  it('reports private or sign-in responses clearly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<!doctype html><html>Sign in</html>', { status: 200, headers: { 'Content-Type': 'text/html' } })))
    const repository = new PublicGoogleSheetsSongRepository({ sheetUrl: 'https://docs.google.com/spreadsheets/d/sheet-123/edit?gid=456' })
    await expect(repository.listSongs()).rejects.toMatchObject({ code: 'NOT_PUBLIC' })
  })
})
