---
target: the reader
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/home/user/speedreader/src/lib/Reader.svelte"
target_fingerprint: "sha256:fbb6e74ecb52a492c5647d3ff5e62154eb6117efa60961f3cb54ea7b24be064a"
target_path: /home/user/speedreader/src/lib/Reader.svelte
timestamp: 2026-10-27T08-41-21Z
slug: src-lib-reader-svelte
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Swipe under the open sheet changed speed unseen; seeking to the end showed 99% |
| 2 | Match System / Real World | 3 | Plain copy; "wpm" the only jargon |
| 3 | User Control and Freedom | 3 | Tapping beside the sheet started playback |
| 4 | Consistency and Standards | 2 | Space re-fired the last mouse-clicked control; code-stop settings unstyled; theme-color cold |
| 5 | Error Prevention | 2 | Silent changes via click-then-Space and swipe-under-sheet |
| 6 | Recognition Rather Than Recall | 3 | Step-limit reason only in title (invisible on touch) |
| 7 | Flexibility and Efficiency | 3 | Focused slider swallowed Space/↑ |
| 8 | Aesthetic and Minimalist Design | 3 | Pivot axis 125px off the controls on desktop |
| 9 | Error Recovery | 3 | Code stop explains itself and offers a way back |
| 10 | Help and Documentation | 3 | Contextual hint by input type |
| **Total** | | **28/40** | **Good (70%)** |

## Design Specificity Verdict
Specific: fixed 40% pivot column, amber pivot, faint context sentence, code stop, input-aware hints. Generic: the « ▶ » transport row and the segmented settings sheet.
Deterministic scan: CLI clean; URL scan and overlay only `cream-palette` on body (documented Paper token, false positive); dark clean.

## Priority Issues
- [P1] Space after any mouse click re-pressed the focused control (Reader.svelte keydown). Fixed: track input modality, blur mouse-focused controls.
- [P2] Settings sheet: tap beside it started reading; swipe under it changed speed unseen. Fixed.
- [P2] Pivot column 125px off the controls' axis on desktop. Fixed: 40rem reading column.
- [P2] Bubble floated ~70px under the word on phones. Fixed: anchored to the word frame.
- [P2] touch-action none blocked pinch-zoom; context sentence ignored text size. Fixed: pinch-zoom allowed, context scales.

## Minor Observations
Runtime theme-color #f7f7f5/#121212 (fixed to Paper); code-stop settings strip unstyled (now the sheet); end showed 99% (fixed); Back a sentence dropped focus (now moves to play); ↑/↓ changed speed at the code stop (now ignored).
