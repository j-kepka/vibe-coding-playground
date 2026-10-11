# Wandmoss Journey — verification record

The game was renamed on 2026-10-10. Earlier entries retain the names, commands
and environments used at their recorded iterations. See the
[branding and save-compatibility checks](#wandmoss-journey-branding-and-save-compatibility--2026-10-10)
for the current title and project path.

## Mosslight — recorded soundtrack verification

**Iteration:** Local music, playback controls and separate music licensing  
**Date:** 2026-10-09  
**Checked by:** Codex

## Reproduce

From the repository root:

```sh
python3 -B 02-mosslight/tests/music_check.py
python3 -B 02-mosslight/tests/browser_check.py
python3 -B 02-mosslight/tests/browser_check.py --level-picker-only
```

The optional checks use Python's standard library and local Chrome/Chromium
on Linux, opening the game through file:// with a temporary browser profile.
The game itself needs only a browser. No checks create or overwrite screenshots.
Chrome could not start in the restricted execution sandbox; the checks ran
successfully with approved local browser execution.

## Change and results

Codex bundled five unchanged Kevin MacLeod MP3 recordings. Fairytale Waltz
accompanies the menu and victory; Folk Round the forest and final approach;
Evening Fall (Harp) the dusk forest; Enchanted Journey the cloud gardens; and
Call to Adventure the active boss fight and defeat animation. Music starts off
and loads only after the sound-button interaction; recordings repeat and fade
between scenes without file edits.

The sound button controls music and effects; the slider controls music volume.
Pause, loss and hiding the tab stop music. Explicit resume preserves the selected
recording's playhead. Accessible **Muzyka i licencje** credits name the author,
all sources and CC BY 4.0, preserve supplied notices and link to local license
files. Opening credits suspends music and pauses an active game; closing them
returns focus to the credits button and leaves a paused game paused.

The new focused run passed **80 named file, music and desktop/mobile browser
assertions**, exited with status 0 and reported no JavaScript or resource errors.
It used normal Chrome autoplay policy and real pointer/keyboard input, with
native decoding and advancing playback time for all five recordings. The
controlled game clock is separate from the browser's real media clock.

Checks covered all scene mappings, engine boss activation, the tenth real spell
hit, defeat animation, victory and retry; frozen music during pause and resume;
native slider keys, mute, rapid switches and a sole recording after the fade.
A second actual tab verified Page Visibility: the game and audio paused when
hidden and stayed paused on return until resumed. A simulated media-error event
on a real playing element checked status, silence and off/on recovery; it did
not simulate a corrupted file. Checked play requested no remote resources.

Desktop was checked at 1440 × 1200; mobile layouts at 390 × 844 and 320 × 740,
with an additional 400-pixel-tall viewport for scrolling credits. Modal focus,
Escape, Tab, blocked gameplay shortcuts, links and control fit passed. Testing
found and corrected focus restoration after closing credits and menu music
suspension while reading them. An early assertion incorrectly required scrolling
when all credits fit; it was corrected to check a short viewport.

The complete existing suite also passed **43 retained gameplay, campaign,
renderer, boss and save scenarios**, plus its desktop keyboard, reload, boss
fight and emulated touch assertions. The four-chapter input route still completed
with zero falls, one heart, 52/135 fireflies and 1,670 points in 78.5583 seconds
of simulated play. The selector rerun passed **84 assertions** for all four
launches, selection, saves and desktop/mobile fit. These are technical checks,
not owner playtesting or development-time measurements.

Environment: Linux, Python 3.15.0rc3 and Chrome 155.0.8059.39.

## Assets and documentation

Codex matched each title, filename and ISRC in the author's official catalog
and current track-page attribution. All five MP3s passed full FFmpeg decoding
and SHA-256 verification against download provenance. They contain stereo
44.1 kHz audio and total **36,189,518 bytes** (approximately 34.5 MiB).
Embedded metadata is unchanged. Fairytale Waltz and Evening Fall (Harp) supply
2005 copyright notices, retained in the files, notices and credits.

Original code and artwork retain MIT; the recordings retain CC BY 4.0. Sources,
attribution, supplied notices, runtime integration and redistribution conditions
are in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md), with the complete
offline license and [provenance](../assets/music/provenance.json).
Local documentation links and Python syntax passed. The prompt log records
authorization separately from the earlier recommendation and license discussion.

Exactly the four selected presentation screenshots remain, byte-for-byte
unchanged. No additional captures were created. A hash audit confirmed the 22
previously recorded public files outside Mosslight, including the root README,
were unchanged.

## Scope and owner review

These checks establish decoding, playback behavior, interface fit and license
provenance. Codex did not assess sound quality by listening. Physical mobile
devices, Safari and Firefox were not checked; audio policies and volume support
can vary. After these checks, the owner reported testing the iteration, liking
the presentation and finding the soundtrack fine. This is qualitative feedback;
device coverage and detailed test cases were not supplied. Additional effects,
autosave balance and removal of the temporary selector remain in the
[next-session backlog](BACKLOG.md), with no gameplay changes in this documentation
step.

Earlier results remain separate records: [chapter selector](VERIFICATION_LEVEL_PICKER.md),
[sky](VERIFICATION_SKY.md), [balance and boss animation](VERIFICATION_BOSS_ANIMATION.md),
[autosave](VERIFICATION_AUTOSAVE.md), [campaign](VERIFICATION_CAMPAIGN.md) and
[initial level](VERIFICATION_INITIAL.md). The four product images are linked
from the [README](../README.md); historical reports identify removed captures.

## Documentation workflow reorganization — 2026-10-10

**Checked by:** Codex  
**Scope:** Documentation lifecycle, content preservation and local references

Codex used Python standard-library file, SHA-256 and Markdown link/heading
checks in the local Linux repository. The renamed development flow retains
the original log as an exact **24,889-byte prefix**, with SHA-256
`bc0d1523283bf45a915fa0393834c41914f5a9acda2019ca1c610a13fd31317e`.
The numbered entries remain in order, 1 through 19, with the restructuring
request appended once. The former live-log path is absent; the public process
document is reserved for later preparation.

