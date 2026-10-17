# Wandmoss Journey — development flow

**Development dates:** 2026-10-09 to 2026-10-11  
**Purpose:** chronological working record of the product decisions, human feedback, AI implementation choices and meaningful verification that shaped Wandmoss Journey.

> This is a cleaned public version of the live development journal. It preserves the meaningful product history while omitting routine status questions, usage-limit resumptions, Git-navigation help, repeated test-count detail and raw usage telemetry. Detailed technical evidence remains in `docs/VERIFICATION.md`; the shorter narrative interpretation remains in `docs/DEVELOPMENT_PROCESS.md`.

The original requests were mostly written in Polish. They are represented here as edited English translations that preserve the intended meaning rather than verbatim quotations.

---

## 1. Initial game request

**My request:**

> Create a game similar to Super Mario Bros. as the next subproject, with just one level. Use textures with a more fairy-tale feel than Super Mario Bros. The character I control should be a fairy-tale dwarf wizard with a smoking wand. Choose the simplest technology stack that still makes the game look good and play well.

**Implementation direction:** Codex created the first version in plain HTML, CSS and JavaScript with Canvas 2D. The initial forest level included the wizard, wand spells, scrolling, enemies, hearts, lantern checkpoints, pause/restart, touch controls and a moon-gate finish.

**Verification:** Initial browser and gameplay checks covered the route to the finish, desktop input and simulated touch input. Corrections found during verification were recorded separately in the retained technical evidence.

---

## 2. Scope expansion from one level to a four-chapter adventure

**My request:**

> Expand the game into four levels. The second should be a darker continuation of the forest. The third should take place in the sky, with cloud platforms, a temporary rocket-boots artifact and small phoenix-like enemies. The final chapter should return to the ground and end with a raid-style boss that takes ten successful shots to defeat.

I also wanted the rocket boots to be activated manually rather than immediately on pickup, and the boss encounter to reward learning predictable charges rather than brute-force damage.

**Implementation:** The original forest became chapter one. Codex added:

- a dusk chapter;
- a sky chapter;
- rocket boots with a timed boost and cooldown;
- cloud enemies;
- automatic chapter transitions;
- a final ground chapter;
- a ten-hit boss encounter;
- an ending screen.

The implementation also added a lantern before the boss to restore hearts and boot readiness.

**Outcome:** This was the first major scope change: the project moved from a one-level experiment to a complete short campaign.

---

## 3. Human verification became a permanent part of the workflow

I explicitly established that I would test each meaningful iteration after Codex completed its own checks.

The working loop became:

```text
human request
→ AI implementation
→ targeted / automated verification
→ human playtest
→ feedback
→ correction
→ human acceptance
```

Specific observations and acceptance were recorded when I supplied them rather than inferred from automated PASS results.

---

## 4. Cloud-scene problem, boss testability and temporary development aids

During my playtest I reported two problems:

- distant clouds appeared to shake;
- repeatedly reaching the boss was too expensive for balancing work.

I asked for stable scenery and a way to return to important test points without replaying the full campaign every time.

**Implementation:** Codex stabilized the background clouds using fixed scenery with camera parallax, corrected a boss-hit interaction, and added local continuation saves. Temporary testing conveniences included quicker access to chapters and the boss while balancing was still active.

**Why this mattered:** The iteration separated two concerns:

1. the final player experience;
2. temporary development tooling needed to test that experience efficiently.

Those testing shortcuts were deliberately revisited before release.

---

## 5. Boss balance, controls and defeat sequence

After defeating the boss several times, I requested three changes:

- move the rocket-boots primary shortcut to `C`;
- increase the wand cooldown so repeated casting cannot trivialize the boss;
- add a short death animation before the victory screen.

**Implementation:** The boots retained their timed boost/recovery behavior, `C` became the primary shortcut, the wand cooldown was increased to one second and the boss received a kneel/fall sequence before victory.

**Human feedback:** I could repeatedly complete the encounter, so the problem shifted from basic solvability to pacing and presentation.

---

## 6. Human visual review of the sky chapter

A later playtest revealed three shadow-like shapes in the sky chapter. I supplied an annotated screenshot and also reported that the background clouds blended too much with the walkable cloud platforms.

