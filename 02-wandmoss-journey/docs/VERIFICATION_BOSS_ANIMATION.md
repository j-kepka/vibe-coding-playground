# Historical verification record

**2026-10-10 availability update:** I removed all remaining screenshots while renaming the project directory. Original image paths below are historical references, not downloadable artifacts. Earlier verification findings are preserved.

**Later screenshot retention:** The owner selected four representative product
images and removed the other captures. Removed image links below are shown as
original filenames, not replaced with newer images. Current browser checks do
not create or overwrite screenshots.

This report records the C boot shortcut, one-second wand cooldown and boss
defeat animation before the later sky-background cleanup. It is retained as a historical account, with unavailable image links marked below. Linked source and screenshot files can change in subsequent
iterations; they are not immutable artifacts of this earlier implementation.
See [current verification](VERIFICATION.md) for the latest checked iteration.

---

# Mosslight — casting balance and boss defeat verification

**Iteration:** C boot shortcut, one-second casting and animated boss defeat  
**Date:** 2026-10-09  
**Checked by:** Codex

## Reproduce

From the repository root:

```sh
python3 -B 02-mosslight/tests/browser_check.py
```

This optional harness requires Linux, Python 3.10+ and Chrome/Chromium on
`PATH`. It uses Python's standard library, a temporary browser profile and
the local game through `file://`; it refreshes captures within this project.
The game itself needs only a browser and works offline.

An injected clock makes checks reproducible. Durations below are simulated
gameplay time, not human speedruns or development productivity measurements.

## Results and scope

Codex's complete Chrome run exited with status 0, with no JavaScript or
resource-loading errors. It passed **42 isolated scenarios plus one complete
campaign route (43 retained scenarios)**, followed by desktop and emulated
mobile interface checks. The scenarios comprise 25 gameplay, six boss, four
rendering and seven save checks, plus the route.

Environment: Linux, Python 3.15.0rc3 and Chrome 155.0.8059.39. Viewports:
1440 × 1200 and 390 × 844. Codex also ran the engine scenarios independently
in V8 and the renderer pixel scenarios separately in Chrome.

| Area | Confirmed behavior |
| --- | --- |
| C activation | Actual C keyboard events activate acquired boots; the badge, guide, messages and accessibility text identify C. E/K still work as alternative shortcuts. Badge and touch activation remain usable. |
| Boot timing | Boost remains 30 seconds, followed by 15 seconds of recovery. Pause freezes timers; lanterns preserve an active boost and clear recovery; respawn and retries ready the boots. |
| Wand recovery | Held input and repeated early taps cannot bypass the one-second cooldown. Actual keyboard and touch checks verify repeat timing; the HUD fills halfway after half a second and returns to ready after a full second. |
| Ten-hit defeat | Nine real projectiles leave the boss alive. The tenth starts kneeling with no victory overlay or reward. The boss kneels, falls and remains face-down; victory and 500 points occur only after 2.2 seconds, once. |
| Cinematic safety | Combat and movement inputs cannot change the fight during defeat; hazards cannot remove hearts. An airborne wizard settles safely. P freezes the sequence and its clocks; the pause button resumes the unfinished animation. R cancels it and restores a fresh fight. |
| Poses | Three rendered defeat poses have distinct silhouettes; the settled corpse is pixel-identical as render time changes, including with a leftover hit-flash timer. The brighter background clouds still have zero fixed-camera jitter and camera-only parallax. |
| Boss route | Ordinary engine input clears three charges and wins with ten shots, three hearts and zero falls in 14.5167 simulated seconds, including the animation. A single manual boot activation still has 17.9167 seconds remaining. Separate real-keyboard browser fights also win. |
| Campaign route | Normal engine inputs complete four chapters with all eight lanterns, 52/135 fireflies, 1,670 points, 37 jumps, one heart, zero falls and ten boss hits in 78.5583 simulated seconds. No position, health or enemy fixtures are used. |
| Save and retry | Chapter and final-lantern saves survive real reloads and Continue. Disabled autosave, malformed data, blocked storage and quota fallback still pass. Mid-animation retry does not deduct an unawarded bonus; retry or continuation after a completed fight excludes the old 500-point victory reward. |
| Interface | Movement, variable jumps, pause, chapter transitions, full restart, held touch casting and simultaneous touch controls pass. Campaign and practice endings, replay and New Game fit the emulated mobile viewport. |

Isolated scenarios use controlled fixtures. The complete campaign route uses
ordinary engine input; separate browser checks use actual keyboard, mouse,
touch and reload events. These checks do not establish that every optional
collectible is reachable or that the balance is enjoyable for human players.

## Changes and checks

The owner reported defeating the boss several times after the preceding
autosave iteration, then requested C for boots, a one-second wand cooldown
and a kneeling/face-down death before congratulations. Codex implemented that
request without changing the boss's ten-hit health, charge phases or boot
durations.

Defeat uses simulation time: kneeling lasts 0.75 seconds, the forward fall
0.65 seconds, and the settled pose remains visible until 2.2 seconds. Damage,
casting and skill timers stop during the sequence; pausing also freezes its
animation and elapsed game time. The camera keeps the fallen boss in view.

The earlier automated route cast continuously even when no enemy was nearby.
With the slower cooldown it spent available spells before approaching enemies
and failed before the boss. Codex changed only the route controller to cast
toward a nearby enemy at wand height; its maps, movement and jumps remain
ordinary gameplay inputs. The current route's results differ from earlier
reports and are recorded separately.

Codex also corrected continuation after a completed fight so a saved retry
cannot retain the old victory bonus. A retained save scenario verifies the
winning score stays visible while the restored fight starts without that bonus.

## Captures

- `screenshots/mosslight-boss-kneeling.png` — Boss on its knees before the ending (capture no longer retained)
- `screenshots/mosslight-boss-fallen.png` — Boss face-down before the ending (capture no longer retained)
- `screenshots/mosslight-victory.png` — Campaign congratulations (capture no longer retained)
- `screenshots/mosslight-mobile-practice.png` — Mobile boss-practice ending (capture no longer retained)
- Brighter sky scenery — `screenshots/mosslight-sky.png` (removed by me during the 2026-10-10 title change)
- `screenshots/mosslight-continue.png` — Continue menu (capture no longer retained)

The death-pose captures follow a tenth real keyboard projectile in an isolated
fight fixture. The campaign ending uses the retained route's completed state;
the practice ending follows a real keyboard-input fight. Codex inspected the
renderer's pose preview and the browser captures. These are technical visual
records, not human playtesting screenshots.

## Owner feedback, limits and earlier iterations

The owner's several successful boss fights concern the preceding version.
The owner continues to test after each Codex iteration. Device coverage and
acceptance of this new cooldown, shortcut and animation remain pending.

Codex checked Chrome and an emulated touch viewport, not physical touch devices,
Firefox or Safari. An active audio context does not establish audible sound
quality. Autosave still uses one browser-local slot; practice replaces it when
enabled, and blocked storage or quota failure can leave newer progress only
in the current tab. Local-file storage behavior can vary by browser/location.

Earlier reports remain historical records:
[one level](VERIFICATION_INITIAL.md),
[four-chapter expansion](VERIFICATION_CAMPAIGN.md) and
[cloud, boss-hit and autosave iteration](VERIFICATION_AUTOSAVE.md).