All **107 local Markdown links and image references** resolved, including
heading fragments and the retained entry-18 usage anchor. Codex reviewed
remaining `DEVELOPMENT_PROCESS.md` mentions for historical context or its
future public-document role. An independent Codex agent reviewed the updated
lifecycle and request entry and found no substantive issues.

A before/after hash comparison confirmed that game code, bundled audio, the
four selected screenshots and earlier verification reports were unchanged.
All **22 recorded repository files outside Mosslight** were unchanged. Edits
were confined to Mosslight's agent instructions, README, development record,
verification document and reference paths in the draft outcome case and backlog.

These checks cover documentation consistency and preservation. Gameplay,
browser behavior and audio were not retested in this documentation iteration.

## Subtle movement and combat effects — 2026-10-10

**Checked by:** Codex  
**Iteration:** Grounded footsteps, separate normal/rocket jumps, enemy/boss contacts and boss charge

From the repository root:

```sh
python3 -B 02-mosslight/tests/effects_check.py
python3 -B 02-mosslight/tests/browser_check.py
python3 -B 02-mosslight/tests/music_check.py
python3 -B 02-mosslight/tests/browser_check.py --level-picker-only
```

The [focused effects check](../tests/effects_check.py) passed **71 assertions**:
ten [physical-event fixtures](../tests/effects_checks.js) and 61 native-audio,
desktop and emulated-touch checks. Real keyboard and touch input unlocked
native Web Audio under Chrome's normal autoplay policy. An analyser connected
to the actual effects master output measured nonzero signals for all six
requested effects, with observed peak amplitudes approximately **0.0057–0.0222**
on the normalized PCM scale, below clipping. Sources ended and disconnected,
and the final output returned to silence. These measurements do not establish
perceived loudness or listening quality alongside the music.

Fixtures checked 70-pixel footstep spacing at 120 and 60 physics ticks per
second, silence while idle, blocked or airborne, and stride resets on respawn
and retries. Takeoff selected exactly one normal or rocket cue, with owned but
inactive or expired boots using the normal jump. Accepted enemy/boss contacts
respected invulnerability, and the live controller avoided layering the
generic injury sound over a contact cue. Existing stomp and spell-hit behavior
passed. Each actual warning-to-charge transition emitted one boss-charge cue;
pause, retry and defeat produced no extra charges or footsteps.

Native source checks confirmed immediate cancellation of active and scheduled
notes on mute, pause, credits, a real second-tab visibility change, retry,
respawn and loss. Resume did not replay cancelled jingles. Music volume zero
left effects enabled with measured output; reload returned to mute. Desktop
was checked at 1440 × 1200 and touch at 390 × 844, including control input and
page fit. Checked resources remained local, with no JavaScript or loading errors.

The existing full suite passed **43 retained gameplay, campaign, renderer,
boss and save fixtures plus 115 desktop/mobile checks**. Its input-only route
remained at 78.5583 simulated seconds, zero falls, one heart, 52/135 fireflies,
1,670 points and exactly ten accepted boss hits. Chapter transitions, boots
and timers, lanterns, keyboard boss fights, delayed victory, saves and touch
controls passed. Music passed **80 assertions**, and the chapter selector
passed **84 assertions**. These suites retained their existing coverage.

Environment: Linux, Python 3.15.0rc3 and Chrome 155.0.8059.39, opening `index.html`
through `file://`. Chrome could not start inside the restricted sandbox;
checks completed with approved local browser execution. Test development
corrected a premature read of an automated `AudioParam.value` by comparing
native source types and scheduled durations, and scoped repeated console
fixtures to avoid top-level variable redeclaration. Production checks then
passed without further code corrections.

File/hash and local documentation checks confirmed that the five bundled
recordings, music provenance and notices, four selected screenshots, earlier
verification reports and files outside Mosslight were unchanged. No screenshots
were created. Original synthesized effects add no sampled assets or dependencies.

Codex did not assess these effects by listening. Physical mobile devices and
other browser engines were not checked; the owner's independent review is pending.
Autosave changes and removal of the chapter selector remain deferred.

## Rocket and boss-charge sound prominence — 2026-10-10

**Checked by:** Codex  
**Scope:** The two cues reported as faint or potentially missing, and their audio lifecycle

Run from the repository root:

```sh
python3 -B 02-mosslight/tests/effects_check.py
python3 -B 02-mosslight/tests/music_check.py
```

Before changing the presets, Codex reproduced a real C-plus-jump and a natural
boss wake, warning and charge. Both emitted their expected events and generated
nonzero effects output while the appropriate recording played at the default
music volume of 0.4. No missing trigger was found in this local environment.
The original low-frequency cues decayed quickly; masking is an inference from
their synthesis and the owner's feedback, rather than a verified explanation
of the owner's playback setup.

Codex increased only the rocket-jump and boss-charge presets, shifted their
frequency ranges upward and added short envelope holds. Other presets use the
original envelope with a zero hold. A separate Codex review checked that the
longest noise remains within its existing buffer and that cancellation still
stops held and scheduled voices immediately.

The updated effects suite passed **78 assertions**, retaining the previous 71
and adding seven checks. A native `OfflineAudioContext` rendered each archived
pre-adjustment recipe and the production controller at 44.1 kHz over a fixed
one-second window. The offline adapter permits scheduling before rendering;
sample generation, filters, gain automation and final mixing remain native.
Live gesture/autoplay checks are separate from that adapter.

| Cue | Previous RMS | Adjusted RMS | Adjusted peak |
| --- | --- | --- | --- |
| Rocket jump | 0.001215 | 0.005976 | 0.050725 |
| Boss charge | 0.001390 | 0.006853 | 0.057819 |

RMS increased approximately **4.9-fold** for both cues. More samples exceeded
the same absolute-amplitude threshold, and peaks remained below clipping.
These are normalized PCM measurements across the same window; perceived
loudness and prominence alongside music require listening review.

