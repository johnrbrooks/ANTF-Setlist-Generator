import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

test('loads the master CSV and generates a responsive setlist', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Load CSV').setInputFiles(path.join(root, 'Song List - MASTER LIST.csv'))
  await expect(page.getByText('Set 1')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/85 songs/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Print/ })).toBeEnabled()
})

test('print mode hides editing controls', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('button', { name: /Generate New Setlist/ })).toBeHidden()
})
