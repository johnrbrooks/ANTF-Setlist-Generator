import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const generateButtonName = /Generate (New )?Setlist/

async function showDisplayFilters(page, labels) {
  const firstFilter = page.getByLabel(labels[0], { exact: true })
  if (!await firstFilter.isVisible()) await page.getByRole('button', { name: /Stage Sheet Filters/ }).click()
  for (const label of labels) await page.getByLabel(label, { exact: true }).check()
}

test('loads the master CSV without generating until requested', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Load CSV').setInputFiles(path.join(root, 'Song List - MASTER LIST.csv'))
  await expect(page.getByText(/Song List - MASTER LIST.csv • 85 songs/)).toBeVisible()
  await expect(page.getByText('Set 1', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Print/ })).toBeDisabled()

  await page.getByRole('button', { name: generateButtonName }).click()
  await expect(page.getByText('Set 1', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/85 songs/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Print/ })).toBeEnabled()
})

test('print mode hides editing controls', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('button', { name: generateButtonName })).toBeHidden()
})

test('print mode uses no more than two intact sets per page', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Load CSV').setInputFiles(path.join(root, 'Song List - MASTER LIST.csv'))
  await page.getByRole('button', { name: generateButtonName }).click()
  await expect(page.getByText('Set 1', { exact: true })).toBeVisible({ timeout: 15_000 })
  await showDisplayFilters(page, ['Show Artist Name', 'Show Genre', 'Show Tempo (BPM)'])
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

test('reports generation quality and supports controlled song replacement', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Load CSV').setInputFiles(path.join(root, 'Song List - MASTER LIST.csv'))
  await page.getByRole('button', { name: generateButtonName }).click()
  await expect(page.locator('.generation-feedback:visible')).toContainText(/Compared \d+ valid arrangement/, { timeout: 15_000 })
  await expect(page.getByLabel('Show Bass Tuning', { exact: true })).toBeChecked()

  const firstSongName = page.locator('.song-name').first()
  const originalSong = await firstSongName.textContent()
  await page.getByRole('button', { name: /Automatically replace .* with best match/ }).first().click()
  await expect(firstSongName).not.toHaveText(originalSong)

  await page.getByRole('button', { name: /Replace / }).first().click()
  const dialog = page.getByRole('dialog', { name: /Replace Song/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/preserve the active pool/)).toBeVisible()
  await dialog.getByLabel('Manual override').check()
  await expect(dialog.getByText(/may break role, opening, duration, or transition rules/)).toBeVisible()
})

test('generates and prints an extended single-set configuration', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Load CSV').setInputFiles(path.join(root, 'Song List - MASTER LIST.csv'))
  await page.getByLabel(/Number of Sets/).fill('1')
  await page.getByLabel(/Target Set Length/).fill('90')
  await page.getByLabel(/Song Buffer/).fill('1')
  await page.getByLabel(/Encore Songs/).fill('0')
  await page.getByLabel('Max Tuning Changes / Set').selectOption('99')
  await page.getByLabel('Max Guitar Changes / Set').selectOption('99')
  await page.getByRole('button', { name: generateButtonName }).click()
  await expect(page.getByText('Set 1', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.set-card')).toHaveCount(1)
  expect(await page.locator('.song-row').count()).toBeGreaterThan(16)

  await showDisplayFilters(page, ['Show Artist Name', 'Show Genre', 'Show Vocal Diff', 'Show Duration', 'Show Guitar Count', 'Show Guitar Tuning', 'Show Bass Tuning', 'Show Tempo (BPM)', 'Show Key'])
  await page.emulateMedia({ media: 'print' })
  const printPage = page.locator('.print-page')
  await expect(printPage).toHaveCount(1)
  await expect(printPage).toHaveClass(/print-ultra/)
  const fit = await printPage.evaluate((item) => {
    const pageBounds = item.getBoundingClientRect()
    const card = item.querySelector('.set-card')
    const lastSong = item.querySelector('.song-row:last-of-type')
    if (!card || !lastSong) return false
    return card.getBoundingClientRect().bottom <= pageBounds.bottom + 1 && lastSong.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom + 1
  })
  expect(fit).toBe(true)
})
