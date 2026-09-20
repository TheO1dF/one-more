# One More? repository guidance

## Scope and completion

- Shared game rules, UI and assets live on `web-polish`; Windows packaging lives on `pc-steam`. Read desktop/README.md for desktop work and release notes for the current release, rather than loading every design document before each edit.
- Production `main` receives the standard `dist/` build only. Growth experiments remain in source or explicit `dist-playtest/` builds; do not copy source `game/` directly into production or re-enable experiments without an explicit request.
- Finish the requested change, run relevant checks, fix regressions caused by the change, and deliver the result with actual verification and remaining blockers. Steam account review or a missing AppID does not block local development, packaging or store drafts; drafts are not published pages.

## Proportionate verification

- Rules changes: run the affected rule tests. Layout or interaction changes: inspect the affected flows and viewports. Documentation-only changes do not require gameplay tests.
- A new release build needs `npm run check` and desktop/mobile smoke coverage. Reuse evidence from the same game code; repeat checks only for new changes, failures or unresolved concerns.
- Prefer Edge. If unavailable, use a supported Chromium verification channel and record the actual browser and coverage. A security refusal stops that operation; report the gap without bypassing the refusal.
- Local tests use isolated fixtures without production access. Run them and fix change-related failures without asking at each step. Preserve real player saves.
- Save relevant screenshots and reports under a versioned `.artifacts/` directory. Do not claim a failed or unavailable check passed.

## Asset and skill boundaries

- Preserve the approved solid-color casino poster style and original assets. Do not add universal black outlines or decorative gradients.
- Use photo-abstract-editorial only for a requested photograph-plus-abstract composition. Native SVG game assets do not require that skill; web/Electron work does not require Godot skills.
- Short tutorial dialogue needs only directly relevant writing guidance. Chapter-state workflows apply only to projects that actually track chapters.
