# Wandmoss Journey — development process

I wanted a small fairy-tale platformer with a dwarf wizard and a smoking wand.
I asked Codex for one level and a simple technology stack, then expanded and
refined the game through playable iterations. My testing shaped the campaign,
balance, scenery, sound and final interface.

This is a retrospective reconstruction from the [development flow](DEVELOPMENT_FLOW.md)
and retained verification records. The flow preserves edited English translations
of my Polish requests, with the first two entries recorded retrospectively.
The requests below are concise paraphrases, not verbatim quotations.

## The working loop

**Describe a change → Codex implements and checks it → I play the game → give
feedback → refine or choose the next change.**

I explicitly made my independent review part of every development iteration.
Codex handled implementation and technical checks; I chose the creative
direction and judged the result while playing. Requirements grew with the game
rather than arriving as one complete specification.

## Important iterations

| Step | My request or observation, paraphrased | Codex's implementation and resulting behavior |
| --- | --- | --- |
| 1. A forest prototype | Build one fairy-tale level with a dwarf wizard and a smoking wand. | Plain HTML, CSS, JavaScript and Canvas 2D, with original scenery drawn in code. The scrolling forest included jumping, spells, enemies, fireflies, hearts, lantern checkpoints and keyboard/touch controls. It opened directly from local files. |
| 2. A four-chapter adventure | Add a harder dusk forest, bright clouds with manually activated rocket boots, and a final encounter with the Guardian of the Valley. | Codex preserved the first forest, added the other chapters and story transitions, and implemented a 30-second boost followed by 15 seconds of recovery. Checks caught boots ending early at lanterns and a cloud exit that boosted jumps could overshoot. |
| 3. Scenery stability and repeatable boss tests | The background clouds shake, the boss is difficult, and I need saves to revisit the fight. | Fixed scenery with camera-only parallax replaced the unstable background. The boss's hit flash became visual only, allowing connecting shots to count. Chapter and pre-boss saves, Continue and quick retries made repeated review practical. A temporary direct boss launch was added for testing. |
| 4. Balance and a visible ending | After several wins, put boots on C, slow casting to one second, and let the defeated boss kneel and fall before victory. | C became the primary shortcut; E/K remained aliases. Codex added a one-second wand cooldown and a 2.2-second defeat sequence, with pause, retry and reward handling. I subsequently reported completing the whole game and finding the final fight fine. |
| 5. Readable cloud platforms | Remove three unwanted shadow-like shapes and distinguish scenery from clouds I can land on. | Codex traced the shapes to translucent decorative islands and removed them. Softer blue background clouds and opaque platforms with outlined landing ridges made the physical surfaces clearer. |
| 6. Music and subtle effects | Suggest fuller recordings with clear reuse terms, then add the selected music and movement/combat cues. | Codex bundled five Kevin MacLeod recordings, scene-based playback, volume control and accessible credits. I liked the music iteration. When I could not reliably hear rocket-jump and boss-charge cues, Codex reproduced their triggers and strengthened those two effects; I later confirmed testing the adjustment. |
| 7. The final campaign interface | Keep the lanterns and saves, remove testing shortcuts, and add English, German and Polish. | Codex kept eight lantern checkpoints, with autosave allowing later continuation from chapter starts or the last lantern before the final fight. Language changes preserved gameplay and settings. Codex initially retained Boss practice after removing the chapter selector; my clarification led to its removal, while earned boss retries and normal existing saves remained supported. |
| 8. Naming and fullscreen | Use one English title across languages and make the game panel fullscreen. | I selected Wandmoss Journey after name screening. Codex updated current branding while preserving storage compatibility and historical names. Native fullscreen included HUD, touch controls and credits; a browser Escape issue led to closing credits on fullscreen exit while preserving pause. |

## Music, licensing and rights checks

These decisions developed alongside gameplay. The music was integrated before
the wider publication audit; I selected and adopted the replacement title
before requesting its official-register review.

