# One More?

A push-your-luck deckbuilder: build pairs, use tools, and cash out before a bomb ends your run.

[Play on Cloudflare](https://one-more-6ed.pages.dev/) · [Play on GitHub Pages](https://theo1df.github.io/one-more/)

## v0.17.2

Contextual, hands-on onboarding and four difficulty levels; Pan's once-per-run rescue at the first two levels; two-click food pairing and one-click untargeted tools. Newly drafted cards get priority among the next table's first six eligible non-bomb slots. Larger screens scale the cards and HUD together.

Tool performances now leave time to read the action and its result. Collateral descriptions stay inside the viewport without moving the rack or creating scrollbars. Pan's protection reuses the original goblet artwork.

[Latest release notes](https://github.com/TheO1dF/one-more/blob/web-polish/RELEASE-v0172.md)

## Repository branches

- `main`: ready-to-host static website. GitHub Pages and Cloudflare deploy from this branch.
- `web-polish`: web source, tests and build scripts. `npm run check` builds `dist/`.
- `pc-steam`: shared game plus Electron Windows packaging.

`BUILD.json` identifies the source commit and SHA-256 hashes of the game files. Saves are local to each site origin. The itch.io upload and Windows build are separate artifacts.
