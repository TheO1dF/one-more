# One More? · v0.12.0

[Play on GitHub Pages](https://theo1df.github.io/one-more/) · [Cloudflare mirror](https://one-more.theoldf2077.workers.dev/) · [Gameplay footage](https://theo1df.github.io/one-more/media/)

One more card, or cash out? Pair food, combine tools and pledged items, and build a deck that can survive ten tables. Banked points carry over. The bomb stays in the deck. Draw it, and the run is over.

An in-development browser playtest with 80 card types, 20 pledged items, food enchantments, nine unlock milestones, four stakes levels and three challenges. Unlocks add choices rather than permanent stat boosts. English / 简体中文, desktop and mobile, local browser saves. No player account required.

## Repository branches

- `main`: ready-to-host static website. Keep GitHub Pages and Cloudflare connected to this branch.
- `web-polish`: web source, tests and build scripts. `npm run check` builds `dist/`.
- `pc-steam`: shared game plus Electron Windows packaging. EXE builds are separate artifacts, not part of this website.

## Cloudflare update

For the existing **one-more Worker**, connect or redeploy `TheO1dF/one-more`, branch `main`, root directory `/`. No build command is required; deploy command: `npx wrangler deploy`. The included `wrangler.jsonc` points at the ready-made site in the repository root. If using Cloudflare Pages instead, choose no framework, no build command and output directory `.`. A repository push only deploys automatically after Git integration is connected; this file does not claim that integration is active.

For a manual static upload, use the v0.12.0 HTML5 ZIP or the website files in `main`, not the Windows EXE ZIP. GitHub Pages serves the root of `main`.

`BUILD.json` identifies the exact source commit and SHA-256 hashes of the game files. Cloudflare `_headers` asks browsers to revalidate files on a new visit. Saves are local to each site origin: GitHub Pages and Cloudflare do not share player progress.

Steam release preparation uses a free Playtest. The developer's Steamworks tax review is in progress; a live Steam store link is not available in this build. This repository update does not update the separately uploaded itch.io build.

Original soundtrack: **The Empty Glass**. Original artwork remains available in the source branches.
