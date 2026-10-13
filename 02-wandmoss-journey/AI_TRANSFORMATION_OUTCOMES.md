# Wandmoss Journey — developing a fairy-tale platformer with Codex

**Date:** 2026-10-10\
**Status:** Published\
**Gameplay development:** Completed on 2026-10-10\
**Documentation reviewed:** 2026-10-11\
**Client type:** Personal learning project; one participant\
**AI solution:** Codex, iterative implementation and technical verification\
**Author:** Jarosław Kępka

## Problem

I wanted a fairy-tale platformer with a dwarf wizard and a smoking wand.
The challenge grew from one forest level into a complete, locally playable adventure.

## Baseline

- **Previous process:** An initial creative brief; no comparable build without AI was performed.
- **Time or cost:** Not measured against a baseline.
- **Primary friction:** Turning evolving gameplay and visual preferences into a coherent, playable campaign.
- **People affected:** One participant: me.

## Intervention

This account reconstructs the iterations from the
[edited English prompt record](docs/DEVELOPMENT_FLOW.md) and technical evidence.
I chose the scope and tested changes; Codex implemented them and ran checks.

I expanded the initial forest into four chapters, adding dusk, clouds with
rocket boots, and a final confrontation with the Guardian of the Valley.
Codex used HTML, CSS, JavaScript and Canvas 2D, drawing original scenery in
code and preserving offline opening without dependencies.

My playtesting exposed shaking clouds and difficulty defeating the boss.
Codex stabilized the scenery and corrected a hit flash that discarded
connecting spells. After winning several fights, I requested one-second casting,
C for the boots and an animated defeat. I also requested clearer cloud
platforms, music, effects and three interface languages.

I chose five persistent continuation points in one save slot and requested
removal of testing launch controls. I selected one English title after
Codex's naming research, with separate MIT terms for original contributions
and CC BY 4.0 for the bundled recordings. Later feedback drove fullscreen,
fallen-log collision and readable phone-layout corrections.

My current estimate is **8 hours of my own work** on this project as of
2026-10-10, including the three hours previously reported for October 9.
This is a cumulative owner estimate, without a timed comparison build.

## Measurable outcome

- **Time saved:** Not measured; no comparable baseline was timed.
- **Quality improvement:** Four playable chapters, rocket boots, a final fight with the Guardian of the Valley, autosave, retries, three languages, music and effects. The phone view keeps the wizard readable and supports pinch zoom.
- **Adoption or participation:** I reported completing the hosted first release, then confirmed final hosted and physical-phone verification, publication and project closure. External adoption was not measured.
- **Business impact:** Not applicable — personal learning project; no revenue or ROI claims.

## Evidence

- [Game and instructions](README.md), [development process](docs/DEVELOPMENT_PROCESS.md) and [verification record](docs/VERIFICATION.md) connect requirements with implementation and checks.
- Codex's local checks cover gameplay, saves, audio, languages and fullscreen. The later [collision correction](docs/VERIFICATION.md#fallen-log-edge-collision--2026-10-10) passed 355 focused scenarios; [phone checks](docs/VERIFICATION.md#phone-layout-fullscreen-and-pinch-zoom--2026-10-10) passed 165 Chrome emulation checks.
- My [hosted playthrough](docs/VERIFICATION.md#owner-reported-hosted-playthrough--2026-10-10) concerns the first release, and my [desktop closure report](docs/VERIFICATION.md#owner-reported-desktop-review-and-development-closure--2026-10-10) records the earlier development milestone. I subsequently [confirmed publication and verification closure](docs/BACKLOG.md#publication-and-verification-closed--2026-10-13), including the corrected hosted version and physical-phone testing. This is my reported verification; Codex's earlier results remain attributed to its local checks.
- My [updated eight-hour estimate](docs/DEVELOPMENT_FLOW.md#60-review-the-template-and-record-total-human-effort) includes the [earlier three-hour report](docs/DEVELOPMENT_FLOW.md#18-record-positive-testing-feedback-next-session-work-and-raw-usage). It was not independently timed.
- Codex reconciled my October 9–10 snapshots with local counters: **approximately 164.92 million tokens** across 49 distinct repository threads — main threads 89.46 million, subagents 75.46 million. The updated parent counter replaces its earlier value. [Method and scope](docs/DEVELOPMENT_FLOW.md#61-record-the-next-usage-snapshot): methodology is separate, three child threads are omitted and subsequent work is excluded. This is a partial repository subtotal; monetary cost was not supplied.
- [Music notices](THIRD_PARTY_NOTICES.md) retain attribution and provenance. The [name review](docs/evidence/WANDMOSS_TRADEMARK_REVIEW.md) records bounded searches and access limits, without legal clearance. Earlier screenshot evidence was removed; historical reports identify those limits.

## Human lesson

This was my first project using someone else's music under a license.
I learned to research reuse rights, check attribution requirements, and
distinguish the recordings' CC BY 4.0 license from MIT for the game's
original code and artwork.

I judged playability, visual clarity and sound, chose scope and accepted trade-offs.
Codex's checks complemented that judgment. Growing verification cost led me to
require targeted checks for local changes, integration checks at feature
checkpoints and full regression at milestones. That lesson is an observation,
not a measured saving.

## Professional relevance

I practiced turning an evolving idea into requirements, directing Codex and
evaluating its implementation. The [music and rights decisions](docs/DEVELOPMENT_PROCESS.md#music-licensing-and-rights-checks)
show how I handled external assets, attribution and bounded research before
making publication decisions.

## Reusable asset

- **Asset:** The prompt → implementation and checks → personal playtest → correction loop, with proportional verification.
- **Location:** [Development process](docs/DEVELOPMENT_PROCESS.md) and [verification strategy](AGENTS.md#proportional-verification).
- **Reuse conditions:** Small iterative browser projects; adapt checks to dependencies and retain human review and evidence limitations.

## Future relevance

As code generation becomes easier, clear scope, accountable decisions and
proportionate verification remain essential.

## Next opportunity

I can reuse this project's proportional verification and documentation workflow
in a future browser-game project.

## Confidentiality check

- [x] Clients and other participants are anonymized, where applicable — personal project.
- [x] No confidential information or private personal data about other people is included.
- [x] Metrics and estimates are labeled and supported; no productivity savings are claimed.
- [x] Evidence is attributed to the implementation and stage checked.
- **Publication or reuse permission:** N/A for client or organizational approval. Music reuse terms are documented separately in the notices; publication remains my decision.
