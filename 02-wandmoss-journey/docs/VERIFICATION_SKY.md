# Historical verification record

**2026-10-10 availability update:** I removed all remaining screenshots while renaming the project directory. Original image paths below are historical references, not downloadable artifacts. Earlier verification findings are preserved.

**Later screenshot retention:** The owner selected four representative product
images and removed the other captures. Removed image links below are shown as
original filenames, not replaced with newer images. Current browser checks do
not create or overwrite screenshots.

This report records sky cleanup and platform contrast before the opening-menu
chapter selector was added. It is retained as a historical account, with unavailable image links marked below. Linked source
and screenshot files may be updated in later iterations. See
[current verification](VERIFICATION.md) for the latest checked change.

---

# Mosslight — sky clarity verification

**Iteration:** Remove shadow-like decorations and clarify walkable clouds  
**Date:** 2026-10-09  
**Checked by:** Codex

## Reproduce

From the repository root:

```sh
python3 -B 02-mosslight/tests/browser_check.py --sky-only
```

The optional harness requires Linux, Python 3.10+ and Chrome/Chromium on
`PATH`. It opens the local game through `file://`, uses a temporary browser
profile and refreshes sky screenshots inside this project. The game itself
needs only a browser and works offline.

## Diagnosis and change

The owner reported three faint shadow-like shapes in the third chapter,
including one hidden by the pause card. They were translucent decorative
floating islands with small trees, drawn in the middle cached background
layer. Their triangular bases and green tint made them look like shadows.

Codex removed that decoration loop. The pause card had hidden a background
island; it was not generating the shapes.

The owner then reported full-game completion and a satisfactory final fight,
and requested stronger contrast between background and walkable clouds.
Codex gave distant clouds softer blue tones and lower opacity. Walkable clouds
now have opaque bright tops, a blue outer edge and deeper underside, plus a
warm outlined ridge marking the physical landing height. Background shapes
remain fixed and move through camera-only parallax.

## Focused checks

Codex's final focused Chrome run passed four renderer scenarios and 30
interface/fixture assertions, exiting with status 0 without JavaScript or
resource-loading errors. Environment: Linux, Python 3.15.0rc3 and
Chrome 155.0.8059.39; desktop 1440 × 1200 and emulated mobile 390 × 844.

- All four existing renderer scenarios passed: fixed-camera sky stays
  pixel-identical as time advances; moving the camera scrolls it and returning
  restores the original pixels; tile wraps reuse three cached layers; the
  boss's kneeling, falling and settled poses remain distinct and stable.
- Chapter-three fixtures showed the cleaned background near the start, farther
  along the route and at the far camera limit. Codex inspected playing and
  paused views, including the middle area normally covered by the pause card.
- Desktop and emulated mobile pause froze game state; resuming returned to play.
  The checked layouts had no horizontal overflow.
- Visual inspection showed the brighter, outlined platform surfaces against
  softer blue background clouds in both viewports. No numerical contrast or
  human usability measurement is claimed.

The fixtures position the wizard on actual cloud platforms to inspect scenery;
they are not records of a human completing the chapter. This rendering-only
iteration did not repeat the entire campaign or boss interface suite. The
preceding [balance and boss-animation report](VERIFICATION_BOSS_ANIMATION.md)
records its successful 43-scenario full run and input/reload checks.

## Visual records

- `screenshots/mosslight-sky-before-cleanup.png` — Retained sky view before cleanup (capture no longer retained)
- Cleaned sky during play — `screenshots/mosslight-sky.png` (removed by me during the 2026-10-10 title change)
- `screenshots/mosslight-sky-paused.png` — Cleaned sky behind the pause card (capture no longer retained)

The before image is the retained Codex fixture capture from the preceding
iteration, not the owner's annotated screenshot. The new captures use focused
fixtures at the start of the sky chapter; the frames have different camera
positions. They document the scenery rather than a pixel-for-pixel comparison.

## Limits and review

The owner reported completing the preceding version and finding its final
fight fine, and continues independent testing after each iteration. Acceptance
of this sky cleanup and contrast change remains pending. Physical touch devices, Firefox and Safari
were not checked.

Earlier reports remain historical records:
[one level](VERIFICATION_INITIAL.md),
[four-chapter expansion](VERIFICATION_CAMPAIGN.md),
[autosave](VERIFICATION_AUTOSAVE.md) and
[casting balance and boss animation](VERIFICATION_BOSS_ANIMATION.md).

