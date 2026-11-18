import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

test('loads the master CSV without generating until requested', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Load CSV').setInputFiles(path.join(root, 'Song List - MASTER LIST.csv'))
  await expect(page.getByText(/Song List - MASTER LIST.csv • 85 songs/)).toBeVisible()
  await expect(page.getByText('Set 1', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Print/ })).toBeDisabled()

  await page.getByRole('button', { name: /Generate New Setlist/ }).click()
  await expect(page.getByText('Set 1', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/85 songs/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Print/ })).toBeEnabled()
})

test('print mode hides editing controls', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('button', { name: /Generate New Setlist/ })).toBeHidden()
})

test('print mode uses no more than two intact sets per page', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Load CSV').setInputFiles(path.join(root, 'Song List - MASTER LIST.csv'))
  await page.getByRole('button', { name: /Generate New Setlist/ }).click()
  await expect(page.getByText('Set 1', { exact: true })).toBeVisible({ timeout: 15_000 })
  for (const label of ['Show Artist Name', 'Show Genre', 'Show Tempo (BPM)']) await page.getByLabel(label, { exact: true }).check()
  await page.emulateMedia({ media: 'print' })

  const pages = page.locator('.print-page')
  await expect(pages).toHaveCount(3)
  const layout = await pages.evaluateAll((items) => items.map((item) => {
    const bounds = item.getBoundingClientRect()
    const cards = [...item.querySelectorAll('.set-card')]
    return {
      cardCount: cards.length,
      cardsFit: cards.every((card) => card.getBoundingClientRect().bottom <= bounds.bottom + 1),
      songsFill: cards.every((card) => {
        if (Number(card.dataset.songCount) <= 4) return true
        const lastSong = card.querySelector('.song-row:last-of-type')
        return lastSong && card.getBoundingClientRect().bottom - lastSong.getBoundingClientRect().bottom <= 4
      }),
    }
  }))
  expect(layout.every(({ cardCount, cardsFit, songsFill }) => cardCount <= 2 && cardsFit && songsFill), JSON.stringify(layout)).toBe(true)

  const wrappedNumbers = await page.locator('.song-number').evaluateAll((items) => items.filter((item) => item.scrollWidth > item.clientWidth + 1).map((item) => item.textContent))
  expect(wrappedNumbers).toEqual([])

  const stackFailures = await page.locator('.song-row').evaluateAll((rows) => rows.map((row) => {
    const number = row.querySelector('.song-number')?.getBoundingClientRect()
    const name = row.querySelector('.song-name')?.getBoundingClientRect()
    const artist = row.querySelector('.song-artist')?.getBoundingClientRect()
    const details = row.querySelector('.song-details')?.getBoundingClientRect()
    if (!number || !name || !artist || !details) return { song: row.querySelector('.song-name')?.textContent, reason: 'missing element' }
    const aligned = name.left > number.right && Math.abs(artist.left - name.left) <= 1 && Math.abs(details.left - name.left) <= 1
    const vertical = artist.top >= name.bottom - 1 && details.top >= artist.bottom - 1
    const unclipped = [name, artist, details].every((bounds) => bounds.right <= row.getBoundingClientRect().right + 1)
    return aligned && vertical && unclipped ? null : {
      song: row.querySelector('.song-name')?.textContent,
      aligned,
      vertical,
      unclipped,
      positions: { numberLeft: number.left, numberRight: number.right, nameLeft: name.left, artistLeft: artist.left, detailsLeft: details.left },
    }
  }).filter(Boolean))
  expect(stackFailures).toEqual([])
})