**Diagnosis:** Codex traced the unwanted shapes to translucent decorative floating islands whose triangular bases read as shadows.

**Correction:**

- the misleading decorations were removed;
- distant clouds were softened and reduced in opacity;
- playable clouds received stronger visual separation.

This was a useful example of a problem that was technically valid in the renderer but visually wrong to a human player.

---

## 7. Temporary chapter selector for faster testing

To accelerate iteration, I requested a chapter selector on the opening screen so individual sections could be tested without completing the preceding campaign.

Codex implemented fresh chapter starts with appropriate state and preserved the normal progression when continuing forward.

This remained explicitly a **testing aid**, not a final game feature.

---

## 8. Music research, licensing and integration

Before adding music, I asked Codex to suggest fuller-sounding tracks that suited the game and could be used without violating copyright requirements.

The selected candidates were Kevin MacLeod recordings from Incompetech:

- `Fairytale Waltz` — menu/main theme;
- `Folk Round` — forest;
- `Evening Fall (Harp)` — dusk;
- `Enchanted Journey` — sky;
- `Call to Adventure` — boss.

Before integration I specifically asked whether their licensing was compatible with the MIT license used for my original code.

**Licensing decision:** The recordings are separately licensed under CC BY 4.0. The project code and original artwork can remain MIT while the third-party recordings retain their own license, attribution and notices. The music must not be represented as MIT-licensed.

**Implementation:** Codex bundled the selected recordings locally, added scene-aware playback and music controls, and exposed attribution through the game and third-party notices.

**Lesson:** This was my first project in which I intentionally integrated someone else's creative work under a separate license, so licensing and rights research became a first-class part of the development process rather than an afterthought.

---

## 9. Positive review and audio-feedback backlog

After testing the music build, I reported that the game looked great and the soundtrack worked well.

I then requested several subtle sound effects for a later iteration:

- footsteps;
- normal jump;
- rocket-boot jump;
- enemy collision;
- boss collision;
- boss charge.

I also noted that the temporary testing interfaces and autosave policy needed a final release review before publication.

---

## 10. Documentation lifecycle was separated into evidence layers

During development I changed the documentation model so that one file would not try to serve every audience.

The roles became:

### `docs/DEVELOPMENT_FLOW.md`

Chronological working history containing meaningful prompts, changes in requirements, human observations, AI decisions, corrections and temporary development choices.

### `docs/DEVELOPMENT_PROCESS.md`

A shorter public reconstruction created near the end. It explains the important iterations, steering decisions, problems and trade-offs without copying the full flow.

### `docs/VERIFICATION.md`

Technical evidence: what was tested, how it was tested, environments, scenarios, results and limitations.

### `AI_TRANSFORMATION_OUTCOMES.md`

A concise outcome-oriented synthesis using the repository methodology template.

The governing rule became:

> Capture during development; curate after the work is understood.

---

## 11. Movement and combat sound effects, followed by human listening feedback

Codex added synthesized movement and combat cues for footsteps, normal jumps, boosted jumps, collisions and boss charges.

My next listening test found that the rocket-boot and boss-charge cues were difficult to hear against the soundtrack. I was not sure whether they were missing or merely masked.

**Diagnosis:** The triggers worked in Codex's reproduction, but the original sounds were short and concentrated in frequencies that were easy for the music to mask.

**Correction:** Codex increased the prominence of only those two cues and adjusted their frequency content and duration while preserving the rest of the sound balance.

**Result:** This iteration demonstrated a useful limitation of automated audio checks: a signal can technically exist and still fail perceptually in the actual mix. Human listening remained necessary.

---

## 12. Final playable-interface decisions

After confirming the adjusted sounds, I decided the playable game was close to complete.

I kept the existing lantern and autosave behavior, removed the temporary chapter selector and requested a three-language interface:

- English as the first-visit default;
- German;
- Polish.

Language switching was required to leave gameplay state, saves, equipment and audio state untouched.

Codex implemented the localized interface and preserved the existing campaign behavior.

---

## 13. Remove the remaining boss testing shortcut

During my language review I noticed that **Boss practice** was still available from the beginning.

I clarified that I had considered it a testing shortcut, just like the chapter selector, and did not want it in the public campaign.

**Correction:** Codex removed the direct boss-launch interface, practice-only behavior and obsolete translations while preserving legitimate campaign saves and the earned pre-boss continuation point.