Live keyboard rocket jumps and natural boss charges also produced measured
output with the forest/boss recordings actually playing at volume 0.4. Existing
physical-event, desktop/touch, mute, pause, credits, visibility, retry, respawn,
loss and no-replay checks passed. The music suite passed **80 assertions**,
including native playback, scene selection, volume and desktop/mobile controls.
No JavaScript or resource-loading errors were reported.

Environment: Linux, Python 3.15.0rc3 and Chrome 155.0.8059.39 through `file://`,
with approved local browser execution. Game rules, event triggers, music
controller, recordings, provenance, licenses, selected screenshots and files
outside Mosslight were unchanged. No screenshots or audio files were created.
Python syntax and local documentation links passed. Codex did not listen to the
adjusted cues; physical devices and other browser engines were not checked.
The owner's listening assessment of this adjustment remains pending.

## Final menu and three-language interface — 2026-10-10

**Checked by:** Codex  
**Scope:** Removal of the temporary chapter selector; English-default, German
and Polish interface; preserved gameplay and autosave policy

From the repository root:

```sh
python3 -B 02-mosslight/tests/language_check.py
python3 -B 02-mosslight/tests/language_check.py --cards-only
python3 -B 02-mosslight/tests/browser_check.py
python3 -B 02-mosslight/tests/effects_check.py
python3 -B 02-mosslight/tests/music_check.py
```

The focused check passed **498 assertions** with local Chrome through `file://`.
It used the standard-library browser driver, native keyboard/pointer input and
explicit state fixtures for interface branches. Desktop was checked at
1440 × 1200 and emulated mobile layouts at 390 × 844 and 320 × 740. These
fixtures are not independent full-campaign playthroughs.

All three catalogs contained the same **186 keys**. Fresh profiles defaulted
to English; the always-visible page-header picker offered English, Deutsch
and Polski. Actual keyboard selection applied the chosen language immediately,
and German persisted after reload. Unsupported saved preferences fell back to
English; blocked local storage still allowed a language choice in the open tab.
The saved run and autosave preference remained independent of the language
preference, including resume after reload and temporary in-tab saves.

Checks covered static text, document language/title/description, accessible
labels and instructions, all chapter HUDs, four boot states, wand recovery,
health, announcements, three transitions, boss phases and aiming hints, lost
and won screens, practice endings and saved-game opening screens. They checked
every tagged static translation against its active catalog and selected
independent literal/local-language expectations. The menu had no temporary
chapter-selector elements or production `startLevel` API. Focused picker input
did not jump, cast, retry or pause the game; opening and pause layouts fitted
the checked viewport widths in all three languages. These assertions did not
establish vertical fit for every mobile state card.

Language changes preserved the complete serialized game state, all storage
other than the language preference, audio enablement/volume/selected recording
and in-memory canvas pixel hashes. Native local music kept playing during a
language switch. Off, playing, muted, paused and unavailable audio statuses
translated correctly. Music credits retained five track entries, the author,
MIT/CC BY notices and their local license links. Each translated credits dialog
opened with actual pointer input and retained normal pause and close behavior.
No JavaScript or resource-loading errors were reported.

The effects regression check passed **78 assertions** and music passed **80**,
with no JavaScript or resource-loading errors. The retained game suite passed
**43 gameplay, campaign, renderer, boss and save scenarios plus 115 desktop/mobile
checks**. Its input-only four-chapter route retained 78.5583 seconds of simulated
play, one heart, zero falls, 52/135 fireflies, 1,670 points and exactly ten accepted
boss hits. This is a technical controller run, not owner playtesting or an
estimate of development time.

A separate `--cards-only` run passed **201 assertions**, checking eleven
contexts in all three languages at all three layouts: fresh opening, saved
chapter opening, saved boss opening, pause, boss retry, chapter loss, campaign
victory, practice victory and the three story transitions. Cards and their
visible actions fitted both the game stage and viewport vertically and
horizontally while preserving game-state and save values. These are targeted
interface fixtures, not 201 additional playthroughs. No CSS correction was
required by the checks.

Environment: Linux, Python 3.15.0rc3 and Chrome 155.0.8059.39, using approved
local browser execution after restricted-sandbox startup failed. Test fixture
corrections made a DOM-element result explicitly boolean and waited for the
native credits-close event and focus restoration before the next interaction.
Those corrections affected the harness; no production defect was identified.
No JavaScript or resource-loading errors were reported in the completed runs.
The owner confirmed testing the preceding sound adjustment; independent review
of this new interface and its translations is pending. Physical devices and
other browser engines were not checked. No screenshots were created.

A baseline hash audit confirmed **45 files unchanged**, including files outside
Mosslight, gameplay/layout/save/effect/rendering modules, MIT, bundled recordings,
music provenance, the offline CC license, the four selected screenshots and
historical verification reports. `THIRD_PARTY_NOTICES.md` changed only its
credits-entry label to the English default, with the German/Polish translations
noted; the supplied rights notices, sources and metadata are preserved.

Documentation checks passed for **62 local links**, including **12 heading
targets**, across the five updated guidance/README/backlog/flow/verification
files. The original 24,889-byte flow prefix retains its recorded hash, and
numbered entries remain in order from 1 through 24. The polished process
document is still deferred; the outcome case was not finalized.

The owner chose to keep eight lanterns and five persistent continuation points
in one save slot. The separate boss-practice mode remains available. Name and
rights checks, GitHub PRs, Pages deployment, final hosted-game tests and the
polished documentation are [planned follow-up](BACKLOG.md), not results of this
iteration. The four retained product images remain the earlier Polish views;
they were not replaced with language-specific captures.

## English README screenshot — 2026-10-10

**Checked by:** Codex  
**Scope:** The owner's explicit request to refresh only the existing desktop
image in English and use one screenshot in the README

