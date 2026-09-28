# Didread — v1 spec

An RSVP (Rapid Serial Visual Presentation) speed reader: words flash one at a time at a fixed focal point, with the optimal recognition point (ORP) letter highlighted so the eye never moves.

## Platform

- Installable, offline-capable **PWA**. Static files only — no backend, no accounts.
- Hosted on **GitHub Pages**, deployed by GitHub Actions.

## Input

- Paste text into a textarea, opened with "Paste text" (shown straight away where the clipboard can't be read).
- "Read clipboard" button (shown where `navigator.clipboard.readText` exists): one tap reads the copied text, which is the quickest route on iOS, where share targets aren't available.
- Reader links: `…/speedreader/#t=<payload>`, where the payload is the text compressed with `deflate-raw` and base64url-encoded. The fragment never reaches the server; the app clears it with `history.replaceState` as soon as it has read it. Opening a link whose text is already in the library resumes that copy. Decompressed text is capped at 5 MB. A reader link pasted or read from the clipboard opens the same way.
- Open a `.txt` or `.md` file.
- Web Share Target: share text to the installed app (Android; iOS Safari does not support share targets). Shares use POST and are answered by the service worker on the device, which parks the text in Cache Storage and opens the app with only a `?shared` flag, so shared text never appears in a URL, browser history or server logs.
- The `/speedread` Claude Code skill (`plugins/speedread/`) makes reader links from Claude replies. Its script reads the session transcript (`~/.claude/projects/*/<CLAUDE_CODE_SESSION_ID>.jsonl`) and takes the last finished reply before the current prompt: the assistant text after that turn's last tool call. Turns that asked for a link (a `/speedread` prompt, or a reply containing a speed-read link) are skipped when counting back. It compresses the reply with Node's `zlib.deflateRawSync`, which must stay byte-compatible with `decodeText`; a unit test enforces this.
- **Not in v1:** URL / article fetching. Browsers cannot fetch arbitrary pages (CORS) without a proxy, which would break "no backend". A shared bare URL shows a friendly "not supported" message.
- Markdown is stripped to plain text before tokenizing: always for `.md` files, and for pasted, shared, clipboard and linked text when it clearly looks like Markdown (headings, fences, bold, links, inline code, tables or a list), so plain prose is left alone.
  - A fenced code block reads as a single "(code block)" placeholder. The code itself is kept in the text between two private-use characters (U+E000, then the language and a newline, then the code, then U+E001), so it survives storage and links. Reaching the placeholder stops playback and shows the code, with its language and line count, in a scrolling panel. "Continue reading", play or `Space` carries on after the block.
  - A heading becomes its own paragraph.
  - List items and table rows (cells joined by dashes) that don't end in punctuation get a clause pause.

## Persistence

- **Library** stored on-device in IndexedDB. Each document: `id`, `title` (first line or filename), `text`, `position` (word index), `lastOpenedAt`, `readingMs` (time spent playing in the current read-through) and `finishedAt`.
- **Settings** in `localStorage`: WPM, theme, font family, font size.
- **Finishes** in `localStorage`: date, word count and reading time of each finished text, kept apart from the library so time saved survives deleting a text.

## Home and finishing

- "Read clipboard" is the main action; "Paste text" and "Open file" sit below it.
- Library cards show the title (two lines), a progress bar, the word count and "N% · M min left", or "Not started". A finished text shows a **Did read** stamp with its word count and reading time; opening it starts a new read-through from the beginning.
- Finishing a text opens a finish screen: the check draws itself in, with the word count, reading time and time saved, and the next unfinished text in the library. Android phones give a short vibration.
- Time saved is the time an average adult would take at 238 wpm (Brysbaert, 2019) minus the reading time, never below zero. The home screen shows this month's total once it reaches a minute.
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
- System UI font by default for the reading text, with an optional serif. The rest of the app uses Figtree, with Bricolage Grotesque for the name and large numbers; both are bundled so they work offline.
- Neutrals are tinted warm towards the orange accent.
- Font size S / M / L / XL, scaling the responsive `clamp()` size (M is the default).
- Theme follows the system, with a light / dark / system toggle.
- Theme, font and size are set with the "Aa" button on the home screen or in the reader, remembered in `localStorage`, and applied before the first render so a chosen theme never flashes.
- No token ever overflows the frame: chunking guarantees this at the default size; at XL a token that would overflow is scaled down.

## Controls

| Action | Input |
| --- | --- |
| Play / pause | Tap anywhere, `Space` |
| Back / forward one sentence | `←` / `→`, « / » buttons |
| Speed −/+ 25 WPM (works while playing) | `↓` / `↑`, − / + buttons |
| Seek | Drag the thin progress line along the bottom edge |
| Words per flash (1–3) | `1` / `2` / `3`, "N words" button |
| Theme, font, size | "Aa" button |
| Back to the library | `Esc`, ✕ button |

- When paused, a large play button sits between the sentence buttons, with the speed and words-per-flash controls below and the percentage read and remaining time ("4 min left", from the current WPM) under those.
- A speed or words-per-flash change made from the keyboard while playing is confirmed in a brief bubble, since the controls are hidden.
- When paused, the surrounding sentence is shown faintly around the word for context.
- **Auto-rewind on resume:** resuming jumps back to the start of the current sentence.
- On mobile, controls fade while playing and return on pause.

## Words per flash

- 1, 2 or 3 words per flash; default 1, remembered in `localStorage`.
- A chunk never runs past a clause, sentence or paragraph end, and stays within 18 characters, so pauses and sentence navigation are unchanged.
- A chunk is shown for the sum of its words' durations, so WPM stays the real average rate.
- Multi-word chunks pivot about 30% of the way in (never on a space) and use a smaller font; the saved position stays a word index, so resuming works across chunk sizes.
- Any word or chunk that would overflow its side of the frame is scaled down to fit.

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
- CJK support via `Intl.Segmenter`