**Product decision:** Testing aids were useful during development but were not allowed to leak into the final player experience without an explicit reason.

---

## 14. Pre-publication rights and name audit

Before publication I asked for a broader review of:

- the game names then in use;
- code;
- graphics;
- music;
- localized title variants;
- attribution and licensing requirements.

The audit found existing public uses close enough to the working title that I decided renaming should be treated as a publication blocker.

The same audit confirmed the intended split between original MIT-licensed project material and separately licensed CC BY 4.0 music, with the detailed evidence and search limitations recorded separately.

**Important limitation:** The research was a bounded risk review, not a worldwide legal clearance or a legal opinion.

---

## 15. Verification cost was made proportional to blast radius

Later iterations showed that repeatedly running broad regressions after small changes consumed disproportionate time and AI usage.

I therefore changed the development rule to:

```text
small/local change
→ targeted checks

feature checkpoint
→ integration checks

important milestone
→ broader regression

release candidate
→ full end-to-end verification
```

Human review after meaningful iterations remained mandatory.

This became one of the main process lessons from the project: **verification effort should scale with the expected blast radius of the change.**

---

## 16. Replacement-title research and adoption of Wandmoss Journey

I decided that all three interface languages should share one English title.

My first candidates included `Moosforest Journey` and `Moonforest Journey`. Codex screened those names and related variants, found existing uses around `Moon Forest`, and proposed alternatives.

`Wandmoss Journey` emerged as the preferred candidate.

I selected it and authorized a project-wide branding change.

**Implementation:** Codex updated current runtime branding, localized text, accessibility names, current documentation and test references while retaining historical names inside historical evidence where they accurately described earlier states.

The project directory was also moved to:

```text
02-wandmoss-journey/
```

Existing save/storage identifiers were intentionally retained where changing them would have broken compatibility.

---

## 17. Official-register review of the selected title

Before publication Codex performed a bounded search for `Wandmoss Journey`, the distinctive `Wandmoss` root and related spacing/spelling variants through the available official interfaces for:

- EUIPO;
- UPRP;
- DPMA;
- USPTO;
- WIPO.

Completed target searches returned no matching core title/root results in the checked scope. Known-mark controls were used where possible to confirm that the search interfaces were returning results.

Some additional search paths were unavailable or interrupted, including TMview and some USPTO expansions. Those limitations were retained in the evidence rather than converted into unsupported negative claims.

**Decision:** The defined review was sufficient to continue with the chosen title, while explicitly not claiming worldwide legal clearance.

---

## 18. Game-panel fullscreen

I asked for a fullscreen mode focused on the game panel rather than the surrounding page.

Requirements included:

- preserve the game aspect ratio;
- keep essential HUD and controls usable;
- allow a visible exit;
- allow Escape to return to the normal page;
- preserve game state.

Codex implemented native fullscreen with letterboxing and responsive handling. Browser verification found an Escape/dialog interaction that required correction.

I then completed my own tests and reported that they were good.

---

## 19. Minimal playable release and two-stage publication plan

For the first public release I deliberately wanted a small README instead of duplicating the process documentation.

The first publication package was limited to the playable product:

- game files;
- minimal README;
- one gameplay screenshot;
- Play link;
- license information;
- bundled music and its notices.

The deeper process, evidence and outcome documentation was reserved for a second publication stage.

This created a clear release boundary:

```text
PR 1
→ playable product
→ GitHub Pages deployment
→ hosted-game test

PR 2
→ remaining fixes
→ process/evidence/outcome documentation
→ project closure
```

---

## 20. First release merged and tested on GitHub Pages

I reported that the playable-release PR had been merged and that I had completed the full game on GitHub Pages.

This was an important milestone because the project was no longer being tested only in the local development environment.

The hosted playthrough was treated as human acceptance of the deployed product, not as a substitute for automated browser evidence.

---

## 21. Fallen-log collision bug found after hosted playthrough

After the hosted release I noticed an intermittent problem: when walking to the end of a fallen log, the character could snap back toward the beginning.

Codex reproduced the behavior in the collision rules. The horizontal collision pass could interpret the character's feet overlapping the top of the log as a side collision at the edge.