Codex captured the actual current game once in Chrome at **1440 × 1200** and
replaced `docs/screenshots/mosslight-desktop.png`. The staged first-chapter
forest frame recreates the selected composition: wizard at x = 340, camera at
zero, no overlay, zero points and zero collected fireflies. The current
English interface includes the language picker and music controls. DOM checks
confirmed English labels, including **Firefly Forest**, **Wand ready** and
**Music and licenses**; the page fitted the viewport without JavaScript or
resource-loading errors. Codex visually inspected the resulting image.

The README contains exactly one embedded image, with English alt text, and
its local references passed. The four retained PNG filenames are unchanged;
only the explicitly requested desktop file changed. A **62-file baseline
audit** confirmed unchanged gameplay/runtime and test files, bundled recordings,
licenses, historical verification reports, the other three images and files
outside Mosslight. Automated browser checks remain free of screenshot writes;
this one-time capture is the owner's explicit exception for the existing file.

This was a presentation update. The staged frame is not a new campaign
playthrough, and no gameplay regression suite was rerun for unchanged game
code. The owner's review of the refreshed image has not yet been reported.

## Removal of the boss testing shortcut — 2026-10-10

**Checked by:** Codex  
**Scope:** The owner's clarification that Boss practice, like the removed
chapter selector, was only a testing aid

From the repository root, the following checks passed:

```sh
python3 -B 02-mosslight/tests/browser_check.py --rules-only
python3 -B 02-mosslight/tests/browser_check.py --followup-only
python3 -B 02-mosslight/tests/browser_check.py
python3 -B 02-mosslight/tests/language_check.py
python3 -B 02-mosslight/tests/language_check.py --cards-only
python3 -B 02-mosslight/tests/effects_check.py
python3 -B 02-mosslight/tests/music_check.py
```

The shortcut is absent from opening and pause menus and the production API.
The separate practice ending and its translations are removed. The victory
screen's replay action starts a new campaign from chapter one; the normal
retry remains available after reaching the final lantern or beginning the boss
fight. The owner's policy remains eight lanterns and five persistent
continuation points in one slot.

The rules check passed **44 scenarios**, including the uninterrupted
four-chapter input-controller route, exactly ten accepted boss hits, the death
animation delay, rocket-boot timers, all eight lanterns and stable cloud
rendering. The added compatibility scenario checked all five continuation
locations: old normal version-one snapshots with `practice: false` still
restore; corresponding `practice: true` testing snapshots are ignored without
deleting their stored value. New normal snapshots and restored state omit the
obsolete practice field. These isolated engine and save scenarios use explicit
fixtures and an input controller; they are not owner playtesting.

The language check passed **498 assertions**, including native picker input,
translated and accessible interface, preserved game state and independent
storage, and absence of both temporary launchers. All three catalogs have the
same **179 keys**, down from 186 after removing the seven obsolete practice
strings. The separate translated-card run passed **183 assertions** for ten
current contexts in all three languages at 1440 × 1200 desktop and emulated
mobile sizes of 390 × 844 and 320 × 740. It no longer tests a practice ending.
Music and effects passed **80** and **78 assertions**, respectively, including
native local playback/effects and desktop/touch interaction.

The completed full browser suite passed the **44 scenarios plus 119
desktop/mobile checks**, with no JavaScript or resource-loading errors. It
covered campaign transitions and autosave reload milestones, restoring a
normal older version-one boss snapshot, and ignoring an obsolete practice
snapshot while preserving its stored bytes. Native keyboard fights ended with
three hearts and ten accepted hits. The desktop fight resumed the input-driven
campaign's earned save; the mobile fight used the isolated final-lantern
fixture. Remaining boost time was 17.73 seconds on desktop and 17.71 on
emulated mobile.

An earlier run exposed a stale test fixture: removing an injected
storage-blocking startup script
required a page reload before writing the next legacy snapshot. A subsequent
run reached a new mobile fixture that attempted to click the boss HUD's retry
button before entering the encounter, when that HUD was correctly hidden.
Codex corrected the fixture to move into the encounter before checking and
clicking the button. Both corrections affect the harness; no production
gameplay defect was identified. The corrected mobile fixture uses bounded real
keyboard input and waits for the actual boss activation instead of assuming
that a fixed number of frames will reach it.

The targeted `--followup-only` run passed **10 checks**, covering storage-quota
fallback and mobile input, an earned boss retry, victory and the replay action.
No JavaScript or resource-loading errors were reported. From an isolated
chapter/final-lantern fixture that triggered the real checkpoint, a native
keyboard fight and death animation ended with three hearts, ten accepted hits
and 17.74 boost seconds remaining. This was a complete fight from the earned
checkpoint fixture, rather than an additional full campaign. Replay reset the
campaign and save to chapter one. The corrected complete rerun also passed.

Environment: Linux and local Chrome through `file://`, driven by Python's
standard library. Chrome required approved execution outside the restricted
sandbox after headless initialization failed there. Checks remain
screenshot-free. A **39-file protected baseline** audit confirmed unchanged
physics/layout, rendering, styles, audio files, all four retained screenshots
and selected files outside Mosslight. Physical devices and other browser
engines were not checked.

Documentation checks passed for **65 local links**, including **17 heading
targets**, across the updated guidance, README, backlog, flow and verification
files. Flow entries remain ordered from 1 through 28; the README still embeds
one image, and the polished process document remains deferred.

The owner reported that the three languages were working well before this
clarification. Independent review of the shortcut removal remains pending.
Publication and final documentation work remain planned. No screenshots were
produced for this iteration.

## Names, code, artwork and music licence review — 2026-10-10

**Checked by:** Codex  
**Scope:** The owner's requested pre-publication name/licence audit, including
English, German and Polish; a subsequent renaming priority and fullscreen plan

The [full evidence report](evidence/NAME_AND_LICENSE_REVIEW.md) records sources,
observations, legal interpretation and limits. Its
[structured audit](evidence/NAME_AND_LICENSE_AUDIT.json) retains registry queries,
record identifiers, original-source URLs, hashes and the credit checks.

