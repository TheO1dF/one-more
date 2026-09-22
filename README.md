# One More?

A push-your-luck deckbuilder: build pairs, use tools, and cash out before a bomb ends your run.

[Play on Cloudflare](https://one-more-6ed.pages.dev/) · [Play on GitHub Pages](https://theo1df.github.io/one-more/)

## v0.15.1

Skip-table rewards now use a flat-colour slot machine: a dealer lowers it by its handle, it lands with cracks, and the player pulls the lever. Symbol reels slow to a stop before the prize is confirmed. The machine is centred on desktop and mobile. Results are saved before the spin and cannot be rerolled by refreshing.

Eight reward types include two-card enchantment, permanent copying, stapling, removal and rare one-table jackpots. Five enchantment types improve each eligible card according to its effect. Existing saves, card artwork and growth cards are retained; the growth test-mode entry remains hidden. 261 automated checks pass.

[Release notes](https://github.com/TheO1dF/one-more/blob/web-polish/RELEASE-v0151.md) · [Reward and enchantment details](https://github.com/TheO1dF/one-more/blob/web-polish/RELEASE-v0150.md)

## Repository branches

- `main`: ready-to-host static website. Keep GitHub Pages and Cloudflare connected to this branch.
- `web-polish`: web source, tests and build scripts. `npm run check` builds `dist/`.
- `pc-steam`: shared game plus Electron Windows packaging. EXE builds are separate artifacts.

## Hosting

The one-more Cloudflare Pages project deploys from `main`. Framework: None; root: `/`; build command: blank; output: `.`. GitHub Pages serves the root of `main`.

`BUILD.json` identifies the source commit and SHA-256 hashes of the game files. `_headers` asks browsers to revalidate files on a new visit. Saves are local to each site origin.

This push does not update the separately uploaded itch.io or Windows build. Original artwork remains available in the source branches. Soundtrack: **The Empty Glass**.
