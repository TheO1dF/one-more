# One More? v0.16.7 — clear choices and continuous guidance

- Make the home stakes entry a visible paper-colored button with level, label and change arrow, plus hover/focus/pressed states.
- Tutorial v8 fixes the rescue branch: randomized retries stay in contextual play rather than being sent to a flashlight that may not be on the table. The scripted peek/inspect/shuffle sequence completes before unrestricted draws; missing targets no longer silently hide the coach.
- Select a food, select its partner/effect target, then confirm PAIR. Select a tool, select its cost/effect targets, then confirm USE. Selection and cancellation do not mutate the run or consume randomness. Off-table targets remain available in lists.
- Replace the rope indicator with a flat casino-poster arrow; confirmed targets remain marked.
- Existing v0.16.5/v0.16.6 rescue, time-loop, difficulty and high-resolution changes are retained. No new gameplay proposal from the research document is enabled.

Validation:
- npm run check: 348 tests passed; static build succeeded.
- Isolated headless Microsoft Edge, normal animation speed: Chinese 1440x900 desktop and English 390x844 touch full tutorial to table two, save/reload, second bomb death and guided retry, difficulty menu.
- Confirmation coverage: food cost with cancel and retry, pair-trigger effect targets, off-table reclaim, two-target packing tool, randomized retry rescued without a flashlight and reloaded afterward.
- Evidence: .artifacts/onboarding-v0167/.
- Design research: design/PLAY-IDENTITY-v0167.md. Local changes only; not pushed or deployed.
