# One More? v0.16.6 — Pan, the loop, and table targeting

- Tutorial v7: inspect and pair two foods, inspect a peek, draw the flashlight, then the dealer lures the player into a bomb. Pan interrupts with the existing hand-and-wine-glass performance; the flashlight and shaking cup are taught afterward. No extra starting flashlight is added.
- One run rescue uses the same bomb-return rule and animation as Pan's event gift. It keeps cards/points, returns the bomb to the shuffled deck, and stays spent across saves and tables. The event-only gift remains a separate consumable. Difficulty 2 and 3 do not gain the free rescue.
- Tutorial speech follows the current action, with short dealer/Pan lines and an animated target outline. After a real death, the retry button remains highlighted and the next run keeps contextual guidance.
- Death and a completed ten-table run now share a short clock/deck rewind transition and time-loop ending text. Win records and optional endless play remain intact.
- Pair partners, tool food costs, and table effect targets are selected directly on the table. Valid targets glow, irrelevant cards dim, and mouse/focus targeting draws a curved line from the source. Discard/deck/discovery choices keep their list because those cards are not on the table.
- Protection is one glass icon in the existing pledged-item rack. Difficulty is one compact main-menu entry. The redundant target-choice strip and its mobile blank panel are removed.
- v0.16.5 high-resolution scaling and tiered difficulty changes are retained. Existing regular saves are preserved; replay tutorial uses separate in-memory state.

Validation:
- `npm run check`: 344 tests passed; static build succeeded.
- Isolated headless Microsoft Edge: full tutorial to table two in Chinese at 1440×900 and English at 390×844, including Pan intervention at normal speed, peeking, shaking, reward selection, save/reload.
- Desktop and touch UI: direct tool-cost selection, reclaiming from discard, direct pairing/effect target, real second-bomb death, rewind, guided retry, difficulty menu.
- 2560×1440 / 3840×2160 table interaction and readable scaling; mobile victory page with loop text and endless option.
- Evidence: `.artifacts/onboarding-v0166/`. Local changes only; not pushed or deployed.
