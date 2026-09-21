# One More? · v0.13.1

[Play on GitHub Pages](https://theo1df.github.io/one-more/) · [Cloudflare mirror](https://one-more-6ed.pages.dev/) · [Gameplay footage](https://theo1df.github.io/one-more/media/)

One more card, or cash out? Pair food, combine tools and pledged items, and build a deck that can survive ten tables. Banked points carry over. The bomb stays in the deck. Draw it, and the run is over.

An in-development browser playtest with 80 card types, 20 pledged items, food enchantments, nine unlock milestones, four stakes levels and three challenges. Unlocks add choices rather than permanent stat boosts. English / 简体中文, desktop and mobile, local browser saves. No player account required.

v0.13.1 hides only the growth-route entry button in Settings and the collections. All v0.13.0 cards, pledged items, rules, artwork and existing playtest links are retained.

Hotfix: Juicer-consumed food is now correctly marked for Recovery tongs and Toast. Recovery tongs keeps its original effect. All 218 rule tests pass.

Target update: the HUD now shows the cumulative run target alongside points needed this table. Table two adds 4 points to its normal dice raise, once per run; banked points still carry forward. Chinese and English desktop/mobile layouts verified.

## Independent growth playtest

[Play on Cloudflare](https://one-more-6ed.pages.dev/?lab=growth) · [Play on GitHub Pages](https://theo1df.github.io/one-more/?lab=growth). Six build routes add 14 cards and 6 pledged items, with individual-card growth that lasts for one run. This opt-in test uses separate browser saves and card pools. New artwork matches the existing casino poster style.

From table five, choose to expand your deck, refine a growth card, or prune a card, each with a trouble-card trade-off. Lower stakes use a gentler target curve. Completed pairs and spent tools can be collapsed while their effects stay active. Combo feedback no longer holds up your next action.

The growth test also includes random card stapling and dealer trades, pawning, wagers and mystery encounters. Both entries offer optional endless play after clearing ten tables. [Release notes and verification](https://github.com/TheO1dF/one-more/blob/web-polish/RELEASE-v0130.md).

## Repository branches

- `main`: ready-to-host static website. Keep GitHub Pages and Cloudflare connected to this branch.
- `web-polish`: web source, tests and build scripts. `npm run check` builds `dist/`.
- `pc-steam`: shared game plus Electron Windows packaging. EXE builds are separate artifacts, not part of this website.

## Cloudflare update

The existing **one-more Cloudflare Pages** project is connected to `TheO1dF/one-more`, production branch `main`. Push ready-to-host releases to `main`; Cloudflare and GitHub Pages deploy from that branch. The stable Cloudflare address is https://one-more-6ed.pages.dev/ .

If reconnecting Pages: framework **None**, root directory `/`, build command blank, output directory `.`. This branch already contains the complete static build. Source branches need `npm run build` and output `dist/`; do not change the production branch merely to sync source code.

For a manual static upload, use the website files in `main`. GitHub Pages serves the root of `main`.

`BUILD.json` identifies the exact source commit and SHA-256 hashes of the game files. Cloudflare `_headers` asks browsers to revalidate files on a new visit. Saves are local to each site origin: GitHub Pages and Cloudflare do not share player progress.

Steam release preparation uses a free Playtest. The developer's Steamworks tax review is in progress; a live Steam store link is not available in this build. This repository update does not update the separately uploaded itch.io build.

Original soundtrack: **The Empty Glass**. Original artwork remains available in the source branches.