**Names:** Exact Mosslight game-title collisions were verified on Google Play
and itch.io/Steam; further close titles and a game studio were found. German
uses the same title, while Moostal is a story location. No exact Mchowa Dolina
game was identified in the bounded searches, but an unrelated commercial
MchowaDolina identifier exists and UPRP could not be searched successfully.
Codex recommends a distinct title; the owner explicitly made renaming P0
before publication. No replacement has been chosen or cleared.

**Registry evidence:** EUIPO showed zero Mosslight marks after a Nintendo
control found 129. USPTO showed zero live/dead Mosslight records after its
control found 203 (67 live, 136 dead). DPMA supplied nine explicit no-hit
responses, seven confirmed with native input, and a 121-entry control. TMview
reported six and WIPO five records in classes 14/20/21/25, including registrations
in other fields. No class 9/41 entry appeared in those queries. Application
numbers, registration numbers, scope and aggregator limits are distinguished
in the evidence. Six queries of one German title-notice archive returned no
hits. None of these observations constitutes worldwide or unregistered-title
clearance; the Polish register attempt and extra international variants remain
explicitly unavailable/inconclusive.

**Assets:** All five bundled MP3s matched fresh official downloads and existing
provenance byte for byte: 36,189,518 bytes. All five title/ISRC/filename pairs
matched the current author's catalog. The 18,657-byte offline CC licence also
matched the current official text/hash. Supplied metadata, including attached
album artwork in four source files, is preserved. The game does not extract
that artwork. No external runtime library, bundled font, standalone gameplay
image or sampled effect was identified; scenery is procedural Canvas/SVG and
effects are synthesized locally.

**Credits:** A fresh screenshot-free Chrome check passed 48 assertions, 16 per
language, for the accessible credits dialog, exact recording/author/source
information, CC BY 4.0, MIT scope, notices and offline links. The review found no
concrete missing attribution or licence requirement. It preserves the separate
MIT/CC terms and explains why synchronizing unchanged recordings with moving
images is still adapted material under CC. Public OpenAI terms and human
copyright requirements were checked; neither output assignment nor source
inspection proves exclusive originality or universal non-infringement.

The owner chose to put the game-panel fullscreen proposal in the
[backlog](BACKLOG.md), with Escape returning to the ordinary page. It was not
implemented here. Research was interrupted by quota before the public report
was written, then resumed from retained evidence. Initial frozen-animation and
offscreen/input-selection issues in external-site automation were corrected;
only actual result observations are reported. No registry account or rights
holder contact was created.

Only documentation/evidence changed. Existing gameplay, audio, licence files,
provenance and all four retained screenshots are unchanged. No new screenshots,
publication PR, deployment or final hosted-game test was produced. Source URLs
and results describe the review date and should be refreshed for the selected
replacement and intended markets; this is an evidence review rather than a
legal opinion or formal clearance.

The final documentation audit passed **53 local links and 13 heading targets**
across the three updated working documents and the new evidence report. Flow
entries remain ordered from 1 through 32; the structured evidence parses and
contains no temporary filesystem paths or copied full-page browser text. A
**65-file integrity comparison** confirmed unchanged existing files apart from
the three authorized working documents, including all runtime/assets/licences,
the four screenshots and files outside Mosslight. The polished process and
outcome finalization remain deferred.

## Proportional iteration and verification policy — 2026-10-10

This documentation-only change records the owner's supplied cost lesson in
the backlog and flow entry 33 and applies it in the local project instructions.
Codex checked the edited content and local links, chronological flow numbering,
and the file-change scope. A separate read-only review found no conflict with
the retained gameplay coverage, owner review, evidence-recording or screenshot
rules. Existing gameplay/browser results remain historical evidence; no
runtime tests, screenshots, new cost measurements or process/outcome
finalization were performed for this change.

## Replacement-name candidate screening — 2026-10-10

Codex performed a bounded indexed-web screening of the owner's two proposed
titles and naming alternatives, with a separate read-only search of the
owner-proposed roots. Relevant Moon Forest game pages were directly verified;
the queries, exact-title/root distinction, recommendation and limitations are
in the [screening evidence](evidence/REPLACEMENT_NAME_SCREENING.md). No live
replacement-name trademark-register review was performed. The owner chose a
single English title for all three interfaces but has not selected the title.
Verification for this research/documentation change covers local links,
chronological flow numbering and file scope; no runtime regression or
screenshot capture was needed or performed.

## Wandmoss Journey branding and save compatibility — 2026-10-10

Codex changed the public title to **Wandmoss Journey** throughout the current
English, German and Polish interface and current project documentation.
The project now resides in `02-wandmoss-journey/`; current test commands use
that path. The browser controller is `window.Wandmoss`, with matching updates
to existing harness/fixture references. Other module names and the original
`mosslight.autosave.v1`, `mosslight.settings.v1` and `mosslight.language.v1`
storage keys remain compatible. Historical names, source observations and
audit hashes remain historical evidence rather than being rewritten.

A focused check using the existing Python/CDP browser helper passed **55
assertions** in Chrome **155.0.8059.39** on Linux. It checked all three
languages with native picker input at **1440 × 1200**, **390 × 844** and
**320 × 740**, including the longer heading's bounds and separation from the
introduction, page title/footer, accessible game/canvas names, credit headings,
absence of retired names in interface copy and intact recording/licence links.
Language changes preserved the full game state.

A normal legacy version-one chapter-three fixture, including the old
`practice: false` field, restored 450 points, 21 collected fireflies, completed
chapters and owned boots. The original German preference and disabled
autosave settings were retained. Native Resume, movement and pause worked
through the renamed controller; switching to Polish preserved the save and
settings bytes and created no parallel storage namespace. These are technical
fixtures, not owner playtesting or a check against the owner's personal browser
profile. No JavaScript or resource-loading errors occurred in the checked run.

