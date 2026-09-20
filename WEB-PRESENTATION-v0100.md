# One More? 0.10.0 — table and card presentation

The desktop play screen is now a single wide, curved blackjack table. Scores sit above the table; card inspection and choices sit below it. The dealer is absent from active play and the lesson strip, but remains in narrative/menu scenes. Ivory cards, green felt, dark leather, brass edges and restrained scoring colors are shared across the controls.

## Rendering boundaries

- `card-view.js`: card markup, material registry and keyed `CardInstance` / `CardScene`. Cards retain DOM identity across HUD renders. Game state remains owned by the rules engine. This is a presentation refactor, not a replacement rules engine.
- `table-art.js` and `table.css`: curved vector table surface and responsive scene layout. Phones retain their continuous horizontal card row.
- `materials.css`: complete Raw, Fried and Boiled surfaces, with moving wet highlights, oil speckling/bubbles and soft steam respectively. These are layered CSS materials, not WebGL shaders. The same surfaces survive the existing 3D flip and exhausted-card rotation. Pointer position affects the specular highlight. Reduced motion freezes material loops; hidden card pages pause them.
- `tool-effects.js`: explicit visual profiles for all 24 tools and one transient Canvas particle layer. Geometry follows tool function: beam, radar, lens, sieve, wipe, water, wind, fermentation, fire, steam, cutting, copying, bell, magnet, stamping and more. Visual randomness does not use gameplay RNG. No idle Canvas animation runs after an effect completes; cancellation resolves pending effects, including when the document becomes hidden. Errors release the animation wait.
- `feedback.js` / `sound.js`: tool cue orchestration, synthetic sound families, pair particles flying to score, consumed cards travelling to discard and generated-card arrivals. Bombs add an amber impact flash, two expanding shock rings, debris and sparks. Motion settings remain supported.

No Three.js dependency was introduced. The existing SVG art and hit targets stay sharp and accessible; Canvas handles transient particles, while DOM compositing handles card materials and flips. A future genuinely three-dimensional camera/lighting requirement can justify a renderer behind these component boundaries.

## Verification

- `npm run check`: 140 tests pass, static build succeeds.
- Codex in-app browser: desktop 1280×800 (136 checks), phone 390×844 (144), compact desktop 960×600 (136 after the overflow correction), and 1920×1080 English. Screenshots/reports under `.artifacts/smoke-one-more-v0100/`.
- The initial combined responsive report retains a failed 150-card compact-height check. `compact-report.json` supersedes that failure after limiting row count by available height before pagination.
- `presentation-smoke.mjs`: 11 checks, including retained card identity, three distinct materials, material visibility during a flip, tool peeking/exhaustion, cleanup, all 24 tool profiles and reduced motion.
- `full-run-smoke.mjs`: 148 actual UI actions through all ten tables, seed 38, final 219 / 218. This is a deterministic progression check, not a balance estimate.
- Bomb checked through the real Draw button with an isolated fixture: instant fatal rules result, animated burst, normal loss screen, zero remaining effect nodes and interaction unlocked.
- Test fixtures are not added to the shipped build. The user's prior local game/preferences are restored after browser verification.

Reference: https://gizmo199.itch.io/super-coupon-club lists GameMaker and HTML5. Its engine choice is not a requirement for this implementation. Old CardEater's source uses weighted score bursts and short impact effects; this pass adopts the principle of feedback tied to the action without importing its rules or assets.

## Instruction audit note

The local AGENTS.md currently mandates a specific Edge smoke run and `npm run check` for every edit. Minimal suggested wording: “For runtime or layout changes, run affected checks and a desktop/mobile browser smoke test. Prefer Edge; use the supported in-app browser when Edge automation is unavailable. Rerun only affected checks after a fix.” This avoids repeating broad tests for text-only edits and avoids waiting on one unavailable browser backend. No instruction or skill files were changed in this pass.
