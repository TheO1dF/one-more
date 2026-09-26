# 0.17.2

- Give tool actions a readable preparation, contact and result: brief peeks last 560–650 ms; processing, copying, recovery and packing last 720–1100 ms. Ordinary pairing and gameplay input keep their existing timings.
- Reveal transformed and generated artwork without leaving a blank gap while the rest of the cosmetic effect finishes.
- Render collateral descriptions in a viewport-clamped fixed tooltip outside the scrolling rack. Hover no longer lifts the badge or creates an extra scrollbar; keyboard focus still reveals the description.
- Reuse the original Pan's Gift SVG for the once-per-run protection badge, with the existing remaining-use marker.
- A local replay page under `.artifacts/card-performances-v0172/` uses the production animations at their normal speed and does not read or write player saves.

Validation: npm run check passed (371 tests). Nine representative tool flows passed on desktop and mobile. Rack hover/focus, viewport bounds, original icon reuse and normal-speed replay passed at 1440×900, 2560×1600 and 390×844 in isolated Edge contexts. Player saves were not changed by the replay page.
