---
target: the reader
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/home/user/speedreader/src/lib/Reader.svelte"
target_fingerprint: "sha256:639f4c167cee3f5f45cf81065297569e32ddfd8706bcc44f14d4443f81842737"
target_path: /home/user/speedreader/src/lib/Reader.svelte
timestamp: 2026-10-27T09-25-48Z
slug: src-lib-reader-svelte
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Speed change under the open sheet never shown |
| 2 | Match System / Real World | 3 | "words per flash" explained only in a desktop tooltip |
| 3 | User Control and Freedom | 3 | A seek-triggered finish can't be undone |
| 4 | Consistency and Standards | 3 | Swipe blocked under the sheet but ↑/↓ not |
| 5 | Error Prevention | 2 | Seek to end + play recorded a false Did read |
| 6 | Recognition Rather Than Recall | 3 | Words pill cycling not signalled |
| 7 | Flexibility and Efficiency | 4 | Full keys, swipe, 1–3 words |
| 8 | Aesthetic and Minimalist Design | 3 | Three amber segments in the sheet; code header wrapping at 320 |
| 9 | Error Recovery | 3 | Lost-thread recovery strong; mistaken finish not recoverable |
| 10 | Help and Documentation | 3 | Inline hint teaches in place |
| **Total** | | **30/40** | **Good (75%)** |

## Design Specificity Verdict
Authored: 40% focal column, amber pivot, bubble on the pivot column, underlined context, code stop. Generic: transport row; settings segments.
Deterministic scan: CLI clean; only `cream-palette` (documented Paper token) in light URL scans/overlays.

## Priority Issues
- [P1] Seek to end + play recorded "Did read" with a made-up saving. Fixed: implausibly fast reads aren't counted.
- [P2] ↑/↓ and 1–3 changed hidden settings under the sheet. Fixed.
- [P2] Space dead on a keyboard-focused slider. Fixed.
- [P3] Three amber segments in the sheet. Fixed: selected segments are Ink.
- [P3] Code header wrapped 2×2 at 320px. Fixed.
