# Historical verification record

**2026-10-10 availability update:** I removed all remaining screenshots while renaming the project directory. Original image paths below are historical references, not downloadable artifacts. Earlier verification findings are preserved.

**Later screenshot retention:** The owner selected four representative product
images and removed the other captures. Removed image links below are shown as
original filenames, not replaced with newer images. Current browser checks do
not create or overwrite screenshots.

This report records the cloud, boss-hit and autosave iteration before the later
C shortcut, one-second wand cooldown and boss death animation. The report below
is retained as a historical account, with unavailable image links marked below. Linked test and screenshot files have since changed;
they are not immutable artifacts of this earlier implementation. See
[current verification](VERIFICATION.md) for the latest checked iteration.

---

# Mosslight — cloud, boss and autosave verification

**Iteration:** Stable sky scenery, reliable boss hits and saved retry points  
**Date:** 2026-10-09  
**Checked by:** Codex

## Reproduce

From the repository root:

```sh
python3 -B 02-mosslight/tests/browser_check.py
```

The optional developer harness requires Linux, Python 3.10+ and Chrome/Chromium
on `PATH`. It uses Python's standard library and opens the game through
`file://`. The game itself needs only a browser and works offline.
The harness refreshes screenshots inside this project and uses temporary
browser profiles outside the project.

For the final focused regressions only:

```sh
python3 -B 02-mosslight/tests/browser_check.py --followup-only
```

An injected animation clock makes gameplay checks reproducible. All reported
durations below are simulated play time, not human speedruns or development
productivity measurements.

## Results and scope

Codex ran the full browser suite successfully, then the focused final checks
after correcting storage fallback and practice-mode presentation. Both commands
exited with status 0 without JavaScript or resource-loading errors. The retained
checks now cover **38 isolated scenarios plus one uninterrupted campaign route
(39 scenarios)**, followed by desktop and emulated mobile interface checks.
The full run covered the first 37 isolated scenarios and the campaign route;
the final follow-up checked the added quota scenario and the affected interface
paths rather than repeating the entire suite.

Environment: Linux, Python 3.15.0rc3 and Chrome 155.0.8059.39. Viewports:
1440 × 1200 and 390 × 844. No physical touch device, Firefox or Safari was checked.

| Area | Confirmed behavior |
| --- | --- |
| Stable cloud background | Pixel comparisons of the sky background at a fixed camera show zero changed pixels when elapsed time changes from 0 to 90 seconds. Moving the camera changes the image; returning it restores the original pixels. The three cached cloud layers are reused. |
| Existing gameplay | All 25 retained movement, jumping, collision, hazards, spells, checkpoints, boot-timer and chapter-transition scenarios pass. Rocket boots remain manually activated for 30 seconds, followed by 15 seconds of recovery; pause freezes both timers. |
| Campaign route | Ordinary engine inputs complete four chapters, acquire the artifact, light all eight lanterns and defeat the boss: 52/135 fireflies, 1,720 points, 34 jumps, two hearts, zero falls and ten boss hits in 67.225 simulated seconds. This route has no position, health or enemy fixtures. |
| Boss hits | Four focused boss scenarios pass. Closely arriving projectiles all count despite the visual hit flash; each projectile is consumed once. Nine hits leave the boss alive and the tenth triggers victory. |
| Boss with keyboard input | A restored fight and practice fight can be won with real keyboard events, normal hearts, manually activated boots, a jump over the charge, turning and firing after landing. The final mobile practice run ended with three hearts, ten accepted hits and 25.4583 seconds of boost remaining. |
| Saved chapter starts | Normal live gameplay reaches chapters two, three and four and creates their saves. Real page reloads and the Continue button restore chapter starts, banked points, fireflies and equipment with fresh hearts and ready boots. Startup does not overwrite an existing save. |
| Pre-boss save and retry | Reaching the last lantern saves collected rewards and enemy flags. Reload/Continue, R and the lost-screen retry return directly to that lantern with three hearts, ready boots and a fresh ten-hit boss. A repeat attempt removes the previous boss-victory reward, preventing accumulation from repeated practice wins. |
| Save options and failures | Six isolated save scenarios cover chapter restoration, boss restoration, malformed data, disabled autosave, blocked storage and quota failure. Disabled autosave preserves an earlier continuation; its setting survives reload. A blocked browser still plays with a temporary save. A newer temporary checkpoint takes priority over an older readable save after a quota failure. |
| Interface and touch | Keyboard movement, jumps, held casting, pause, boot activation, retries, full restart and simulated touch controls pass. Immediate movement on entering practice survives the first animation frame. Mobile ending cards and replay/new-game buttons fit the viewport; practice hides the campaign-completion route and New Game returns to chapter one. |

