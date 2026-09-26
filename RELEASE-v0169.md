# One More? v0.16.9 — concise settlements

- Removed win/loss epilogues, repeated dealer dialogue and general retry tips from results in both languages. Scores, rewards, endless rules and controls remain.
- Removed repeated story paragraphs from event settlement recaps. Character artwork remains centered; actual event receipts and card effects remain visible.
- Loop-return animation remains, without a narrative caption. The tutorial retry step retains a brief instruction and rescue reminder.
- New-card draw priority is a design proposal only. This update makes no changes to deck order, bombs, rewards or scoring.

Validation:
- npm run check: 353 tests passed; static build succeeded. Removed the obsolete result-epilogue test alongside that deleted renderer.
- Edge: desktop 1440×900 and mobile 390×844, Chinese and English; bomb loss, short-score loss, win and event draft (16 cases).
- Verified retry, reward selection, next table and endless entry; no browser errors or horizontal overflow.
- Evidence: .artifacts/settlement-v0169/.
- Local update; not pushed or deployed.
