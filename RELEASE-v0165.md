# 0.16.5 — onboarding and stakes

- First-time players learn by drawing, inspecting, pairing and peeking. The dealer speaks next to the relevant control with a pulsing outline. No reading-confirmation screens or forced bomb death. Cashing out after the first pair is a real option.
- The optional flashlight/cup lesson uses cards already in the starting deck; there is no additional starting flashlight. Dice, routes and packages are explained when reached. A real loss highlights retry; the retry uses a fresh shuffled deck without repeating the fixed opening.
- New-run stakes: 0 normal targets and one bomb rescue per run; 1 adds 2 to target raises, then 4 from table 5 and 8 from table 8; 2 removes the rescue; 3 additionally replaces one starting food with Scrap. Tools and bomb-growth interval remain unchanged. Ten-table victory unlocks the next level; the home menu displays selection and locked levels.
- A rescue keeps the table and bank, shuffles the bomb back, and stops for the player's next decision. The charge survives refresh, is not restored at table transitions or endless entry, and is spent before an event-earned Pan gift. Old runs retain their previous rules.
- Large desktop viewports scale the HUD, cards, pledged items, previews and inspection panel together. Settings offer automatic / 100–200% interface size, bounded by available window space. Dense desktop tables paginate before cards become illegible; touch retains the continuous horizontal row.

Validation: 342 automated checks, production static build, isolated Edge desktop/mobile tutorial flows through the second table; rescue/refresh/loss/retry; unlocked difficulty menu; 1440×900, 390×844, 2560×1440 and 3840×2160 visual checks. Normal animation speed throughout. Evidence is in `.artifacts/onboarding-v0165/`.

This verifies behavior and layout, not retention or whether first-time players enjoy the change. That still needs an unprompted playtest with new players.
