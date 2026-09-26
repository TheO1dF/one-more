# One More? v0.17.0 — new package opening priority

- Cards from a selected normal round-end package, including its trouble, receive priority in the next opening deal only. Six early movable non-bomb positions are sampled randomly; neither package order nor a safe sequence is guaranteed.
- The ordinary shuffle places bombs first. Priority does not move any bomb or any closed staple constituent. Bound packets can push the available positions later.
- Cards still require normal draws, costs and pairing. No cards are placed on the table or activated for free. Event copies, temporary cards and growth-lab services do not receive package priority.
- Shaker and rescue shuffles stay ordinary shuffles. Opening priority is not reapplied. Old saves retain their draw order; pending new packages survive save/reload.
- First actual reveal of each new card briefly highlights it; the cue does not block One More. The draft footer states that new cards arrive early next table.

Validation:
- npm run check: 362 tests passed; static build succeeded.
- Targeted tests cover bombs, multi-bomb decks, trouble, all package card types, packet integrity, first-card safety, save/reload, ordinary reshuffles, expiry, one-time feedback and invalid metadata.
- Edge desktop 1440x900 Chinese and mobile 390x844 English: actual package selection, save/reload, next opening, two new draws, new tool consuming new food, and shaker. No browser errors or horizontal overflow.
- Opening availability comparison: 5,000 seeds each at 23/43/83 cards, normal versus 6-slot and 8-slot preference. Exact bomb positions are unchanged. This comparison stops at the first bomb and models no peeking, tools, rescue or player strategy; it is not a win-rate or overall balance simulation.
- Evidence: .artifacts/fresh-pack-v0170/.
- Local build only; not pushed or deployed.

The broader object-based visual direction is documented separately and is not implemented by this release.
