# Prismellow — development process

I built Prismellow with Codex through small iterations. From the first playable
prototype onward, each product change left me with a working game that I played
and evaluated before requesting the next improvement. My feedback shaped the
controls, appearance, sound and final scope.

The requests below are concise English paraphrases of the original Polish
conversation. They summarize the main product milestones.

## The working loop

**Describe a change → Codex implements and checks it → I play the game → give
feedback → refine or choose the next change.**

Requirements grew while I used the game. I started with a remembered experience
and added features after trying the current version. Codex handled implementation
and technical checks; I judged whether the result felt right and was convenient
to play.

## Iterations

| Step | Request, paraphrased | Playable result |
| --- | --- | --- |
| 1. Remembered mechanics and a prototype | Build a browser game with falling gems, swaps and color matches. | An 8 × 8 board with six gem types, adjacent swaps, matches, gravity, cascades and scoring. Invalid swaps returned to their original positions. Hints, keyboard input, a local best score, basic dragging and simple effects were already available. Initially, a board without legal moves refreshed so play could continue. |
| 2. Better graphics and dragging | Improve the gems and make swapping feel natural through dragging. | Richer SVG gems, falling animations, particles and floating points. A dragged gem followed the pointer and previewed its neighbor; short or outside-board gestures cancelled safely. Click controls remained available. |
| 3. Music and a switch | Add a nostalgic soundtrack that I can turn on or off. | Procedural music generated locally with Web Audio, with its own switch. |
| 4. The crystal “kling” | Make disappearing gems produce a pleasant crystal chime. | Layered chimes replaced the simple effects. Cascade pitch rose, and the effects switch worked independently of music. |
| 5. Another visual refinement | Polish the appearance further. | Clearer facets, reflections, shadows, the game mark and board frame, while keeping gem colors and shapes readable. |
| 6. Three languages and broader checks | Add Polish, English and German, and check the whole game. | Translated controls, messages and accessible labels. The language choice persisted and could change without losing the board or points. Checks also led to a correction to restart cancellation with Escape. |
| 7. Finished games and a named Top 10 | Show the best ten results after a game, allow a qualifying player to enter a name, and let me finish early. | No legal moves became an end condition. Manual ending reached the same result dialog. Finished games preserved the score and locked the board; qualifying positive results could be saved under a name. |
| 8. Simple local distribution | Let someone copy the folder, open index.html and play. | The final game opens directly from its files, with local browser scores and preferences. When persistent storage is unavailable, scores can remain in page memory. Copying the game does not transfer the browser's ranking. |

## Playtesting and technical verification

My playtesting supplied the feedback between iterations: how the gems looked,
how swapping felt, and whether the music and chimes matched the experience I
wanted. Technical checks complemented that judgment by covering rules, rejected
swaps, cascades, gestures, language changes, restart and score saving.

Historical checks before the final Top 10 covered **200 random boards** and
**50 legal moves**, with one run reaching **3,700 points**. Later recorded checks
covered file-opened startup, finished-game flows, ranking persistence and
unavailable or damaged storage. The original test package was not retained;
these are recorded results from the original work.

The original intermediate code versions were not committed separately.
This account describes Prismellow's development and its product milestones.

## Post-build technical checks

Codex corrected three issues in the current game: hints that disappeared with
reduced motion, invalid personal-best values from storage, and effects that
appeared enabled after an audio failure. Focused Chrome and Firefox checks passed,
including audio retries and rapid switching. These are later maintenance checks;
they do not validate the original intermediate versions. See the
[verification procedures and scope](VERIFICATION.md).

## Lessons learned — naming and licensing

Preliminary name and trademark searches led me to replace the working title
Diamond Mines with Prismellow. I learned to consider naming, asset provenance
and distribution terms alongside functionality. This was an initial risk check,
not comprehensive legal clearance. The project's distribution license remains
undecided.

### Limited provenance review

Codex reviewed the seven runtime files. The game uses local scripts and styles,
embedded SVG artwork, system fonts and audio synthesized with Web Audio from
notes stored in the code. No external runtime packages or separate graphic,
font or audio files loaded by the game were identified.

Three exact-text web searches sampled the arpeggio pattern in
[music.js](../music.js), and the drag-ghost assignment and gem glint coordinates in
[game.js](../game.js). The returned results did not identify an identical source
for those snippets. This was a limited search, without an exhaustive comparison
against repositories or commercial products. No comparison with existing
soundtracks or artwork was performed.

The earlier name check remains preliminary. Its exact queries and results are
not retained with the project; registry evidence therefore remains incomplete.
These checks describe the reviewed implementation and search scope. They do not
certify originality or establish trademark clearance. The distribution license
remains undecided.

Name checks concern potential [trademark conflicts](https://www.dpma.de/english/trade_marks/trade_mark_search/index.html).
Code, artwork and audio raise questions about [copyright](https://www.wipo.int/en/web/copyright/protection)
and any third-party licenses. Choosing [the project's distribution license](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
is a separate decision.

[Play instructions](../README.md) · [Documented outcomes](../AI_TRANSFORMATION_OUTCOMES.md)