The first local Chrome launch failed in the execution sandbox; the same focused
check completed successfully with approved local browser execution. A stale
path read/patch also failed after the workspace directory changed, and Codex
continued using the observed new path. The first document-link check found
missing image files; the owner confirmed personally renaming the directory
and deleting all four screenshots. Codex removed current image links and
marked historical image paths as unavailable. No replacement screenshots
were captured. Full gameplay/music/effects suites were not repeated for this
branding-only change; music files, licence contents and gameplay rules remain
unchanged. Official-register clearance for the selected title is still a
pre-publication backlog item; this rename does not imply that it was completed.

The final documentation audit passed **135 local links and 26 heading targets**
across project Markdown, with flow entries ordered 1–36 and valid Python
harness syntax. The file comparison found 30 changed files within the renamed
project and exactly the four owner-confirmed image deletions. Music/art bytes,
MIT/CC licences, the historical structured audit, the root README and other
projects were unchanged. The engine, renderer, synthesized effects and chapter
layout files changed only in their introductory title comments.

## Selected-title official trademark-register review — 2026-10-10

Codex completed the requested bounded register check for **Wandmoss Journey**
using live official search interfaces. The
[report](evidence/WANDMOSS_TRADEMARK_REVIEW.md) and
[structured audit](evidence/WANDMOSS_TRADEMARK_AUDIT.json) retain fields,
operators, query echoes/payloads, counts, known-mark controls, sources and
limits. The five core full-title/root/spacing inputs returned zero in EUIPO,
WIPO, UPRP, DPMA and USPTO. Near roots returned zero where completed; DPMA
also checked Wandmoss* and the root separately in Classes 9 and 41.

Nintendo controls returned 129 EUIPO marks, 2,442 WIPO records, 10 direct UPRP
trademark records, 121 DPMA results and 203 USPTO results; USPTO's phrase
control returned 14 SUPER MARIO BROS records spanning registered, pending,
cancelled and abandoned states. There are **36 zero-result query observations**
in the final audit, with six positive controls and three broad WIPO token
queries retained separately. These counts describe search observations, not
distinct worldwide marks or productivity measurements.

Direct UPRP worked today for this selected title. TMview failed before a form,
and further USPTO queries stopped after an HTTP 403. Initial DPMA stale inputs,
UPRP submission/result-shape handling, WIPO matching strategy and USPTO broad
Wordmark mode were corrected before accepting final negatives. Failed or
unsubmitted searches are explicitly not zero results. The P0 review is complete
with those limits; no legal clearance, registration or publication approval
was inferred. No gameplay regression or screenshot capture was relevant to
this research/documentation-only change.

The focused documentation/evidence audit passed **66 local links and 18
heading targets**, ordered flow entries 1–38, JSON parsing and five-core-input
coverage in all five completed registers. It confirmed 36 negatives, six
controls and three separately retained broad observations, with unavailable
counts left null. Four existing working documents changed and two evidence
files were added; the other 64 existing files remained unchanged, including
game code/assets/licences, the earlier structured audit, root README and
other projects. No full-page copies or temporary paths were included in the
new public audit.

## Game-panel fullscreen — 2026-10-10

Codex implemented native fullscreen for the game panel, HUD, touch controls
and credits, with a visible exit button and complete-scene letterboxing.
The focused Chrome 155.0.8059.39/CDP checks completed **37 native-flow assertions** and
**205 layout/API-failure assertions**. Reproduce the complete focused set:

```sh
python3 -B 02-wandmoss-journey/tests/fullscreen_check.py
```

The native flow checked click and keyboard-Space activation, Escape,
exit-button and externally initiated exit, page-scroll restoration, pause
and the appropriate pause hint, credits/focus, a resumable version-one save,
and unchanged serialized gameplay, storage bytes/write calls, enabled sound,
music volume and media instances during toggles. One actual local recording
was loaded and playing for the audio-preservation checks.

The remaining checks used 1440×900, 390×844, 320×740 and 844×390 viewports with
English, German and Polish. They checked visible HUD/exit/touch controls,
the complete canvas's original 16:9 simulation bounds with `object-fit:
contain`, internally scrollable opening/pause/victory cards, story transitions,
earned boss health/prompt/retry controls, credits and native resized touch
movement/casting/cancellation. Unavailable and rejected API fixtures checked
translated feedback, state/storage/audio preservation and recovery, including
repeated rejection during play and restoration of the real native API.

An early check read the button before the browser's fullscreenchange event;
Codex corrected the harness to await synchronized native/UI state. The native
credits test exposed Chrome consuming Escape without delivering a DOM keydown
or cancelling the modal. Codex made every fullscreen exit close open credits
without resuming play. A later harness assertion assumed an instant stop
after touch cancellation; the existing physics decelerates instead. Codex
allowed that deceleration and reran only the remaining layout/API-failure
checks, retaining the passed native flow. No JavaScript or resource-loading
errors occurred in those completed checks. No screenshots were captured.

These are isolated local Chrome checks and state fixtures, not a new full
campaign playthrough or listening assessment. Other browser engines, the
WebKit fallback, physical devices and GitHub Pages were not tested. The
owner reported that all personal tests passed before Codex closed this
interrupted check record during README preparation. No device/browser details
were supplied; that feedback is attributed separately in
[flow entry 41](DEVELOPMENT_FLOW.md#41-accept-my-tests-and-prepare-a-minimal-publication-readme).

## Minimal publication README and retained screenshot — 2026-10-10

After the owner's positive testing report, Codex prepared the minimal README
and recorded the first-PR release boundary. The existing README was copied
byte-for-byte to `docs/README_BACKUP.md`: **17,635 bytes**, SHA-256
`c1f6a1ad7808c2c348931d24823182253c836cae004850a9ea8795028ab9e9af`.
The archive deliberately retains relative link strings from its original
top-level location; it is not the current navigation document.

The new English README contains the product description, a local SVG Play
button, one gameplay screenshot, essential controls and local opening
instructions, supported languages/touch/sound/fullscreen information and the
MIT/CC BY 4.0 distinction. It has no further-documentation links. Complete
music credits remain accessible in the unchanged game.

The owner explicitly requested one new screenshot. Codex captured the game
panel once: `docs/screenshots/wandmoss-journey-dusk.png`, **1154×874 pixels**,
**763,580 bytes**. A temporary local Chrome profile used the chapter-two
fixture and actual movement, jumping and casting; the capture showed the
English Dusk Trail HUD, three hearts and unobstructed gameplay. Codex inspected
the PNG visually. This is a presentation image, not campaign-completion
evidence. No additional screenshots were made.

The prepared Play URL follows the repository's existing Pages path pattern:
`https://j-kepka.github.io/vibe-coding-playground/02-wandmoss-journey/`.
A read-only HTTP check returned **404** before publication. Initial web access
failed and sandboxed curl could not resolve the host; the HTTP observation
comes from the successful approved read-only request. The link will become
available when the game is deployed. No PR or deployment was performed.

