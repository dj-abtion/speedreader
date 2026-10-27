---
target: the home and finish screens
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/user/speedreader/src/lib/Home.svelte"
target_fingerprint: "sha256:e8d969502c82ef0433e743e195304b86baccaddfdb9512050b27f93ec60ebecc"
target_path: /home/user/speedreader/src/lib/Home.svelte
timestamp: 2026-10-27T08-41-21Z
slug: src-lib-home-svelte
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Focus dropped to body on finish; Paste text gave no focus cue |
| 2 | Match System / Real World | 3 | "wpm" unexplained on finish |
| 3 | User Control and Freedom | 2 | confirm() delete, no undo; re-opening a finished text erases its stamp |
| 4 | Consistency and Standards | 2 | URL rejected from clipboard but accepted from the paste box; amber footer link |
| 5 | Error Prevention | 2 | URL saved as a 4-word text |
| 6 | Recognition Rather Than Recall | 3 | Welcome help disappears after the first text |
| 7 | Flexibility and Efficiency | 3 | No home shortcut of its own |
| 8 | Aesthetic and Minimalist Design | 3 | Footer noise; heavy logo slab; dead band on desktop finish |
| 9 | Error Recovery | 2 | Pasted URL gave no error; slow-path finish sentence stated a false average |
| 10 | Help and Documentation | 2 | No help after the first visit |
| **Total** | | **25/40** | **Acceptable (62.5%)** |

## Design Specificity Verdict
Specific: welcome focal-frame demo, tick-and-check logo, finish check echoing the guide ticks, Did read stamp. Generic: input row and library cards.
Deterministic scan: CLI clean; URL scan and overlays only `cream-palette` (false positive).

## Priority Issues
- [P1] Slow-path finish printed reading time as the average (Finish.svelte). Fixed: average computed directly.
- [P1] Finish focus lost when a next text arrived after mount. Fixed: focus follows the primary.
- [P1] Finish actions below the fold on iPhone 13. Fixed: compact layout under 760px tall.
- [P2] Bare URL pasted into the box saved as a text. Fixed: same error as the clipboard route.
- [P2] First visit led with Read clipboard though nothing may be copied. Fixed: Try a sample is the amber action on an empty library.

## Minor Observations
Library ordered finished-above-in-progress (fixed: unfinished first); Paste text didn't focus the field (fixed); amber footer link (now ink); Aa panel overflow and squashed icon at 200% (fixed). Open: stamp erased by re-open, confirm() delete without undo, help after first visit.
