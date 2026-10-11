# Wandmoss Journey

I wanted a small fairy-tale platformer with a dwarf wizard and a smoking wand.
I described the idea to Codex and started with one forest level. Through my
tests and feedback, I expanded it into four chapters, with rocket boots in
the clouds and the Guardian of the Valley waiting at the end.

Codex implemented the game and ran technical checks. I played each iteration
and chose the next changes to the scenery, controls, sound and difficulty.

![Wandmoss Journey — Dusk Trail, the second chapter](docs/screenshots/wandmoss-journey-dusk.png)

## Play

[Play online](https://j-kepka.github.io/vibe-coding-playground/02-wandmoss-journey/).

Copy this folder and open `index.html` in a modern browser. It runs offline,
with no installation, build or server. Keep the game files and assets together.

**Move:** ← → or A/D · **Jump:** Space · **Cast:** X · **Rocket boots:** C · **Pause:** P

Follow lantern checkpoints through forest, dusk, clouds and the final valley.
Acquired rocket boots need manual activation; defeating the boss takes ten
spell hits.

English is the default; German and Polish are available, and your language
choice persists. Use touch buttons and two-finger canvas zoom on mobile.
Enable sound with **♫**; use the corner icon for fullscreen and **Escape**
to return. Music volume and license credits are available on pause.

Optional autosave keeps one continuation slot at chapter starts and the last
pre-boss lantern; other lanterns are in-run checkpoints. Saves and preferences
stay in your browser profile. If storage is blocked, saves last only in the
current tab.

[Development process](docs/DEVELOPMENT_PROCESS.md) ·
[Documented outcomes](AI_TRANSFORMATION_OUTCOMES.md)

Gameplay development is complete. The local log-edge and phone-view corrections
await the second publication PR; physical-phone verification is pending.

Original code and artwork: [MIT License](LICENSE). Music by **Kevin MacLeod**:
**CC BY 4.0**, with separate [attribution and license details](THIRD_PARTY_NOTICES.md)
also available in the game's **Music and licenses** menu.
