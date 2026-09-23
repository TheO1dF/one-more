# One More?

A push-your-luck deckbuilder: build pairs, use tools, and cash out before a bomb ends your run.

[Play on Cloudflare](https://one-more-6ed.pages.dev/) · [Play on GitHub Pages](https://theo1df.github.io/one-more/)

## v0.16.1

Adds 24 cards across six construction systems, food storage between tables, and new dealer encounters. Pan offers a one-use escape from a bomb through a rare event. The tutorial explains the table through the dealer, and table grouping is activated manually.

The illustrated dealer returns with separate head and hand animations. Completed events show their character beside the recap; route choices retain prop icons. Food-cost waivers show a dedicated icon and remaining-use count. Full-motion settings are respected even when the browser requests reduced motion.

Existing saves and original art are retained. The growth test-mode entry remains hidden. 302 automated checks pass, with desktop and mobile visual checks.

[Release notes](https://github.com/TheO1dF/one-more/blob/web-polish/RELEASE-v0161.md) · [Card systems](https://github.com/TheO1dF/one-more/blob/web-polish/NIGHT-SYSTEMS.md)

## Repository branches

- `main`: ready-to-host static website. Keep GitHub Pages and Cloudflare connected to this branch.
- `web-polish`: web source, tests and build scripts. `npm run check` builds `dist/`.
- `pc-steam`: shared game plus Electron Windows packaging. EXE builds are separate artifacts.

## Hosting

The one-more Cloudflare Pages project deploys from `main`. Framework: None; root: `/`; build command: blank; output: `.`. GitHub Pages serves the root of `main`.

`BUILD.json` identifies the source commit and SHA-256 hashes of the game files. `_headers` asks browsers to revalidate files on a new visit. Saves are local to each site origin.

This push does not update the separately uploaded itch.io or Windows build. Original artwork remains available in the source branches. Soundtrack: **The Empty Glass**.
