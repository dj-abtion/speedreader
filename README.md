# Speedreader

An installable, offline-capable RSVP speed reader. See [SPEC.md](SPEC.md) for the full v1 design.

## Development

```sh
npm install
npm run dev     # start the dev server
npm test        # unit tests (Vitest)
npm run check   # typecheck
npm run build   # production build to dist/
```

## Layout

- `src/core/` — framework-free reading logic: tokenizer, ORP pivot, timing, sentence navigation and the playback loop. Kept free of UI dependencies so it can be reused (e.g. by a future browser extension).
