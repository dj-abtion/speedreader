# Speedreader

An installable, offline-capable RSVP speed reader. See [SPEC.md](SPEC.md) for the full v1 design.

## Development

```sh
npm install
npm run dev     # start the dev server
npm test        # unit tests (Vitest)
npm run check   # typecheck
npm run build   # production build to dist/
npm run test:e2e  # end-to-end tests (Playwright)
```

If Chromium is already installed, point Playwright at it instead of running `npx playwright install`:

```sh
CHROMIUM_EXECUTABLE=/path/to/chrome npm run test:e2e
```

## Deployment

Merging to `main` deploys to GitHub Pages at `https://dj-abtion.github.io/speedreader/` via `.github/workflows/deploy.yml`. The repository's Pages source must be set to **GitHub Actions**.

## Layout

- `src/core/` — framework-free reading logic: tokenizer, ORP pivot, timing, sentence navigation and the playback loop. Kept free of UI dependencies so it can be reused (e.g. by a future browser extension).
