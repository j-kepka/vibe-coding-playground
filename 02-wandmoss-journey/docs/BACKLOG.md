# Wandmoss Journey — completion and publication backlog

**Recorded:** 2026-10-09  
**Updated:** 2026-10-13\
**Status:** Closed and published. The case study is Published; the documentation and corrections are in `main` after PR #3. I confirmed completion of corrected hosted-version and physical-phone testing, publication and project closure.

## Publication and verification closed — 2026-10-13

The second publication PR, **#3**, is merged into `main` as `f9b7d85`,
incorporating `3810d27`, the final documentation and both game corrections.
I confirmed that testing of the corrected hosted version and on a physical
phone was complete, and that the project was closed and published.

This date records my confirmation and the documentation update, rather than
the dates of the tests or merge. My completion report is separate from
Codex's earlier local technical checks. The
[earlier handoff](DEVELOPMENT_FLOW.md#63-defer-completion-until-tomorrow)
remains a historical source record; the raw development flow stays frozen.

## Gameplay development closed — 2026-10-10

I checked the desktop version and reported a positive result. I chose to
close gameplay development and publish both local corrections together with
the final documentation in the **second Wandmoss Journey publication PR**.
The first publication was GitHub PR #2; the second PR's GitHub number was not
recorded at that point. See the [closure record](DEVELOPMENT_FLOW.md#56-close-gameplay-development-and-bundle-the-corrections-with-documentation)
and the completed publication record above.

My desktop feedback at that point did not supply a browser/scenario checklist
or a physical-phone result. I subsequently confirmed the hosted and
physical-phone checks as complete in the publication closure above.

I tested the soundtrack and the adjusted movement and combat effects. I then
said we could finish the playable part and chose to preserve the lanterns and
autosave policy. I reported that the added languages were fine, then clarified
that Boss practice was a temporary testing aid just like the chapter selector
and should also be removed. I planned the remaining publication work
over the next two or three days. This is my planning window, not an effort
estimate, measured result or guaranteed completion date.

## Highest priority — P0: selected-name checks before publication

- [x] Replace **Mosslight** as the public game title with **Wandmoss Journey**.
  The earlier name audit remains a historical record: Codex verified existing
  games with the exact name on Google Play and itch.io/Steam, plus related
  game-industry names. I explicitly made this change the highest priority.
  See the
  [name and licence evidence](evidence/NAME_AND_LICENSE_REVIEW.md).
- [x] Decide the naming policy: I chose **one English game title** shared by
  the English, German and Polish interfaces, dropping separately localized
  titles. The three interface languages remain supported.
- [x] Choose the English replacement: I selected **Wandmoss Journey**.
  Codex's earlier [preliminary candidate screening](evidence/REPLACEMENT_NAME_SCREENING.md)
  compares my **Moosforest Journey** and **Moonforest Journey** proposals
  with alternatives and recommended Wandmoss Journey before my selection.
- [x] Check the selected name and specified similar spellings in relevant
  official trademark registers. Codex completed live EUIPO, WIPO, UPRP,
  DPMA and USPTO queries without identifying a concrete conflicting record
  for the completed title/root queries. See the
  [register-review evidence](evidence/WANDMOSS_TRADEMARK_REVIEW.md) for
  query scope, controls, TMview unavailability and interrupted additional
  USPTO searches. Completion of this bounded review is not legal clearance.
- [x] Update current game branding, translated metadata, README, notices and
  current references to Wandmoss Journey; preserve historical records as records
  of their time, current project paths and storage compatibility. I renamed the
  directory and removed all screenshots; new captures require a separate request.

## Next game improvement — P1: game-panel fullscreen

- [x] Add a browser fullscreen button for the game area and essential HUD/
  controls, leaving the surrounding page heading, introduction and instructions
  outside the fullscreen view. Scale the picture to the available space while
  preserving its proportions and keeping the scene/controls visible.
- [x] Escape and a visible exit control should return to the ordinary page
  view illustrated by my supplied screenshot. Handle the current Escape pause
  shortcut deliberately, preserve progress/saves/audio settings, and verify
  entry/exit, supported-browser behaviour and all three languages without
  creating screenshots.

Codex completed the [focused fullscreen checks](VERIFICATION.md#game-panel-fullscreen--2026-10-10):
37 native-flow assertions and 205 layout/API-failure assertions, closing the
interrupted check record during publication preparation. I reported that my
tests passed when requesting that preparation. The README request authorized
one new presentation screenshot; fullscreen checks themselves capture none.

I initially deferred fullscreen during the name/licence audit, then requested
its implementation in [entry 40](DEVELOPMENT_FLOW.md#40-implement-and-test-game-panel-fullscreen-before-my-review).
I subsequently reported that all my tests passed in
[entry 41](DEVELOPMENT_FLOW.md#41-accept-my-tests-and-prepare-a-minimal-publication-readme).

## Playable game

- [x] Add light footsteps while the wizard runs on a surface.
- [x] Add a small rocket sound when jumping with active rocket boots.
- [x] Add a quiet, silvery sound for normal jumps.
- [x] Add distinct enemy/boss collision and boss-charge cues alongside the
  soundtrack, respecting mute and pause. I tested the strengthened rocket and
  charge sounds after Codex's [follow-up checks](VERIFICATION.md#rocket-and-boss-charge-sound-prominence--2026-10-10).
- [x] Decide autosave frequency: keep eight lanterns, two per chapter, and the
  five persistent continuation points already in use (four chapter starts and
  the final pre-boss lantern). They overwrite one save slot; ordinary lanterns
  remain in-run respawn checkpoints.
- [x] Remove the temporary four-chapter testing selector.
- [x] Remove Boss practice from the opening and pause menus and production
  launch API. Preserve the existing save policy and boss retries after reaching
  the final lantern or fight; ignore obsolete testing saves.
- [x] Add an English-default language picker, with German and Polish, covering
  the visible and accessible interface. Store the preference separately from
  saved game progress.
- [x] Complete Codex's focused menu and language checks: [498 assertions plus
  201 separate translated-card assertions](VERIFICATION.md#final-menu-and-three-language-interface--2026-10-10).
- [x] Complete the retained gameplay, music and effects regression checks.
- [x] Independently test the languages: I reported that they were fine.
- [x] Complete Codex's [browser regression and save-compatibility checks](VERIFICATION.md#removal-of-the-boss-testing-shortcut--2026-10-10)
  after the boss-shortcut removal: 44 scenarios and 119 desktop/mobile checks,
  plus language, translated-card, music and effects checks.
- [x] Complete my remaining review of the final interface after removal of the
  boss testing shortcut, as requested in
  [entry 28](DEVELOPMENT_FLOW.md#28-remove-the-remaining-boss-testing-shortcut).
  I reported that all my tests passed before requesting publication preparation
  in entry 41; no detailed device/browser checklist was supplied.

## Process improvement — optimize iteration and verification cost

**Added:** 2026-10-10 14:16 CEST\
**Type:** Process / lessons learned

During the later development iterations, token usage and verification effort grew significantly beyond my initial expectations. As the game became more complex, even small changes could trigger increasingly expensive regression checks because of dependencies between gameplay, rendering, state, UI, audio, level progression and browser behavior.

For future projects, reconsider the development and verification strategy:

- use **targeted tests after small/local changes** instead of running the full regression suite after every iteration;
- group several low-risk changes into a small batch before performing broader integration checks;
- make verification effort proportional to the expected **blast radius** of the change;
- run broader regression tests at defined checkpoints, after significant architectural changes, and before releases;
- reserve full end-to-end verification for milestones or release candidates;
- keep lightweight development notes continuously, but update heavier documentation and outcome summaries mainly at checkpoints;
- periodically evaluate whether the cost of verification is becoming disproportionate to the value of the current iteration.

A possible default model for future projects:

`local change → targeted test → feature checkpoint → integration tests → milestone/release → full regression`

The goal is not to reduce quality assurance, but to make verification scale more efficiently as project complexity grows.

This is my supplied lesson and timestamp, not a new measured cost estimate.
Codex incorporated the strategy into the project's [local instructions](../AGENTS.md#proportional-verification).

- [x] Carry this lesson into the [development process](DEVELOPMENT_PROCESS.md)
  and [outcome case](../AI_TRANSFORMATION_OUTCOMES.md).
- [x] Apply proportional verification at the documentation publication
  checkpoint: check content, source attribution, links and release scope
  without repeating gameplay/browser suites for documentation-only changes.

**Future reuse:** Apply this strategy when setting up subsequent projects.
Shared methodology remains unchanged in this documentation iteration.

At the fullscreen/publication-README checkpoint, Codex kept checks focused on
the fullscreen interface and README/assets. After correcting a test's instant
stop assumption, only the remaining layout/API-failure checks were repeated;
the passed native/audio checks and full campaign suites were not rerun.
No new usage estimate was made.

## Publication sequence

The initial [name and asset review](evidence/NAME_AND_LICENSE_REVIEW.md) is
complete and remains a historical review of the former title. It identified
name conflicts and found no concrete missing asset licence or credit requirement.
The [selected-name register review](evidence/WANDMOSS_TRADEMARK_REVIEW.md)
is complete within its stated scope and limits. Both publication PRs are
merged, and I confirmed the corrected hosted and physical-phone tests as
complete. The earlier hosted playthrough and subsequent log-edge bug report
are recorded separately below.

1. [x] Complete the defined P0 selected-name register review before publishing.
   The current-title findings and remaining coverage limits are in the linked
   report; the earlier name/licence audit remains historical. Preserve MIT on
   original contributions and the separate CC BY 4.0 recording notices;
   recheck any later asset or licence changes.
2. [x] Publish the minimal playable version in the first GitHub PR and launch
   it on GitHub Pages. The release includes **the minimal README, all game files and
   assets, license/attribution information, bundled music, and the README's
   screenshot and Play-button asset**. PR **#2** was merged; `main`
   includes merge commit `96bc9a9` and release commit `def567b`. The remaining
   public documentation was published in **PR #3**. Keep `docs/README_BACKUP.md`
   locally and exclude it from publication, following my 2026-10-11 decision.
   **Approved exception:** I also included the already-staged corrections to
   `methodology/AI_TRANSFORMATION_OUTCOMES_TEMPLATE.md` and
   `methodology/AI_TRANSFORMATION_OUTCOMES_PLAYBOOK.md` in this first commit.
   I described them as minor corrections that should have reached GitHub earlier.
3. [x] Complete my full-game test against the deployed GitHub Pages version.
   I reported testing the whole game on 2026-10-10. This is my playthrough
   report; no browser/device details or separate language/settings checklist
   were supplied. See [the hosted-test record](VERIFICATION.md#owner-reported-hosted-playthrough--2026-10-10).
4. [x] Prepare the [development process](DEVELOPMENT_PROCESS.md) from the raw
   [development flow](DEVELOPMENT_FLOW.md) and verification evidence, align
   the [outcome case](../AI_TRANSFORMATION_OUTCOMES.md) with the current shared
   template/playbook, and make the project and root READMEs consistent.
   Codex completed the consistency/source/link review on 2026-10-11 and marked
   the case Validated at that checkpoint. Its current status is Published.
5. [x] Publish the reviewed final documentation, fallen-log collision
   correction, phone layout/fullscreen/pinch correction and their verification
   harnesses together. PR **#3** is merged into `main` as `f9b7d85`,
   incorporating `3810d27`; this completes my chosen combined release.
6. [x] Verify the corrected hosted version after publication. I confirmed
   completion in the publication and verification closure above.

The [development flow](DEVELOPMENT_FLOW.md#18-record-positive-testing-feedback-next-session-work-and-raw-usage)
preserves my reported time and the supplied raw usage snapshot for the final
summary. The [earlier two-stage plan](DEVELOPMENT_FLOW.md#24-finish-the-playable-interface-and-plan-publication-in-two-stages)
and [development closure](DEVELOPMENT_FLOW.md#56-close-gameplay-development-and-bundle-the-corrections-with-documentation)
record the planned publication sequence and scope of the second release,
now completed.

## Post-release issue — P1: walking off fallen logs

- [x] Correct the intermittent snap back to the beginning of a log when
  walking off its far edge. I confirmed it in chapter four and did not know
  whether other chapters were affected. Codex reproduced it in the committed
  engine and verified the local correction across all ten solid logs in
  chapters one, two and four, including both directions and slow/braking
  movement. See the [focused verification](VERIFICATION.md#fallen-log-edge-collision--2026-10-10).
- [x] Close the development iteration following my positive desktop feedback
  and decision to finish gameplay development. I did not report a separate
  detailed fallen-log test checklist.
- [x] Publish the correction with documentation in PR #3 and verify the
  updated hosted build. Publication is complete, and I confirmed the corrected
  hosted-version tests as complete in the closure above.

## Post-release issue — P1: readable phone play

- [x] Correct the small portrait scene and overflowing landscape layout in
  mobile Chrome, including fullscreen, a compact active HUD and two-finger
  canvas zoom. Codex's local checks passed; see the
  [verification record](VERIFICATION.md#phone-layout-fullscreen-and-pinch-zoom--2026-10-10).
- [x] Accept the iteration for the second publication PR after my positive
  desktop review and decision to close gameplay development.
- [x] Complete my physical-phone review after publishing the correction with
  documentation in PR #3. I confirmed completion in the closure above;
  this is separate from the earlier desktop feedback and Codex's local checks.

## Documentation alignment

I requested this work in a fresh thread. Codex prepared the concise
[process account](DEVELOPMENT_PROCESS.md), aligned the
[outcome case](../AI_TRANSFORMATION_OUTCOMES.md), and updated the
[project README](../README.md) and [playground README](../../README.md).
The frozen raw flow, historical reports and existing screenshot remain
public source material. The archived README stays local and was excluded
from PR #3. The shared methodology was used without modification.

- [x] Complete the public documentation and validate its consistency, source
  attribution, local links and limitations; publish the case in PR #3.
- [x] Exclude the local README backup and Python cache files from publication.
- [x] Remove the unused Play-button SVG; its deletion was included in PR #3.

I confirmed publication, corrected hosted-build and physical-phone
verification, and project closure as complete. No release tasks remain open.
