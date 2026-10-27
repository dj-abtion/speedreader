---
target: the home and finish screens
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/home/user/speedreader/src/lib/Home.svelte"
target_fingerprint: "sha256:0e0509561653cf80981f8a2188ad6fb5b9ba8ead2385f26d6c462410888d96ca"
target_path: /home/user/speedreader/src/lib/Home.svelte
timestamp: 2026-10-27T09-25-48Z
slug: src-lib-home-svelte
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Focus dropped after Undo, its timeout, and leaving finish |
| 2 | Match System / Real World | 3 | Plain voice |
| 3 | User Control and Freedom | 3 | Undo can't be extended; Esc didn't close home Aa |
| 4 | Consistency and Standards | 2 | Esc inconsistency; next card looks clickable; amber split in paste state |
| 5 | Error Prevention | 3 | URL caught, duplicates reused |
| 6 | Recognition Rather Than Recall | 3 | Labelled actions |
| 7 | Flexibility and Efficiency | 2 | No home shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Early install banner; not-started vs in-progress look alike |
| 9 | Error Recovery | 3 | Helpful messages, amber without icon |
| 10 | Help and Documentation | 3 | Sample teaches; How it works reopens it |
| **Total** | | **28/40** | **Good (70%)** |

## Design Specificity Verdict
Authored: welcome focal frame, logo ticks, Did read stamp, finish check. Generic: library cards, next box, Aa segments.
Deterministic scan: CLI clean; only `cream-palette` false positive.

## Priority Issues
- [P1] Library collapsed at 200% text; wordmark overflowed. Fixed.
- [P2] Focus lost after Undo, Undo timeout, and finish → library. Fixed.
- [P2] Paste form kept Read clipboard amber. Fixed.
- [P2] Install banner before any value. Fixed: after a first finish, below the library.
- [P3] Esc didn't close home Aa. Fixed. How it works re-added a deleted sample. Fixed (read without saving).
