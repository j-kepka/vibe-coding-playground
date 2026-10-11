# Historical verification record

**2026-10-10 availability update:** I removed all remaining screenshots while renaming the project directory. Original image paths below are historical references, not downloadable artifacts. Earlier verification findings are preserved.

**Later screenshot retention:** The owner selected four representative product
images and removed the other captures. Removed image links below are shown as
original filenames, not replaced with newer images. Current browser checks do
not create or overwrite screenshots.

This is the retained report for the four-chapter expansion, before the later
cloud-stability, boss-hit and autosave changes. The report below is retained as a historical account, with unavailable image links marked below. Its test and screenshot links point to files that have since been
updated; they are not immutable artifacts of that earlier implementation.
See [current verification](VERIFICATION.md) for the latest checked iteration.

---

# Mosslight campaign verification

**Iteration:** Four chapters, rocket boots and a boss finale  
**Date:** 2026-10-09  
**Checked by:** Codex

## Reproduce

From the repository root:

```sh
python3 -B 02-mosslight/tests/browser_check.py
```

The optional developer check requires Linux, Python 3.10+ and Chrome/Chromium
on `PATH`. It uses Python's standard library and opens `index.html` through
`file://`. The game itself needs only a browser and works offline.

The [browser harness](../tests/browser_check.py) runs the retained
[rule scenarios](../tests/gameplay_checks.js) and
[complete campaign route](../tests/campaign_route.js) in the actual browser,
then drives keyboard, mouse and simulated touch input. An injected animation
clock makes the results reproducible; reported route times are simulated game
time, not a human speedrun or a productivity measurement.

## Engine checks

Codex independently ran all 25 rule scenarios and the full campaign route
against the actual level definitions and engine in V8. These checks passed.

| Area | Confirmed behavior |
| --- | --- |
| Campaign | Forest, dusk, bright cloud gardens and the ground finale load with distinct layouts. Walking, launch and descent transitions advance automatically and preserve cumulative points and collectibles. |
| Full route | Normal inputs complete all four chapters, acquire the boots without automatically activating them, light all eight lanterns and defeat the boss. The run records 52/135 fireflies, 1,720 points, 34 jumps, 2 remaining hearts, 0 falls and 10 accepted boss hits in 67.225 simulated seconds. No position, health or enemy fixtures are used in this route. |
| Movement | Original collision, variable-height jump, one-way platform, coyote-time and buffered-input checks still pass. |
| Rocket boots | Manual activation lasts 30 seconds of active simulation time, followed by 15 seconds of recovery. Holding jump reaches approximately 369 px versus 126 px normally. Pause freezes both timers; lanterns preserve an active boost and clear recovery. |
| Hazards and retries | Contact protection, fall respawn, checkpoint ordering and fatal-damage handling pass. Respawn and chapter retry restore usable boots; retry resets the chapter and boss while retaining artifact ownership and previous chapters' progress. |
| Wand | Tapping or holding cast respects the 0.28-second cooldown. |
| Boss | Telegraph, charge and recovery repeat predictably. A boosted jump clears the 145 px body during a real charge without damage immunity. Nine actual spell hits leave the boss alive; the tenth triggers victory once. |
| Exit overshoot | A boosted jump that lands beyond the cloud exit still triggers descent. |

Focused mechanic scenarios use controlled starting positions to isolate rules.
The uninterrupted campaign route uses ordinary gameplay input from the initial
spawn. This does not establish that every optional collectible is reachable or
that the difficulty is enjoyable for a human player.

## Browser checks

Codex ran the command on Linux with Python 3.15 and Chrome 155. The full run
exited with status 0: all 25 rule scenarios, the uninterrupted campaign route,
desktop checks and simulated touch checks passed. No JavaScript or resource
loading errors were observed. Viewports were 1440 × 1200 and 390 × 844.

Desktop checks covered keyboard movement and jumping, held casting and release,
manual E/K and badge activation, boot recovery, paused timers, all ten boss
projectile hits, victory, pausing a launch, chapter retry and complete restart.
Touch checks covered held casting and simultaneous boot activation, movement
and jumping, release/cancellation and horizontal layout fit. A focused follow-up
checks that the mobile ending card, score summary and replay button fit the
visible stage and viewport.

After the mobile layout correction, the focused start and ending checks passed
at 390 × 844 without JavaScript or resource errors. The stage measured
364 × 350 px; the entire congratulations card, summary and replay button fit
inside it and the viewport.

## Corrections in this iteration

Codex's review found that a new lantern canceled an active boot effect. The
fix keeps the remaining active time and clears recovery instead. A boosted
jump could also pass the cloud gate and land beyond its activation region;
the exit now works after landing beyond the gate. Both cases have retained
regression checks.

Codex's visual inspection replaced oversized distant sky trees with small
shrubs, removed ground ferns from sky lanterns and raised charge-direction
arrows above the grass. Screenshot fixtures were adjusted to place the dwarf
on actual cloud surfaces. Spell-input checks use short taps when testing one
shot and a hold when testing repeated casting.

The first mobile ending check found that the stage's aspect ratio and increased
minimum height widened it beyond the frame, clipping the congratulations card.
The stage now has an explicit width; the mobile ending uses a fixed 350 px
height with automatic aspect ratio.

## Captures

- Original forest and campaign HUD — `screenshots/mosslight-desktop.png` (removed by me during the 2026-10-10 title change)
- `screenshots/mosslight-start.png` — Start screen (capture no longer retained)
- Dusk forest — `screenshots/mosslight-dusk.png` (removed by me during the 2026-10-10 title change)
- Cloud gardens and artifact — `screenshots/mosslight-sky.png` (removed by me during the 2026-10-10 title change)
- `screenshots/mosslight-boss.png` — Boss warning and active boots (capture no longer retained)
- `screenshots/mosslight-victory.png` — Congratulations screen (capture no longer retained)
- Simulated mobile layout — `screenshots/mosslight-mobile.png` (removed by me during the 2026-10-10 title change)
- `screenshots/mosslight-mobile-victory.png` — Simulated mobile congratulations (capture no longer retained)

The boss capture uses an isolated fight fixture. The ending capture displays
the final state of the retained input-only campaign route: 1,720 points,
52/135 fireflies and 1:07 elapsed game time. They are visual records, not
evidence that a human played the full campaign.

## Limits and earlier iteration

Codex's checks cover a desktop browser and a simulated touch viewport. Codex
has not checked physical touch devices, Firefox or Safari. A running audio
context does not establish audible sound quality. The owner reports performing
independent verification and tests after every development iteration and
Codex's checks. Specific owner test results, device or browser coverage, and
acceptance of this campaign have not been reported.

The [initial single-level verification record](VERIFICATION_INITIAL.md) remains
a historical account of the first iteration. Its results concern that earlier
implementation. Current test and screenshot paths now show the campaign.