Codex's checks confirmed the exact backup, README asset paths, SVG XML, PNG
dimensions and sole screenshot, and the absence of narrative-documentation
links. The focused document/scope audit also checked the working-record order
and local links in the edited current documents; archive links retain their
original source location. Game code, recordings and licenses were unchanged
in this README iteration. Publication and full hosted-game testing remain
backlog tasks.

After the limit reset, Codex checked the retained artifacts directly: the
20-line README, exact archive checksum, valid SVG and sole PNG passed. The
final audit passed **71 local links and 23 heading targets** across the five
edited current documents, with flow entries ordered **1–43** and valid Python
fullscreen-harness syntax. Temporary logs from the earlier run were no longer
available; observed results are retained in this record and the conversation.
The resumed work changed only working documentation inside this project;
the game, audio, license files, screenshots, root README, shared methodology
and other projects remained unchanged. Passed gameplay checks were not repeated.

## Owner-reported hosted playthrough — 2026-10-10

The owner reported that the first publication PR had been merged and the
whole game tested on GitHub Pages. Local main contains merge commit
`96bc9a9` for **PR #2**, including playable-release commit `def567b`.
The hosted game is at
[Wandmoss Journey](https://j-kepka.github.io/vibe-coding-playground/02-wandmoss-journey/).

This is the owner's full-game playthrough report. No device/browser details,
separate language/settings checklist or new automated hosted result was
supplied. The owner then reported an intermittent snap back while walking
off fallen logs, confirmed in the final chapter; that later finding is
preserved in [flow entry 52](DEVELOPMENT_FLOW.md#52-investigate-an-intermittent-snap-back-at-the-edge-of-fallen-logs).
The original release/playthrough milestone remains recorded, with correction
and review tracked separately. The owner chose a fresh thread for the
remaining documentation alignment and second PR.

## Fallen-log edge collision — 2026-10-10

Codex reproduced the owner's intermittent final-chapter report in the
original committed engine. On the first solid log (x=510–630), two 1/120-second
steps from x=628.5 at a slow rightward speed produced x=629.097222, then x=480,
with three hearts and no respawn. The one-pixel landing inset lost support
early; the next horizontal pass treated shallow top overlap as a side hit.
The correction keeps support for any positive horizontal overlap and resolves
a solid side only when the move crosses that face.

The local Chrome 155.0.8059.39 checks passed **355 focused collision scenarios**
in nine groups, **26 existing gameplay/campaign integration groups** and
**eight native keyboard/touch edge walks**, without JavaScript or resource
errors. Run from the repository root:

```sh
python3 -B 02-wandmoss-journey/tests/log_edge_check.py
```

The focused matrix covers all ten solid logs in chapters one, two and four:
both ends, fractional support, slow walking at 120/60 Hz, braking and resuming,
shallow landings, exact separation, normal/rocket edge jumps and coyote time.
It also checks solid side/underside blocking and one-way mushroom, stone,
log and cloud platforms. Native keyboard and emulated mobile touch tests
walked off the actual first final-chapter log in both directions, slowly and
after braking, landing on the floor with three hearts. The corrected original
two-step case reached x=629.875 continuously and remained supported.

The retained integration checks include an input-only engine route through
all four actual maps to ten boss hits and victory, with no falls. This is
model integration, not a full browser playthrough. An initial native harness
failure assumed exactly two physics steps per rendered frame; the accumulator
can produce one, two or three. Codex corrected its movement bound to use
elapsed simulation time and completed the checks. No screenshots were captured.

These checks used isolated local Chrome profiles and collision fixtures;
other browser engines, physical devices and the hosted correction were not
tested. The fix remains local, pending the owner's independent review and
publication. The previously published build is unchanged by this iteration.

The scope audit confirmed changes only to the engine and three working
documents, plus two new focused test files; the other 70 existing files were
unchanged. Twenty local links, ordered flow entries 1–52, Python syntax and
code whitespace checks passed.

## Phone layout, fullscreen and pinch zoom — 2026-10-10

The owner reported a tiny portrait scene and an unusably wide landscape
layout in mobile Chrome, initially in the ordinary page and subsequently in
fullscreen. They also reported that the HUD occupied most of the display
and two-finger zoom had no effect. No phone model was supplied.

Codex reproduced the ordinary layout in local Chrome emulation: at 390×844
the active stage was only 228px high; at 844×390 the game panel was 715.625px
high, exceeding the viewport. The correction fits the phone panel to the
available viewport in both orientations and native fullscreen. A uniformly
scaled, following crop keeps the wizard at least 30 CSS pixels high and
fills the stage. The intrinsic canvas and simulation remain 1152×648;
neither world coordinates nor saved progress are resized.

The active phone HUD keeps essential information and controls. Save/music
settings return on pause, with the sound button always available. Two
fingers on the canvas zoom between the automatic fit and twice that scale;
the separate movement/action buttons retain multi-touch behavior. Rotation
clears held input, restores the automatic fit and aligns the normal panel.

Codex's Chrome 155.0.8059.39/CDP run passed **165 focused mobile-view checks**
with no JavaScript or resource errors. Reproduce from the repository root:

```sh
python3 -B 02-wandmoss-journey/tests/mobile_view_check.py
```

The five emulated viewports were 390×844, 320×740, 844×390, 915×412 and
844×320. Checks covered filled proportional scenes, reachable HUD and five
touch buttons, the wizard's hat/feet at world start/middle/end and rocket-jump
height, both rotation directions, and unchanged serialized gameplay/storage.
Native touch checks combined running, jumping, casting and acquired boots,
released a held control on rotation, and exercised pinch-out/in on the
ordinary portrait canvas and landscape fullscreen canvas without advancing
physics. Native fullscreen entry, rotation and exit preserved progress.
English, German and Polish pause/loss/victory cards remained bounded and
their actions reachable through internal scrolling. Normal save continuation
and desktop 16:9 rendering also passed.

An early check found 42px-wide buttons on the narrowest viewport; Codex raised
the minimum to 44px. A later native round trip exposed restoring the old
portrait scroll position after leaving fullscreen in landscape; Codex made
that return align the phone panel. Both corrections passed the completed run.
The existing fullscreen harness now expects phone cropping and opens phone
music settings from pause. Codex separately reran its **37 native desktop
fullscreen assertions**, including Escape, page position, credits and
state/storage/audio preservation; they passed without browser errors.

Seven additional phone settings/credits scenarios passed: paused autosave,
music-volume and credit controls were reachable at 320×740 and 844×320 in
all three languages; the five recording credits and close action were usable,
including inside native fullscreen. Opening/closing credits preserved pause.

No screenshots were captured. These are local Chrome emulation and native
input checks, not physical-phone testing or a new campaign playthrough.
Android browser-toolbar behavior, other browser engines and the hosted
correction await owner review. The changes remain local and unpublished.

The scope audit confirmed only the controller, styles, local instructions,
three working documents and the fullscreen harness changed, with one new
mobile harness. The other 69 existing files were unchanged. Twenty-three
local links, ordered flow entries 1–55, Python syntax and whitespace checks passed.

## Owner-reported desktop review and development closure — 2026-10-10

The owner reported checking the desktop version with a positive result and
closed gameplay development. They chose to publish the local fallen-log and
phone-layout/fullscreen/pinch corrections together with the final documentation
in the **second Wandmoss Journey publication PR**. The first publication was
GitHub PR #2; no number for the forthcoming PR was supplied.

This records the owner's general desktop feedback and scope decision. No
browser/scenario checklist, dedicated collision-test report or physical-phone
acceptance was supplied. The preceding Codex results remain attributed to
their actual local checks. Physical-phone verification and a check of the
corrected hosted release remain after publication.

Codex updated the backlog and raw prompt record for this closure. Game code,
assets and the existing test results were preserved. Documentation finalization
and the second publication PR remain open; no commit, deployment or new
gameplay/browser test was performed in this documentation-only iteration.

## Documentation alignment — 2026-10-10

**Checked by:** Codex  
**Scope:** Public narrative, current case template, navigation and preservation

Codex prepared the [development process](DEVELOPMENT_PROCESS.md), aligned the
[outcome case](../AI_TRANSFORMATION_OUTCOMES.md) with the shared template and
playbook, and updated the [project README](../README.md),
[playground README](../../README.md), local instructions and backlog.
An independent Codex review checked attribution and the distinction between
the published first release, local corrections and pending phone verification.
It also prompted a correction to the milestone summary: the temporary boss
launch preceded the later chapter selector.

Python standard-library checks passed for 171 relative Markdown/image links
and their heading anchors, the ten required case sections, ordered flow entries
1–57 and file hashes. Document whitespace checks also passed. The archived README was excluded
from current-link checks because its original relative strings are preserved.
The earlier flow and verification contents were retained as exact prefixes;
new records were appended. Hash comparison confirmed the 67 recorded game,
test, asset, historical-report, archive, Prismellow and methodology files
were unchanged.

The rewritten case remains Draft for owner review. These checks establish
documentation consistency; no gameplay/browser suite, screenshot capture,
commit or publication was performed. Earlier test results and owner feedback
retain their original implementation scope.

The owner subsequently reported learning about licensing and researching
reuse rights, and using someone else's licensed music for the first time.
Codex added that reflection to both lesson sections and the raw flow,
checking wording, the two new section links and documentation scope.
This records owner-reported learning; no license terms or game files changed.

Codex subsequently expanded the public process with six music/licensing/rights
steps, checking them against flow entries 13–17, 29–38 and the retained evidence.
An independent Codex source review confirmed their order: integration preceded
the broader audit, and title adoption preceded its official-register review.
Focused checks covered the new section's links, ordered flow entries and scope.
The extension adds historical explanation; no new rights research or gameplay
verification was performed.

Codex reviewed the unchanged outcome template/playbook again after the owner
reported eight hours of total personal effort. The updated case and process
identify it as an owner estimate including the earlier three-hour report,
while retaining an unmeasured comparison baseline and time saved. The case
also adds the optional professional-relevance section with existing evidence.
Focused content/link checks covered these additions. A subsequent read-only
metadata/usage audit matched the 19 historical rows to one parent and 18
distinct child threads. It verified cumulative increases against each last-call
counter and summed one value per thread: 66,794,562 tokens. Three omitted child
threads and the repository-wide scope prevent treating this as complete project
usage. No conversation content, credentials or private thread identifiers were
copied into the public records. Complete usage and monetary cost await additional
data; the original snapshot and shared methodology remain unchanged.

For the next supplied snapshot, Codex matched all 52 old/new rows to local
metadata and exact counters. One main thread appears twice; retaining its
latest value yields **164,921,046 repository tokens across 49 threads**
(89,463,109 main-thread tokens and 75,457,937 subagent tokens).
The two methodology rows total 466,388 separately. An independent arithmetic
review confirmed the raw row counts and expected rounding differences.
Focused checks covered aggregate arithmetic, current links and flow order.
The three previously omitted children remain absent; usage after each supplied
timestamp is excluded. These are recorded token subtotals, without a complete
project-usage, monetary-cost or quota-consumption claim. Original raw records,
shared methodology and game files were preserved.
