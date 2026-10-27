---
target: the reader
total_score: 23
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/speedreader/src/lib/Reader.svelte"
target_fingerprint: "sha256:ffe3b7d484926c7d5bbce81a52b3823eb77364e0dae69ceeef1cb692f168b134"
target_path: /home/user/speedreader/src/lib/Reader.svelte
timestamp: 2026-10-27T07-26-11Z
slug: src-lib-reader-svelte
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Code-block stop shown only as "Paused"; empty state label before first play; "Tap anywhere to start" persists after seeking |
| 2 | Match System / Real World | 3 | "Tap anywhere" on desktop; « » read as track skip, not sentence; raw fence tag "TS" |
| 3 | User Control and Freedom | 3 | Aa panel can't be closed while playing; Esc with Aa open exits the reader |
| 4 | Consistency and Standards | 2 | Browser-default black focus ring instead of amber; static WPM readout looks like the chunk button; tap targets break the 2.75rem rule |
| 5 | Error Prevention | 3 | 24px seek strip on the bottom edge (iOS home gesture); stray stage tap starts playback |
| 6 | Recognition Rather Than Recall | 2 | Keyboard shortcuts documented nowhere; words-per-flash cycles invisibly |
| 7 | Flexibility and Efficiency | 3 | Rich keymap, but 25-wpm steps only (28 presses 300→1000), no keyboard seek |
| 8 | Aesthetic and Minimalist Design | 3 | Playing state exemplary; paused says "start" three ways; code panel ~450px for 3 lines |
| 9 | Error Recovery | n/a | Reader has no error states; input errors live on Home |
| 10 | Help and Documentation | 1 | Only help is "Tap anywhere to …" |
| **Total** | | **23/36** | **Acceptable (64%)** |

## Design Specificity Verdict

LLM: Authored at the centre, generic at the edges. The 40% focal column with guide ticks, amber pivot, warm themes, amber-underlined context sentence, auto-rewind, digit-group flashes and code stops are Didread's own; the playing state is near-ideal. The paused chrome (« ▶ », − pill +, scrubber) is a podcast player. Missed: the context sentence is centred rather than aligned to the pivot column; progress ignores sentence/paragraph structure; the title never appears; the code panel is a generic box.

Deterministic scan: CLI (Reader, WordDisplay, AppearanceSettings) exit 0 with 1 advisory: design-system-font-size, Reader.svelte:565, `.step` font-size 1.35rem off the DESIGN.md ramp (valid). Browser overlay (4 states): light theme flags `cream-palette` on body rgb(246,243,238) — false positive against DESIGN.md's confirmed warm-paper Neutral rule; dark theme clean. No contrast-scan failures reported. Overlay ran headless; not user-visible.

## Overall Impression

The moment of reading is excellent and on-brief; everything around it is a competent but borrowed media-player UI with real lapses: the Aa panel survives into playback, focus styling ignores the system, and the code stop breaks flow without explanation. Biggest opportunity: make the paused state as specific to reading as the playing state is.

## What's Working

1. Playing state embodies "stay out of the way": top bar, controls and progress fade in 300ms with pointer-events off (Reader.svelte:464-475), both themes.
2. Paused context sentence (faint sentence, current chunk in ink with amber underline) plus auto-rewind turns pausing into a comprehension aid; works for 3-word chunks.
3. Fit-to-column scaling keeps the pivot fixed at XL (WordDisplay.svelte:17-30); keyboard bubble is role=status and respects reduced motion.

## Priority Issues

- [P1] Aa panel stays visible and interactive during playback and can't be dismissed. `.appearance` (Reader.svelte:234) isn't in the fade list; the toggle is in the faded top bar; Esc exits the reader (:191). Breaks Principle 4 at the focal point. Fix: close the panel when playback starts (or fade it), make Esc close the panel first. Command: /impeccable harden
- [P1] Focus styling off-system: no :focus-visible except AppearanceSettings:107; browser black ring is near-invisible on the amber play button and boxes the whole stage after a click+key. Fix: global `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`, inset/suppress on `.stage`. Command: /impeccable harden
- [P2] Code-block stop unexplained, oversized, duplicated: `pre { flex: 1 1 0 }` (:434) stretches 3 lines to ~450px, long lines clip on phone with no scroll hint, "Continue reading" duplicates the play button, header says only "TS / 3 LINES". Fix: size to content with max-height, header "Paused for code · TypeScript · 3 lines", one primary Continue, demote transport, soft-wrap on phones. Command: /impeccable layout
- [P2] Tap targets under DESIGN.md's own 2.75rem: words-per-flash 104×35, Aa segments 34px tall (S/L ~33–36px wide), seek strip 24px flush to the bottom edge. Fix: min-height 2.75rem; 2.75rem seek hit area clear of the home indicator. Command: /impeccable adapt
- [P2] Controls and shortcuts undiscoverable: hint always "Tap anywhere…" (:261) even on desktop and after seeking; no shortcut legend; WPM readout and chunk button look identical (:290 vs :293). Fix: pointer-aware hint (fine pointer: "Space to start · ← → sentence · ↑ ↓ speed"), start/resume by position, 1/2/3 segmented control or non-button styling for the readout. Command: /impeccable clarify

## Persona Red Flags

Casey (mobile): 24px seek strip on the home-gesture edge; 35px "1 word" and 34px Aa segments; code clipped sideways. Good: tap-anywhere play/pause, pauses and saves on visibilitychange.
Sam (keyboard/screen reader): UA focus ring, invisible on amber play; two adjacent tab stops both named Play/Pause (stage :250, .play :275); "Paused" isn't a live region; code panel neither takes focus nor announces; guide ticks and unfilled progress at 1.36:1 (light) / 1.62:1 (dark), under 3:1 non-text; stage aria-label hides the current word.
Alex (power user): no shortcut legend; WPM only in 25s; Esc with Aa open exits; no keyboard seek or paragraph jump; bubble sits 6rem from the bottom, ~380px below the word on desktop.

## Minor Observations

- Top-bar centre empty before first play; title never shown in the reader.
- Dark bubble container nearly invisible (surface on paper 1.09:1).
- Disabled "+" at 1000 wpm fades with no reason given.
- `.step` uses 1.35rem, off the type ramp (detector).
- Segment text on amber uses --surface instead of --on-accent (AppearanceSettings.svelte:101); contrast passes.
- `.context` keeps min-height while invisible, so the word sits at ~34% height on phones; side effect, not decision.

## Questions to Consider

- Should the paused reader be a media player at all, or show the paragraph aligned to the focal column with the transport as a quiet secondary row?
- Would a faint 1px amber progress hairline during playback break focus, or deliver the "I'm getting through this" promise?
- If code is "read as code", why a dead stop on a separate screen rather than a card dismissed with the same tap as everything else?