Focused rule checks use controlled fixtures to isolate behavior. The complete
campaign route uses ordinary engine input. Separate checks exercise actual
browser keyboard events, clicks, touch events and reloads. These checks do not
establish that every optional collectible is reachable or that human players
will find the difficulty enjoyable.

## Corrections and decisions

The owner reported shaking background clouds and difficulty defeating the boss.
Codex traced the cloud instability to scenery generated from moving screen
coordinates. Background cloud shapes now use fixed seeds and brighter cached
layers, moving only through camera parallax. Landing platforms keep their
existing gameplay behavior.

Codex found that a brief boss damage lock could reject a connecting spell when
the boss charged toward successive projectiles. The flash is now visual only.
The ten-hit requirement, charge phases, horizontal aiming, spell cooldown and
boot durations remain as before. Interface guidance explains that spells should
be aimed toward the boss as the wizard lands or while it rests.

Codex added versioned local saves at chapter starts and the final lantern,
manual continuation, an autosave toggle and direct boss practice. The final
lantern supplies boots if the sky artifact was skipped. Practice has a distinct
ending so defeating one boss does not claim completion of the four chapters.

Final review corrected a quota failure that could select an old persisted save
over the newer temporary checkpoint, a first-frame input reset on entering
practice, and CSS that prevented the practice ending's hidden route from
disappearing. The targeted follow-up verified those paths and starting a fresh
campaign from the mobile practice ending.

## Visual records

- Forest and campaign HUD — `screenshots/mosslight-desktop.png` (removed by me during the 2026-10-10 title change)
- Dusk forest — `screenshots/mosslight-dusk.png` (removed by me during the 2026-10-10 title change)
- Brighter cloud gardens — `screenshots/mosslight-sky.png` (removed by me during the 2026-10-10 title change)
- `screenshots/mosslight-boss.png` — Boss warning and boots (capture no longer retained)
- `screenshots/mosslight-victory.png` — Campaign congratulations (capture no longer retained)
- `screenshots/mosslight-continue.png` — Continue menu after reloading a pre-boss save (capture no longer retained)
- Emulated mobile gameplay — `screenshots/mosslight-mobile.png` (removed by me during the 2026-10-10 title change)
- `screenshots/mosslight-mobile-victory.png` — Emulated mobile campaign ending (capture no longer retained)
- `screenshots/mosslight-mobile-practice.png` — Mobile practice ending after a keyboard victory (capture no longer retained)

Codex visually inspected the sky and mobile practice captures. Scenery and boss
captures use isolated fixtures. The campaign ending uses the retained route's
completed state; the practice ending follows a real keyboard-input fight.
Screenshots are technical evidence, not records of human playtesting.

## Limits and owner review

Autosave uses one slot in this browser's local storage. Starting boss practice
with autosave enabled replaces the current campaign save. Blocked storage or a
quota failure limits the newer save to the current tab; closure or reload can
lose that temporary progress. Local-file storage behavior can vary by browser
and file location. Invalid or unsupported saves are ignored.

The owner performs independent tests after each development iteration and
Codex's checks. The shaking clouds and boss difficulty are reported feedback
from the preceding campaign iteration. Acceptance and device coverage for these
latest changes are pending. An active audio context does not establish audible
sound quality.

The [initial single-level report](VERIFICATION_INITIAL.md) and
[four-chapter expansion report](VERIFICATION_CAMPAIGN.md) remain historical
records of their respective implementations.

