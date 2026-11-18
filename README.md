# ANTF Setlist Generator 3.0

A frontend-only React setlist generator for ANTF. It keeps the weighted generation, transition management, song-pool controls, manual editing, CSV export, and printable stage sheet from the original single-file application while separating the UI, data access, and generation logic.

The legacy `ANTF_Setlist_Generator_V3.0.html` is retained as the visual and behavioral reference.

## Local development

Requirements: Node.js 20.19 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app reads a public, view-only Google Sheet without OAuth. It is also usable through **Load CSV**; the migrated `Song List - MASTER LIST.csv` contains stable IDs and the `Encore Only` field.

Useful commands:

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright browsers are intentionally not downloaded by `npm install`; run `npx playwright install chromium` once before the end-to-end suite.

## Google Sheet contract

Create or update one tab with this header row:

```text
Song ID, Song, Artist, Key, BPM, Song Length, 2 Guitars?, Tuning, Weighting, Style, Vocal Difficulty, Opener, Closer, Encore, Encore Only
```

- `Song ID` is a unique, stable string and must not change when rows are reordered.
- Durations use `m:ss`; weights are 1–4; vocal difficulty is 1–5.
- `Y`, `Yes`, `TRUE`, `1`, and `X` are accepted as true. Blank role fields are false.
- `Encore Only` also makes a song an encore candidate.
- Invalid rows are skipped and displayed as row-level warnings instead of silently receiving guessed musical data.

### Public Google Sheet setup

1. In Google Sheets, choose **Share**.
2. Under **General access**, select **Anyone with the link** and **Viewer**.
3. Copy `.env.example` to `.env.local` and set the normal sharing URL and optional A1 column range:

```text
VITE_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/.../edit?gid=...
VITE_GOOGLE_SHEET_RANGE=A:O
```

The `gid` in the sharing URL selects the tab, so no tab name or Google Cloud project is required. The app converts this URL to Google's public CSV query endpoint and reads columns A:O through the same validation pipeline used for uploaded CSV files.

`.env.local` is ignored by Git, but `VITE_*` values are embedded in the browser bundle and the public request is visible in browser developer tools. This keeps the URL out of source control, not secret from app users. Do not put sensitive data in the public Sheet.

## Architecture

- `src/domain` — constants and the normalized song contract.
- `src/services/song-data` — interchangeable public Google Sheets and CSV repositories plus shared normalization.
- `src/services/setlist` — pure weighted generation, ordering, metrics, and validation.
- `src/services/export` — standards-compliant CSV export.
- `src/features` — responsive settings, data-source controls, song-pool dialogs, and setlist editor.
- `src/app` — reducer-based session state.

The UI never reads Google or CSV rows directly. Both repositories return the same normalized `{ songs, issues, loadedAt }` result, so a future backend can be added as another repository without rewriting the generator.

## Railway deployment

1. Push this directory to a GitHub repository and create a Railway service from it.
2. Add `VITE_GOOGLE_SHEET_URL`, `VITE_GOOGLE_SHEET_RANGE`, and `VITE_SITE_URL` in Railway before building. Set `VITE_SITE_URL` to the public origin without a trailing slash, such as `https://setlists.example.com`, so shared-link preview images use an absolute URL.
3. Generate a stable Railway domain or attach a custom domain.

`railway.json` configures `npm run build` and `npm run start`. The production command serves `dist` as a single-page application on Railway's `$PORT`.

Vite embeds `VITE_*` values at build time. Changing them in Railway requires a fresh build/deployment.
