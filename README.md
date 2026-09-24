# One More?

A push-your-luck deckbuilder: build pairs, use tools, and cash out before a bomb ends your run.

[Play on Cloudflare](https://one-more-6ed.pages.dev/) · [Play on GitHub Pages](https://theo1df.github.io/one-more/)

## v0.16.4

Adds table-end reward packs, press and seal mechanics, a growing base target plus d20, and upgraded dealer events through bribes. The pawnshop now offers a distinct exchange for its bribe. Event text and the reward meter have been aligned across desktop and mobile.

[Release notes](https://github.com/TheO1dF/one-more/blob/web-polish/RELEASE-v0164.md)

## Repository branches

- `main`: ready-to-host static website. GitHub Pages and Cloudflare deploy from this branch.
- `web-polish`: web source, tests and build scripts. `npm run check` builds `dist/`.
- `pc-steam`: shared game plus Electron Windows packaging.

`BUILD.json` identifies the source commit and SHA-256 hashes of the game files. Saves are local to each site origin. The itch.io upload and Windows build are separate artifacts.
