# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, equally first-class:

- **People reading long AI replies.** Abtion colleagues first, then other Claude users. A reply is too long to read comfortably in the terminal or chat, so they turn it into a reader link with `/speedread` and read it in one go, often on their phone.
- **Anyone with a long text.** Articles, emails, docs or notes they copied, pasted, shared or opened as a file, and want to get through faster without losing the thread.

In both cases the job is the same: finish a text they'd otherwise skim or put off, in less time, and know they read it.

## Product Purpose

Didread is an RSVP speed reader: words flash one or a few at a time at a fixed focal point, with the optimal recognition point highlighted so the eye never moves. Its line is "Too long? Did read."

Success means the reader finishes the text, understood it, and spent less time than they would have reading it normally.

## Positioning

- **From a Claude reply to reading in one tap.** The `/speedread` skill turns an AI reply into a private reader link that opens straight in Didread. No other speed reader is part of that workflow.
- **Private, offline, no account.** A static PWA with no backend. Text stays on the device: reader links carry it in the URL fragment, which never reaches a server, and shared text is handed over by the service worker instead of a URL. Everything works offline after the first visit.
- **Reading that respects the text.** Speed doesn't cost comprehension. Timing pauses at sentences, clauses and paragraphs and slows for long words and numbers. Large numbers are read in digit groups, code blocks stop playback to be read as code, Markdown is cleaned up, and resuming rewinds to the start of the sentence.

## Operating Context

- Input comes from the clipboard (the main action), pasted text, `.txt`/`.md` files, reader links (`#t=…`), Android share targets and the `/speedread` skill in Claude Code, Brewale and claude.ai.
- Reading happens on phones as often as desktops, often installed to the home screen. Desktop use is keyboard-driven (Space, arrow keys, 1–3, Esc).
- The library, reading positions and finish history live on the device only. There's no sync between devices.
- Users include Danish speakers: digit groups separated by `.` are read with Danish scale words.

## Capabilities and Constraints

- The full v1 behaviour is specified in [SPEC.md](SPEC.md), which stays the authority on features and timing.
- Static files only, served from GitHub Pages under `/speedreader/`. No backend, accounts or proxy, so fetching URLs and articles is out of scope.
- Space-delimited languages only. CJK and Thai are v2 candidates.
- Settings: 100–1000 WPM (default 300), 1–3 words per flash, light/dark/system theme, system or serif reading font, sizes S–XL.
- The repo, web address and on-device storage keys keep the old name `speedreader` so existing installs, libraries and links keep working.
- v2 candidates, not yet decided: EPUB import, a browser extension reusing `src/core/`, and CJK via `Intl.Segmenter`.

## Brand Commitments

- **Name:** Didread. The tagline is "Too long? Did read." and the finish stamp reads **Did read**.
- **Voice:** plain, short and friendly; it says what happens without hype. Examples: "Read faster, one word at a time.", "Works offline, one tap away", "4 min left".
- **Assets:** app icons and favicon in `public/`.

## Evidence on Hand

- The "time saved" figure is measured against an average adult reading speed of 238 wpm (Brysbaert, 2019).
- There are no testimonials, user counts, reading-speed or comprehension studies of Didread, or press. Future work must not invent any of these.

## Product Principles

1. **Comprehension over raw speed.** Every timing and display choice serves understanding at the chosen WPM.
2. **The text is private by default.** No design may route a user's text through a server, a URL that reaches a server, or a third party.
3. **Get to the first word fast.** From the clipboard, a link or a share to reading should take as few taps as possible.
4. **Stay out of the way while reading.** Controls fade during playback. The focal point and the word are the interface.
5. **Works anywhere, offline.** Phone or desktop, installed or in a tab, online or not.

## Accessibility & Inclusion

No formal standard. Best effort: keep the app usable by keyboard, readable in both themes, and adjustable in font and size.
