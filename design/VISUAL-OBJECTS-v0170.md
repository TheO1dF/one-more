# Table objects and action presentation — proposal, not implemented

Superseded by v0.17.1: ordinary pairing keeps a 210 ms stacking slide, with no shared-plate ceremony. Brief tool and outcome performances are implemented; see `RELEASE-v0171.md`. Do not revive the paired-dish proposal below without a new request.

Keep the draw / pair / use / cash-out rules, all current card identities, the existing SVG art and the flat casino palette. Give actions a visible physical result on the table.

## First slice

1. Juicer: animate the consumed ingredient artwork into the juicer, move the mechanism, pour out the juice, and leave the explicitly generated residue. Use the actual consumption result to choose the source and destination. Do not imply that every tool creates residue.
2. Pair: bring the two ingredient artworks together onto a small shared serving plate. Keep the two original targets independently selectable and inspectable, including enchantments and scores. No extra confirmation or click to expand the pair.
3. Pledged items: show each triggering item responding at its existing position, then connect its effect to the actual target and score display. Avoid duplicate card-shaped messages and permanent new HUD panels.

## Boundaries

- Preserve clear identification, two-click pairing, touch targets and reduced-motion support.
- Keep unpaired card faces readable while learning or choosing actions. Object presentation should not hide a cost or an exhausted state.
- Tie animation to recorded rule outcomes. Controls must not depend on the animation completing; never let a flourish extend the draw lock.
- Compress repeated effects in long chains while preserving their cause and total result.
- Test one juicer sequence and one paired dish before replacing all table representations.
