# One More? PC / Steam distribution

This checkout is on `pc-steam`. Shared rules, web UI and assets start from web revision `745ec21` (v0.9.0). The independent working directory is `C:/Users/93530/Desktop/OneMore-PC`; web development remains in `C:/Users/93530/Desktop/OneMore` on `web-polish`.

The browser game is the implementation to package. Do not resume the Godot migration or maintain a second rules engine. Bring shared fixes across with ordinary Git merges/cherry-picks; keep OS-specific code under this directory. No Windows executable or Steam-ready build has been generated yet.

Packaging follows the gameplay, art, effects and tutorial pass documented in `../WEB-POLISH-v090.md`. The next desktop implementation should provide:

- An offline app window loading the local web build and all audio/art assets.
- Fullscreen/windowed controls, sensible minimum dimensions and a visible quit command.
- Persistent user saves and settings separated from installed files; no test fixtures or development saves in the distribution.
- A narrow platform interface for future Steam achievements, leaving the six local achievements functional offline.
- Repeatable Windows build commands and a manifest including game/runtime versions.

Before creating a public build, check actual packaged launch, save/restart, resolution/fullscreen, audio, ten-table progression, both languages and graceful exit. Browser verification is already recorded for the shared v0.9.0 base; repeat relevant checks when desktop integration changes behavior.

Release intent is a free Steam Playtest. Steam account/app setup, SDK integration and publication are separate from merely producing an EXE; none is claimed complete here.
