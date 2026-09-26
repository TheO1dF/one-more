# One More? v0.16.8 — two-click food pairing

- Clicking one eligible food and then its partner pairs them immediately. There is no PAIR confirmation button.
- Abilities that need a target request it after the pair is already on the table. Existing ability/listener order is preserved, including enchantments and multiple targets. The pending effect survives save/reload and can be declined without undoing or repeating the pair.
- Tutorial text now describes two-click pairing. Important phrases such as first card, once per run and next target receive inline bold emphasis in Chinese and English; speaker styling does not split them onto separate lines.
- The three v0.16.7 gameplay proposals were declined and remain unimplemented.

Validation:
- npm run check: 354 tests passed; static build succeeded.
- Rule regressions cover immediate pairing, target selection, save/reload, rejected targets, off-table reclaim, enchanted multiple targets, listener order, blocked effects, and localized inline emphasis.
- Browser evidence: .artifacts/onboarding-v0168/.
- Local changes only; no GitHub push or deployment.
