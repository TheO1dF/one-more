# One More? PC / Steam distribution

This checkout is on `pc-steam`. Shared rules, web UI and assets are v0.12.0, merged from `web-polish`. The independent working directory is `C:/Users/93530/Desktop/OneMore-PC`; web development remains in `C:/Users/93530/Desktop/OneMore` on `web-polish`.

The browser game is packaged by Electron 44.3.0. Do not resume the Godot migration or maintain a second rules engine. Bring shared fixes across with ordinary Git merges/cherry-picks; keep OS-specific code under this directory. `npm run package:win` produces the portable Windows x64 folder under `releases/v0.12.0`. Keep all runtime files beside OneMore.exe.

Packaging follows the gameplay, art, effects and tutorial pass documented in `../WEB-POLISH-v090.md`. The current desktop build provides:

- An offline app window loading the local web build and all audio/art assets.
- Fullscreen/windowed controls, sensible minimum dimensions and a visible quit command.
- Persistent user saves and settings separated from installed files; no test fixtures or development saves in the distribution.
- A narrow platform interface; nine local milestones work offline. Steam achievements and Cloud are not integrated.
- Repeatable Windows build commands and a manifest including game/runtime versions.

Before creating a public build, check actual packaged launch, save/restart, resolution/fullscreen, audio, ten-table progression, both languages and graceful exit. Browser verification is already recorded for the shared v0.9.0 base; repeat relevant checks when desktop integration changes behavior.

Release intent is a free Steam Playtest. The user reports Steamworks tax verification is in progress (2026-09-20); no game AppID has been provided yet. Store materials are in `releases/steam-kit-v0.12.0`. The HTML preview is not an uploaded Steam page. Completion of account review, app setup, Steam client install testing and publication remain pending.

## v0.12.0 verification

159 rule tests pass. The packaged executable completed 150 actual UI actions across all ten tables, matching the engine reference (seed 15, 207 / 202 points), all nine route transitions, unlock book and next difficulty. Native fullscreen, English/Chinese, offline music decoding, resolution presets, save reload and process restart passed. Reports and screenshots: `.artifacts/pc-v0120/packaged-report.json`.

30/60/120 are animation update targets: canvas effects/dice and scripted card animation use the same clock; material CSS animations are quantized. This is not a promise that the Chromium compositor or physical monitor refreshes at the selected rate. Larger window presets are scaled to fit the current display's work area. Test data lives under the explicit smoke-report directory, never the normal player profile.

Build is unsigned. Native Steam install, controller input, low-end hardware and Steam Deck have not been certified. The browser CDP smoke channel had a policy-verification service failure in this session; do not label that browser run passed or bypass its security controls.
