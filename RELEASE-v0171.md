# 0.17.1 — One-click tools and brief card performances

- A usable tool with no card/cost selection executes on the source click. Flashlight, probe, mass cleanup, cut card and mass readiness no longer ask for a second USE click. Waived Scope food costs also take the direct route. Sieve and discovery tools still offer their meaningful follow-up choices. Targeted and food-cost tools retain their selection/cancel flow.
- The tutorial points directly to the flashlight and advances after one click in Chinese and English.
- Ordinary pairing remains exactly two clicks. Its two cards slide into their stack in 210 ms, accompanied by a short sound. Removed the bounce, hearts and particle stream.
- When a tool targets a pair or a food kind, either visible member selects the same canonical rules target. A stacked pair no longer forces players to reach its bottom card.
- 41 tool definitions, including the existing separate growth lab, have short physical-action cues: scan, sift, wipe, wash, stir, cook, steam, crush, cut, press, copy, serve, ring, wind, repair, reclaim, store and tie. Most last 280–560 ms; the longest tool cue is 600 ms. Packing cord now ties locally; next-table automatic unwrapping is unchanged.
- Transformations reveal the resulting artwork in place. Created food, fetched food and reclaimed objects move from their actual source. Several tools ready together, not in a blocking queue. Generated residue only appears when the rules generated it; a waived cost does not show a food being consumed.
- Separate pure outcome planning from DOM/canvas presentation. No new game rules, randomness, save fields or asset replacements. Effects have no pointer hit area, follow reduced-motion settings and cancel cleanly when replaced or leaving the table. Existing tool/effect consumption marks remain distinct.

Validation: `npm run check` passed 371 tests and built `dist`. Browser evidence and tutorial reports live under `.artifacts/card-performances-v0171/`; fixtures use isolated Edge contexts, never the player's browser save.

Local build only; no commit, merge or push in this update.