1. **Explore recordings before integration.** I asked for suggestions only,
   then specified a fuller sound and permitted reuse. Codex proposed five
   Kevin MacLeod tracks from Incompetech for the menu, forest, dusk, clouds
   and boss, checking the author's license offer and game-use FAQ.
   [Requests and recommendations](DEVELOPMENT_FLOW.md#14-specify-fuller-recordings-and-permitted-music-use).

2. **Clarify the license before approval.** I asked what attribution was
   required and whether the music would conflict with MIT. Codex reviewed
   the source terms and explained separate licensing: MIT for the game's
   original contributions, CC BY 4.0 for the recordings, with author/source
   credits, the license and supplied notices preserved.
   [My licensing question](DEVELOPMENT_FLOW.md#16-check-music-permissions-and-their-relationship-to-mit).

3. **Approve integration and retain provenance.** I authorized adding the
   proposed soundtrack and credits. Codex bundled the five unchanged MP3s,
   download provenance, [third-party notices](../THIRD_PARTY_NOTICES.md),
   an offline license and accessible in-game credits. Hash/decoding checks
   and 80 file/playback assertions passed; I later reported that the soundtrack
   was fine. [Integration record](DEVELOPMENT_FLOW.md#17-add-the-soundtrack-and-license-information).

4. **Review names and delivered assets before publication.** I requested
   checks of the English, Polish and German names, code, graphics and music.
   Codex inspected the implementation, compared the recordings with official
   downloads and checked translated credits. The review found existing games
   using Mosslight and no concrete missing asset-license or credit requirement
   in its scope. I made renaming the highest priority. Similar names were
   treated as publication risks; the review did not determine infringement.
   [Name and asset evidence](evidence/NAME_AND_LICENSE_REVIEW.md).

5. **Choose and apply a replacement title.** I chose one English title for
   all interfaces and proposed alternatives. Codex screened those and other
   candidates; I selected Wandmoss Journey. The rename preserved existing
   saves and historical records. Preliminary web results informed that choice;
   official-register checks followed separately.
   [Candidate screening](evidence/REPLACEMENT_NAME_SCREENING.md).

6. **Check the selected title in official registers.** At my request, Codex
   checked the title, root and specified variants in EUIPO, WIPO, UPRP, DPMA
   and USPTO, using known-mark controls. It corrected stale inputs and broad
   matching before retaining results. No concrete conflicting record was
   identified in completed queries; TMview was unavailable and additional
   USPTO searches were interrupted. I retained the publication decision.
   [Register results and limits](evidence/WANDMOSS_TRADEMARK_REVIEW.md)
   document the scope, without worldwide legal clearance.

## Publication and later corrections

I reported that my tests passed and chose two publication stages: the playable
game with a minimal README first, then the fuller documentation. The first
release was merged through GitHub PR #2, and I reported completing the whole
hosted game on 2026-10-10. That report did not include a device/browser matrix.

I then noticed an intermittent snap back when walking off a fallen log.
Codex reproduced a collision error at its edge and corrected side resolution
and top support. My phone feedback revealed a tiny portrait scene, landscape
overflow and an oversized HUD. Codex fitted a proportional following view to
the viewport, kept the wizard readable, moved auxiliary settings to pause,
and added two-finger canvas zoom. Checks also corrected fullscreen scroll
restoration after rotation.

I subsequently reviewed the desktop version positively and closed gameplay
development. I chose to publish these corrections with the documentation
in the second publication PR. PR #3 was merged into `main` as `f9b7d85`,
incorporating `3810d27` and completing that publication plan. I then confirmed
that testing of the corrected hosted version and on a physical phone was
complete, and that the project was closed and published. This later report
is separate from my earlier desktop feedback and Codex's local checks.
The [publication closure](BACKLOG.md#publication-and-verification-closed--2026-10-13)
records my confirmation without assigning new test dates or device details.

## Verification and lessons

Codex's [verification record](VERIFICATION.md) separates historical iterations,
local checks and my reported feedback. Retained checks cover engine rules,
an input-driven campaign route, real browser input, saves, audio, translations
and fullscreen. The latest collision correction passed 355 focused scenarios,
26 integration groups and eight native input checks. The phone correction
passed 165 focused checks in local Chrome emulation, followed by desktop
fullscreen checks. Emulation does not establish behavior on physical phones
or other browser engines. Earlier screenshots were removed; the retained
README image illustrates the product rather than proving a playthrough.

This was my first project using someone else's music under a license.
I learned to research reuse rights and licensing terms, including the
required attribution and the distinction between the music's license and
the game's original contributions.

I also observed that later verification and token usage exceeded my expectations.
I asked for targeted local checks, integration at feature checkpoints and full
regression at milestones or releases, with heavier documentation consolidated
at checkpoints. My [updated effort estimate](DEVELOPMENT_FLOW.md#60-review-the-template-and-record-total-human-effort)
is eight hours of my own work so far, including the earlier three-hour report.
Codex [reconciled my supplied usage snapshots](DEVELOPMENT_FLOW.md#61-record-the-next-usage-snapshot)
as cumulative counters per thread: approximately 164.9 million tokens for the
included repository rows, excluding the separately labelled methodology work.
This is a partial subtotal; monetary cost was not supplied. No comparable
build was timed. The lasting
lesson is to match verification effort to the change while keeping my own
playtesting and acceptance explicit.

[Play instructions](../README.md) · [Documented outcomes](../AI_TRANSFORMATION_OUTCOMES.md)
