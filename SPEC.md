# Speedreader — v1 spec

An RSVP (Rapid Serial Visual Presentation) speed reader: words flash one at a time at a fixed focal point, with the optimal recognition point (ORP) letter highlighted so the eye never moves.

## Platform

- Installable, offline-capable **PWA**. Static files only — no backend, no accounts.
- Hosted on **GitHub Pages**, deployed by GitHub Actions.

## Input

- Paste text into a textarea.
- Open a `.txt` or `.md` file.
- Web Share Target: share text to the installed app (Android; iOS Safari does not support share targets).
- **Not in v1:** URL / article fetching. Browsers cannot fetch arbitrary pages (CORS) without a proxy, which would break "no backend". A shared bare URL shows a friendly "not supported" message.
- Markdown is stripped to plain text before tokenizing.

## Persistence

- **Library** stored on-device in IndexedDB. Each document: `id`, `title` (first line or filename), `text`, `position` (word index), `lastOpenedAt`.
- **Settings** in `localStorage`: WPM, theme, font family, font size.
- No sync between devices.

## Tokenizer

Pure TypeScript, no UI dependencies (reusable by a future browser extension).

- Split on whitespace; em dashes and ellipses become separate breakpoints.
- Hyphenated compounds stay whole unless longer than 13 characters.
- Any token longer than 13 characters is split into chunks of about 12 characters, each but the last ending in `-`.
- Each token carries flags: `endsSentence`, `endsClause`, `endsParagraph`. These drive both pause timing and sentence navigation.
- **v1 scope:** space-delimited languages only. No CJK/Thai.

## Timing

- WPM range 100–1000, step 25, default 300. WPM is the **average** rate, not the literal flash rate.
- Fixed multipliers on the base duration (60 000 / WPM ms):
  - ×2 at the end of a sentence (`. ! ?`)
  - ×1.5 at the end of a clause (`, ; :` and dashes)
  - extra time for long words (> 8 characters)
  - longer pause at paragraph breaks
- Ramp-up: the first few seconds after pressing play run slower, then ease up to the target WPM.
- Durations are normalized so a long text read at N WPM takes the same total time as N flat words per minute.
- Playback loop: `requestAnimationFrame` plus elapsed-time checks against `performance.now()`. No drift, pauses naturally in background tabs.

## Display

- ORP pivot index by word length: 1 → 0, 2–5 → 1, 6–9 → 2, 10–13 → 3, 14+ → 4.
- Three-span layout (before | pivot | after) around a fixed column slightly left of centre; pivot in an accent colour with thin guide ticks above and below. Works with proportional fonts.
- System UI font by default; optional serif.
- Font size slider S–XL, responsive `clamp()` by default.
- Theme follows the system, with a light / dark / system toggle.
- No token ever overflows the frame: chunking guarantees this at the default size; at XL a token that would overflow is scaled down.

## Controls

| Action | Input |
| --- | --- |
| Play / pause | Tap anywhere, `Space` |
| Back / forward one sentence | `←` / `→`, ⟲ / ⟳ buttons |
| Speed −/+ 25 WPM (works while playing) | `↓` / `↑`, − / + buttons |
| Seek | Draggable progress bar |

- Remaining time ("4 min left") shown, computed from current WPM.
- When paused, the surrounding sentence is shown faintly around the word for context.
- **Auto-rewind on resume:** resuming jumps back to the start of the current sentence.
- On mobile, controls fade while playing and return on pause.

## Screen sleep and backgrounding

- Screen Wake Lock held while playing, released on pause. Feature-detected; no-op if unsupported.
- On `visibilitychange` → hidden: pause and save position. Returning leaves it paused.
- Position saved every few seconds while playing and on every pause.

## Tech stack

- Svelte 5 + TypeScript + Vite
- `vite-plugin-pwa` (Workbox) for the service worker and manifest
- `idb` for IndexedDB
- `remove-markdown` for Markdown stripping
- Vitest (unit), Playwright (E2E)

## Testing

- Core logic (tokenizer, ORP, timing, sentence navigation, remaining time) is built test-first with Vitest, including a timing-accuracy test: 300 WPM averages 300 over a long text.
- One or two Playwright happy paths: paste → play → pause → reload → resumes at the same position; app loads offline after first visit.
- No component tests; E2E covers the UI at this size.

## Hosting and CI

- One GitHub Actions workflow: typecheck, lint and tests on every PR; build and deploy to GitHub Pages on merge to `main`.
- Vite `base: '/speedreader/'` must match the manifest `scope` and `start_url`, or the service worker and install break.
- No PR preview URLs; PWA install on a phone is verified on the deployed site.

## Later (v2 candidates)

- EPUB import
- Browser extension reusing the reader core
- Chunking mode (1–3 words per flash)
- CJK support via `Intl.Segmenter`
