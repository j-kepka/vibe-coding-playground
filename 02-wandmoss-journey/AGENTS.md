# Working on Wandmoss Journey

- Read this file and `README.md` before modifying the project; the root instructions also apply.
- Gameplay development was closed by the owner on 2026-10-10. Documentation and the collision and phone-view corrections were published through PR #3; the owner confirmed completion of corrected hosted-version and physical-phone testing, publication and project closure. The owner authorizes project documentation and repository-root `README.md` alignment. Keep other projects and shared methodology unchanged.
- Keep the original fairy-tale dwarf wizard with a smoking wand and the four-chapter campaign: forest, harder dusk forest, bright clouds with manually activated rocket boots, and a ground finale with a charging boss requiring ten spell hits.
- C is the primary rocket-boot shortcut; E/K remain compatible aliases. Boots last 30 seconds, followed by 15 seconds of recovery. The wand casts at most once per second. After the tenth boss hit, show the 2.2-second kneeling and face-down fall before victory; pause must freeze this sequence and retries must reset it without duplicating rewards.
- Use plain HTML, CSS and JavaScript with Canvas 2D. Keep the game usable by opening `index.html` directly, without a build, network connection or dependencies.
- Keep the bundled Kevin MacLeod recordings and their supplied metadata unchanged unless an audio edit is requested. Original code and artwork use MIT; the recordings use CC BY 4.0. Preserve `THIRD_PARTY_NOTICES.md`, the offline license and accessible in-game credits when redistributing them, and document any later audio edits. Sound starts off, with music and effects enabled by the sound button; stop playback on pause, loss or hiding the tab.
- Keep synthesized movement and combat effects subtle alongside the soundtrack. Footsteps follow actual grounded travel, boosted jumps have their own rocket sound, and accepted enemy/boss contacts and the start of each boss charge have distinct cues. Mute, pause, credits, hiding the tab and retries must cancel active and scheduled effects without replaying them on return. The music slider controls recordings separately from effects.
- Keep physics separate from rendering. Draw original scenery in code; do not copy other games' characters, maps or assets.
- Keep the sky background bright with static cloud shapes and camera-only parallax. Do not reintroduce the translucent floating islands and trees that the owner reported as unwanted shadow shapes.
- Distinguish walkable cloud platforms from background clouds: use softer blue distant scenery and opaque brighter platforms with an outlined landing ridge and deeper underside. The ridge must match the physical landing height.
- The game interface supports English (the default), German and Polish through a native language picker. Persist the chosen language separately from the autosave slot; changing language must preserve gameplay, progress, sound state and saves. Translate static and dynamic interface text, canvas labels, accessibility labels and music-credit descriptions; preserve proper recording titles, author names and license links. Public documentation is English.
- Native fullscreen targets the game panel, essential HUD, touch controls and music-credit dialog, keeping the surrounding page outside it. Preserve scene proportions and keep the exit control reachable. Desktop fullscreen shows the complete scene; phone fullscreen uses the readable following crop requested by the owner. Escape leaves fullscreen without toggling pause; P still pauses. Leaving fullscreen closes an open credits dialog while preserving its paused game state, including when the browser consumes Escape before the dialog can handle it. Entry/exit must preserve progress, saves and audio settings. Restore the ordinary page position, aligning the phone panel when its orientation changed during fullscreen. Unsupported fullscreen leaves the normal game usable.
- Fit phone play to the current viewport in portrait and landscape, including landscape widths above 600px. Keep the wizard at least 30 CSS pixels high with a proportional following window into the original scene; preserve engine coordinates, camera state, saves and desktop rendering. Keep essential HUD and all five touch controls visible. During active phone play, move auxiliary save/music/progress rows out of the scene; retain the sound button and make settings and license credits accessible on pause. Two fingers on the canvas zoom the view from its automatic fit up to twice that scale; movement/action buttons keep independent multi-touch behavior. Rotation clears held input and refits the view.
- Use **Wandmoss Journey**, the English public game title selected by the owner on 2026-10-10, across all three interface languages. Use the current `02-wandmoss-journey/` directory. Preserve historical names and paths in earlier development records and keep the original storage keys for save/preference compatibility.
- The temporary chapter selector and Boss practice shortcut are removed for the final playable iteration. Do not reintroduce direct chapter or boss launch controls without an owner request. Preserve boss retries after the player reaches the final lantern or begins the fight. Ignore legacy `practice: true` testing saves while preserving normal version-one campaign saves.
- Preserve the owner's chosen checkpoint and autosave policy: eight lanterns, two per chapter, and five persistent continuation points (four chapter starts and the last lantern before the boss), overwriting one save slot. Ordinary lanterns remain in-run respawn checkpoints.
- Select verification scope from the affected behaviour and its dependencies, following the strategy below. Record actual checks and limitations in `docs/VERIFICATION.md`; do not report untouched behaviour as newly verified.
- The owner performs independent verification and tests after every development iteration and Codex's checks. Present the checked iteration for that review; record specific findings or acceptance when the owner reports them. Distinguish this reported workflow from the results of individual tests.
- The owner previously selected four product-presentation screenshots and an English README view, then removed all screenshots while renaming the project directory on 2026-10-10. Do not recreate them or capture new screenshots without an explicit request. Browser checks must not capture or write screenshot files, including temporary ones; in-memory renderer pixel checks remain available. Mark old image references in historical reports as removed while preserving their original filenames. The earlier one-time English screenshot request does not authorize replacement captures now.
- The owner subsequently requested one new English Chapter 2 screenshot for the minimal publication README on 2026-10-10. Retain `docs/screenshots/wandmoss-journey-dusk.png`; that request authorizes this single capture, not additional presentation or test screenshots. The owner requests a concise README following Prismellow's convention: first-person motivation, the existing screenshot, Play, essential controls/run information, separate license types, and links to the prepared process and outcome documents. `docs/README_BACKUP.md` is a byte-for-byte archive of the previous top-level README: preserve it as a historical source copy, including its original relative link strings. Keep this archive local; it was excluded from PR #3 as requested on 2026-10-11.

