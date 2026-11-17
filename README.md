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

The app is usable without Google configuration through **Load CSV**. The migrated `Song List - MASTER LIST.csv` contains stable IDs and the `Encore Only` field.

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

### Google Cloud setup

1. Create a Google Cloud project and enable the Google Sheets API.
2. Configure the OAuth consent screen for the dedicated band account.
3. Create an OAuth 2.0 **Web application** client.
4. Add `http://localhost:5173` and the stable Railway/custom domain as Authorized JavaScript origins.
5. Share the private Sheet with the dedicated band account.
6. Copy `.env.example` to `.env.local` and set:

```text
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_SHEET_ID=...
VITE_GOOGLE_SHEET_RANGE=Songs!A:O
```

The app requests `spreadsheets.readonly`, fetches only that configured range, and keeps the short-lived access token in memory. OAuth client IDs and Sheet IDs are public browser configuration; never add a client secret, service-account key, password, or refresh token.

## Architecture

- `src/domain` — constants and the normalized song contract.
- `src/services/auth` — Google Identity Services token flow.
- `src/services/song-data` — interchangeable Google Sheets and CSV repositories plus shared normalization.
- `src/services/setlist` — pure weighted generation, ordering, metrics, and validation.
- `src/services/export` — standards-compliant CSV export.
- `src/features` — responsive settings, data-source controls, song-pool dialogs, and setlist editor.
- `src/app` — reducer-based session state.

The UI never reads Google or CSV rows directly. Both repositories return the same normalized `{ songs, issues, loadedAt }` result, so a future backend can be added as another repository without rewriting the generator.

## Railway deployment

1. Push this directory to a GitHub repository and create a Railway service from it.
2. Add the three `VITE_GOOGLE_*` variables in Railway before building.
3. Generate a stable Railway domain or attach a custom domain.
4. Add that exact origin to the OAuth client in Google Cloud and redeploy.

`railway.json` configures `npm run build` and `npm run start`. The production command serves `dist` as a single-page application on Railway's `$PORT`.

Vite embeds `VITE_*` values at build time. Changing them in Railway requires a fresh build/deployment.
