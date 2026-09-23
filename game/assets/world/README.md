# Character artwork

The dealer uses `dealer-character-v2.png` (transparent PNG). Other event figures use native SVG derivatives in `../../character-art.js`. The remaining `*-character-v2.png` studies and original `*-v1.png` scene illustrations are retained for reference. Pan's retained illustration and transparent figure are in `../pan/`.

Created with the built-in image generation tool. Each character used its own existing scene as the edit target. Prompt: preserve the exact character identity, clothing, pose, angular editorial colour planes and held objects; remove scenery, tables, chairs and unheld props; return a clean transparent-alpha game character. The waiter needed a further extraction pass to remove a remaining backdrop. No stock photographs were used in this revision.

`../../world-art.js` maps event families to these figures. The dealer's head and hands animate in separate SVG clipping groups; `../../world.css` controls their timing. Both native legacy dealer SVGs and the previous PNGs remain available in the repository.