**Correction:** Horizontal resolution was changed to require crossing the corresponding side, while top support used the full platform width.

Focused regression covered the solid logs and related movement behavior.

**Why this matters:** The game had already passed substantial automated testing and a hosted playthrough, yet another human observation still exposed a subtle physical edge case.

---

## 22. Mobile layout, fullscreen and pinch-zoom refinement

I then reported several problems from mobile Chrome:

1. portrait mode fitted the complete scene to the narrow width, making the game too small;
2. landscape became too wide to read comfortably;
3. fullscreen still did not use the available phone space well;
4. the interface occupied too much screen area;
5. two-finger zoom was not available.

Codex progressively corrected the mobile presentation:

- phone views use a proportional crop that follows the wizard;
- the game prioritizes useful viewport height rather than shrinking the entire desktop scene;
- phone fullscreen uses the same readable scene strategy;
- the active mobile HUD was reduced to essential information;
- two-finger gestures adjust the view scale;
- movement/action touches remain independent from the zoom gesture.

A fullscreen/rotation test also exposed stale scroll restoration after leaving fullscreen in another orientation, which was corrected.

This group of changes was treated as one mobile-UX refinement arc rather than separate product features.

---

## 23. Gameplay closure

After checking the desktop version I reported it as good and closed gameplay development.

The remaining local corrections—especially fallen-log collision and mobile layout/fullscreen/pinch behavior—were assigned to the second publication PR together with the final documentation.

At this point:

> no new gameplay features were planned; remaining work was correction, publication and documentation.

Physical-phone verification of the corrected hosted build remained a post-publication check.

---

## 24. Final public documentation

I asked Codex to align the final documentation with the repository methodology and with the style already used by another completed playground project.

Codex used the retained development flow and evidence to prepare:

- `docs/DEVELOPMENT_PROCESS.md`;
- the project README;
- the outcome case;
- links between the relevant documents.

I then requested that the public process explain the music/licensing and rights-research sequence more clearly, because it was a meaningful part of what I learned from the project.

The resulting public process therefore emphasizes not only implementation, but also:

- human steering;
- test-driven corrections;
- temporary versus final product decisions;
- licensing;
- name-risk research;
- proportional verification.

---

## 25. Human effort and AI-usage measurement

I estimated my own work on the project at **about eight hours total** up to the documentation stage.

During development I also collected AI token-usage snapshots to understand the cost of the workflow. Those raw rows and counter-reconciliation details were useful during analysis but are intentionally not reproduced in this cleaned public flow.

The measurement was treated conservatively:

- thread counters are cumulative;
- repeated snapshots of the same thread must not be added as independent usage;
- input/output totals already include categories that must not be added again;
- repository-level usage snapshots do not automatically equal project-specific cost;
- no monetary cost, time saving or productivity multiplier was inferred solely from token counts.

The practical lesson was more important than the raw telemetry: later iterations motivated the move toward targeted verification proportional to change risk.

---

## 26. Finalization handoff

The remaining work was moved to the project-finalization branch and intentionally kept separate from new feature development.

The final handoff consisted of:

- review the finished documentation;
- commit/publish the agreed corrections;
- complete the second publication PR;
- verify the corrected hosted version on a physical phone;
- close the project after final acceptance.

No further feature expansion was required.

---

# What this flow is intended to show

The project did not progress as a single successful generation.

It evolved through repeated interaction between:

```text
human intent
→ AI implementation
→ technical verification
→ human observation
→ correction
→ acceptance
```

The most important examples were:

- expanding the original one-level concept into a four-chapter campaign;
- using temporary testing aids and later removing them from the product;
- correcting visual problems found by human review;
- tuning a boss through repeated play;
- discovering that technically present audio cues were perceptually too weak;
- treating third-party music licensing as an engineering requirement;
- renaming the project after a pre-publication rights review;
- changing the verification strategy after observing excessive regression cost;
- finding a subtle collision issue after publication;
- refining mobile usability from physical-use feedback rather than desktop assumptions.

For detailed test methods and results, see `docs/VERIFICATION.md`.

For the shorter curated account of the development approach and lessons, see `docs/DEVELOPMENT_PROCESS.md`.

For the final outcome-oriented case study, see `AI_TRANSFORMATION_OUTCOMES.md`.
