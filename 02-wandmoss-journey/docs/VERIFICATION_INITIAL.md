# Mosslight verification

**2026-10-10 availability update:** I removed all remaining screenshots while renaming the project directory. Original image paths below are historical references, not downloadable artifacts. Earlier verification findings are preserved.

**Later screenshot retention:** The owner selected four representative product
images and removed the other captures. Removed image links below are shown as
original filenames, not replaced with newer images. Current browser checks do
not create or overwrite screenshots.

**Historical record — initial single-level implementation.** The checks below
were performed before the campaign expansion. The harness and screenshots at
these paths have since been updated; this record does not assert those earlier
results for the current code.

**Iteration:** Initial implementation with one level  
**Date:** 2026-10-09  
**Checked by:** Codex

## Reproduce

From the repository root, run:

```sh
python3 -B 02-mosslight/tests/browser_check.py
```

The optional developer check requires Linux, Python 3.10+ and Chrome/Chromium on
`PATH`. It uses Python's standard library and opens the game directly through
`file://`; the game itself needs only a browser.

Codex ran this command successfully on Linux with Python 3.15 and
HeadlessChrome 155. The desktop viewport was 1440 × 1200; the simulated touch
viewport was 390 × 844. The [browser harness](../tests/browser_check.py) runs
the retained [gameplay scenarios](../tests/gameplay_checks.js) against the
actual engine in Chrome, then drives separate keyboard, mouse and touch events.
An injected animation clock makes the checks reproducible.

## Confirmed results

The command exited with status 0. All 15 engine scenarios, 14 desktop assertions
and 4 simulated touch assertions passed. No JavaScript or resource-loading
errors were observed.

| Area | Observed result |
| --- | --- |
| Complete level route | Starting at spawn, normal engine inputs reached the moon gate with 3 hearts, 0 deaths, both lanterns and 21 of 42 optional fireflies. The route used 13 jumps and 16.47 seconds of simulated game time. It did not reposition the character. |
| Movement and platforms | Acceleration and solid collisions, variable jump height, landing on a mushroom, a jump just after leaving an edge, and a jump pressed just before landing passed. |
| Magic and hazards | Spells and stomps defeated creatures; contact damage, temporary invulnerability, fall respawn and losing all hearts passed. |
| Checkpoints | Lanterns restored hearts and saved the respawn position. Fatal damage could not activate a lantern, and lighting an earlier skipped lantern preserved the farther checkpoint. |
| Desktop interface | The start button, arrow movement, Space jump and landing, X spell, P pause, resume button, restart button and R restart passed. Pausing froze position and the game timer. |
| Audio controls | Enabling sound created a running Web Audio context and returned focus to the canvas. Space then jumped while sound stayed enabled; toggling sound off restored the muted state. |
| Simulated touch | The layout fit at 390 × 844 without horizontal overflow. Simultaneous movement, jump and spell worked; canceling touches cleared held input and the character landed safely. |

Focused collision, damage and spell checks use controlled character positions
to isolate each rule. The complete route uses normal movement, jump and spell
inputs from the initial spawn without teleporting. The route does not establish
that every optional firefly can be collected.

## Corrections in this iteration

Codex's review found and corrected two checkpoint edge cases: fatal enemy
damage followed by lantern activation could leave a lost run with refilled
hearts, and an earlier skipped lantern could replace a farther saved spawn.
Both regressions pass in the retained checks. Codex's visual inspection also
led to hiding the chapter caption during play, mushroom stems reaching the
ground, and a moon placed in view. After enabling sound, focus now returns to
the canvas so Space jumps instead of toggling the sound button again.

The final captures were refreshed after these changes:

- Desktop gameplay — `screenshots/mosslight-desktop.png` (removed by me during the 2026-10-10 title change)
- `screenshots/mosslight-start.png` — Start screen (capture no longer retained)
- Simulated mobile gameplay — `screenshots/mosslight-mobile.png` (removed by me during the 2026-10-10 title change)

## Manual gameplay checklist

Open `index.html` directly in a browser and start a new run.

- Move in both directions with the arrow keys and A/D.
- Jump with Space, Up or W; compare a short press with holding the key.
- Cast with X/J and defeat a thorn creature; also defeat one by landing on it.
- Collect a firefly and confirm the counter increases.
- Take damage and fall into a gap; confirm heart loss and checkpoint behavior.
- Activate a lantern, then confirm that the next respawn returns to it.
- Pause with Escape/P, resume, and restart with R and the button.
- Reach the moon gate and confirm completion and replay.
- Toggle sound after interacting with the page.
- On a touch device, try simultaneous movement/jump or movement/magic and release each button.

## Limits

These checks cover Chrome on one desktop environment and a simulated mobile
viewport. Safari, Firefox and physical touch devices were not checked. A
running audio context does not confirm audible sound quality. Automated checks
do not establish player enjoyment or balance, and no human playtesting feedback
has been recorded for this iteration.
