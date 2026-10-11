# Mosslight — opening-menu chapter selector verification

**2026-10-10 availability update:** I removed all remaining screenshots while renaming the project directory. Original image paths below are historical references, not downloadable artifacts. Earlier verification findings are preserved.

**Iteration:** Direct chapter selection for the owner's tests  
**Date:** 2026-10-09  
**Checked by:** Codex

## Reproduce

From the repository root:

```sh
python3 -B 02-mosslight/tests/browser_check.py --level-picker-only
```

The optional harness uses Python's standard library and local Chrome/Chromium
on Linux, opening the game through `file://` with a temporary browser profile.
The game itself needs only a browser.

## Change and results

The opening menu now offers all four chapters and a Play button. It starts a
fresh practice run at the chosen chapter's normal spawn, with three hearts and
zero points. Chapter four has ready boots; chapter three keeps its artifact
pickup. Runs can progress into later chapters and use the practice ending.
With autosave enabled, selection replaces the single saved continuation point;
the menu explains this. With autosave disabled, the earlier save is preserved.

Codex's focused Chrome run passed **84 browser assertions**, exited with status
0 and reported no JavaScript or resource-loading errors. Environment: Linux,
Python 3.15.0rc3 and Chrome 155.0.8059.39. Viewports: 1440 × 1200, 390 × 844 and
320 × 740; the latter two emulate mobile layouts.

Checks covered native keyboard selection and real Play-button clicks for all
four chapters, fresh state and equipment, first-frame movement, menu visibility,
reload/Continue, disabled-save preservation and the existing boss-practice and
New Game buttons. The menu, select and buttons fit the checked viewports.
Codex inspected desktop and mobile opening-menu captures during this check.
Those files are no longer retained after the owner's presentation selection.

The input handler lets native select/input controls consume their keys, and
the mobile opening stage is taller to fit the selector. The remaining
boss-practice hint now also identifies C.

## Scope and owner review

This was a focused interface and save-integration check. It did not repeat
the complete campaign, boss fights or sky pixel suite; their retained results
remain in the [boss-animation](VERIFICATION_BOSS_ANIMATION.md) and
[sky](VERIFICATION_SKY.md) reports. Physical touch devices, Firefox and Safari
were not checked.

The owner requested the selector for direct testing. Acceptance and owner
results for this addition remain pending.

## Screenshot retention

The owner retained only four representative product images: three desktop
views (forest, dusk and sky) and one mobile view. They are linked from the
[project README](../README.md). Current browser checks do not create or
overwrite screenshot files, including temporary captures. Renderer pixel
checks run in memory. Earlier reports preserve their recorded results and
identify removed captures as unavailable.

After removing screenshot output, Codex reran `--sky-only`: four renderer
scenarios and 30 desktop/mobile assertions passed without JavaScript or resource
errors. Python syntax and the capture-output audit passed. A file/hash comparison
confirmed exactly the selected four images remained, byte-for-byte unchanged.