## Proportional verification

Apply the owner's [iteration-cost lesson](docs/BACKLOG.md#process-improvement--optimize-iteration-and-verification-cost), supplied on 2026-10-10:

`local change → targeted test → feature checkpoint → integration tests → milestone/release → full regression`

- After a small or local change, check the affected behaviour and relevant dependencies. For documentation-only changes, check the edited content, links and scope; do not run gameplay or browser suites without a relevant reason.
- Group compatible low-risk changes into a small batch before broader integration checks. Choose the batch and checks according to the expected blast radius across gameplay, rendering, state, UI, audio, progression and browser behaviour.
- Run integration checks at feature checkpoints. Broaden regression checks after significant architectural changes, at defined milestones and before releases; reserve full end-to-end verification for milestones and release candidates. New failures or unresolved cross-system effects can justify broader checks sooner.
- Full campaign coverage includes movement, jumping, magic, hazards, checkpoint respawn, pause, completion, all chapter transitions, manual rocket-boot activation and timers, preservation of an active boost at lanterns, boss charge cues and exactly ten accepted spell hits before victory. Use the relevant subset for focused changes rather than repeating this entire coverage after every iteration.
- Once appropriate checks pass, broaden or repeat them only when new changes, failures or unresolved concerns justify the cost. Periodically compare verification effort with the value and risk of the iteration; record an observed cost concern without inventing measurements.
- Keep lightweight development notes continuous. Consolidate heavier documentation and outcome summaries at checkpoints, respecting the finalization timing below. Preserve the owner's independent review after each development iteration.

## Documentation lifecycle

### `docs/DEVELOPMENT_FLOW.md`

The owner froze this raw source record on 2026-10-11. Do not append prompts,
audit notes or publication updates, and do not rewrite existing entries.
Preserve the historical source records as recorded. The rules below describe
the completed active-development phase and do not override this freeze.

- Append subsequent user project prompts and clarifications in conversation order. Translate Polish prompts into clear English when appropriate and correct spelling and obvious typos without changing meaning. Label edited translations and retrospective entries honestly.
- Record how Codex understood each request. Distinguish the owner's requirements, observations and decisions from Codex's replies, implementation decisions and checks.
- Retain relevant user test observations, important development context, rejected or changed approaches, corrections and temporary development or testing decisions. Keep pending entries' implementation and verification summaries current when work is completed; link to technical evidence in `docs/VERIFICATION.md`.
- If the owner explicitly excludes a particular request from the prompt log, omit that request and its paraphrase. The exception applies only to the specified request; resume logging with the next eligible project prompt.

### `docs/DEVELOPMENT_PROCESS.md`

Create this polished public development-process document near the end of development, using `docs/DEVELOPMENT_FLOW.md` and other available project evidence. Do not maintain it as the live chronological log during active development.

The owner requested this document and the outcome-case alignment on 2026-10-10; the earlier preparation deferral is complete. Keep the public narrative separate from the raw flow and link the README, process, outcomes and verification consistently.

Summarize important iterations, evolving requirements, human decisions and AI steering. Describe meaningful problems, corrections and trade-offs. Include representative prompts where useful, connecting each with its context, implementation and outcome. Keep the account concise and readable rather than reproducing the entire raw flow.

### `docs/VERIFICATION.md`

Maintain technical verification evidence separately from the narrative development history. Record what Codex tested, how it was tested, relevant environments and scenarios, results, limitations and retained evidence. Attribute Codex's checks and the owner's feedback separately, and preserve earlier verification reports as historical records.

### `AI_TRANSFORMATION_OUTCOMES.md`

Prepare or finalize this top-level document near the end of the project as a concise, outcome-oriented case study. Before creating or finalizing it, locate and read the current outcome template in `../methodology/` and apply its actual structure rather than recreating it from memory. The current files are the [template](../methodology/AI_TRANSFORMATION_OUTCOMES_TEMPLATE.md) and [playbook](../methodology/AI_TRANSFORMATION_OUTCOMES_PLAYBOOK.md); keep shared methodology read-only during development.

Summarize the problem or motivation, requirements and constraints, intervention, important human decisions and AI steering, measurable or observable outcomes, evidence and limitations, lessons learned and professional relevance where applicable. Attribute evidence to the correct implementation and completed iteration. Keep unmeasured outcomes and pending owner review explicit. Use the flow and process documents as sources rather than duplicating them.

The flow supplies chronological source material during development; the process document reconstructs the development publicly near its end. Verification supplies technical evidence, and the outcome case provides the final concise synthesis.
