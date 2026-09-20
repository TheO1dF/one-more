# One More? v0.9.0

## Design

The bank remains useful for events and card costs, but an early windfall no longer buys every later table. When dice are accepted:

`next target = max(previous target + dice sum, bank + next table stake)`

The stake is 8 through table four and 12 from table five. The score panel displays `target - bank` as THIS TABLE NEEDS, so the player compares two local values rather than doing cumulative arithmetic. Costs raise the remaining requirement. Existing saves keep the current table unchanged; the next accepted roll uses this rule. Natural-20 food rewards still count as table score. Bombs remain immediately fatal.

Three variants were compared across 2,160 deterministic episodes: 540 full heuristic runs plus 1,620 large-deck planner trials. Each large-deck configuration used 60 seeds, 49/99/199 permanent nonbomb cards, current bomb growth, and pairing/collection/kitchen archetypes. The windfall scenario starts with bank 200 versus old target 150. The depth-three, width-three planner sees only available information and searches pair/tool interactions.

- Legacy: 22/180 full-run clears. 199/805 reached later tables needed at most two fresh points. Windfall large decks passed 540/540 trials with about one reveal per table.
- Selected stake floor: 14/180 full-run clears. Zero reached later tables needed at most two fresh points before rewards. Large-deck configurations passed 44–53/60, with mean 5.07–6.67 reveals.
- Full rebase to bank + dice: 6/180 full-run clears; also leaves occasional one/two-point dice tables. Rejected for this revision.

These are policy comparisons, not estimated human win rates or a proof of optimal play. Full-run policy is a heuristic. The windfall scenario intentionally targets the reported exploit. Detailed data: `.artifacts/pacing-v090/report.json`. Reproduce with `node scripts/pacing-balance.mjs 60`.

## Presentation and content

- Symmetric desktop rails place the table at the viewport center. Left: target, green table score, shortfall and bank. Right: selected card and choices. Mobile retains its accepted continuous horizontal card row.
- New dealer: generated camera-style source → photo-abstract-editorial study → extracted transparent character sprite. Existing card SVGs remain. Source/reference assets and exact prompts are in `art-source/`; runtime portrait in `game/assets/dealer-sprite.png`. Generated source is not represented as an actual camera photograph.
- Sound is separated into `game/sound.js`: pairing chord, tool/peek feedback, card brush, dice, cash-out and filtered bomb impact. `game/feedback.js` animates pairs, used tools, consumed cards moving to discard, generated cards and score changes. Bomb effect uses smoke, fragments and a radial impact instead of the old comic burst label. Existing sound/motion preferences still apply.
- Tutorial v3 teaches an actual shaker use after revealing a known bomb in the preview. It explicitly distinguishes peek from draw, and shuffle from first-card safety. Interface and tutorial headings remove unnecessary narrative filler; home/result slogans were removed.
- Collection now includes four relics and six persistent local achievements. Tutorial/test play does not unlock achievements. These are local achievements, not a claimed Steam integration.

## Verification

- 137 rule/layout/locale/tutorial/progression tests passed; static web build succeeded.
- Supported Codex in-app browser: 136 desktop (1280×800, Chinese) and 144 mobile (390×844, English) checks passed. Includes 80-card collection, large layouts, 150-card continuous mobile row, score/cost/consume/generate interactions, dice, branch selection and card package progression.
- Actual ten-table UI run: seed 38, 148 rule actions, final 219/218, nine routes, successful first relic selection and progression. Tutorial was separately played through death, retry, peek, shaker, cash-out and table two. No page errors observed during that manual sequence.
- Screenshots/reports: `.artifacts/smoke-one-more-v090/desktop-mobile.json`, `full-run.json` and PNGs. Headless Edge launch was denied by automatic approval; browser evidence is from the supported in-app browser, not Edge. A failed initial adapter attempt did not count as a test pass.
- Browser viewport emulation does not establish real-device iOS/Android behavior. Sound cues were invoked without script errors; subjective loudness/mix should be evaluated in play.

## Art reference

LocalThunk describes deliberate palette, resolution, card-set and UI constraints for visual cohesion in this [direct interview](https://playday.one/2024/03/09/there-is-a-lot-more-design-to-explore-within-balatro/). This revision applies restrained colors and consistent feedback to One More?'s existing look. [Balatro's official press kit](https://www.playbalatro.com/press-kit) is a presentation reference, not an asset source for this game.

## Branches

`web-polish`: shared browser game, rules, assets, presentation and tests.

`pc-steam`: separate desktop distribution branch, initialized from this revision. Keep shared gameplay fixes synchronized; place OS integration and packaging under `desktop/`. No Godot dependency. No EXE has been produced by this revision. A Steam Playtest release still requires platform integration and release checks.
