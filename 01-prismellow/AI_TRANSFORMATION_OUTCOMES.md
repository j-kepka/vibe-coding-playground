# Prismellow — rebuilding a remembered game with Codex

**Date:** 2026-10-04
**Status:** Draft
**Client type:** Personal learning project; one participant
**AI solution:** Codex, iterative development and browser verification
**Author:** Jarosław Kępka

## Problem

I felt nostalgic for gem-matching games and wanted a free version I could run locally.
I described the mechanics from memory and built it with Codex.

## Baseline

- **Previous process:** Remembered gameplay; no comparable build without AI was performed.
- **Time or cost:** Not measured; no comparable build without AI was performed.
- **Primary friction:** Turning remembered rules and visual preferences into a playable game.
- **People affected:** One participant: me.

## Intervention

I started with a playable prototype built with Codex and repeated
prompt → play → check → refine. I played each version and chose the next changes;
Codex implemented them and ran technical checks.
I requested dragging, graphics, procedural music, crystal chimes, PL/EN/DE
and a local Top 10. The final game runs from `index.html` offline.

My revised estimate for the original build: ~3 h of active human work within a ~6 h elapsed window, including waits for Codex usage limits to reset. Later documentation and project cleanup are excluded.

## Measurable outcome

- **Time saved:** Not measured; no comparable build without AI was timed.
- **Quality improvement:** A playable match-three game with cascades, scoring, invalid-swap rollback and local results.
- **Adoption or participation:** I provided playtesting feedback; three interface languages delivered.
- **Business impact:** A personal learning artifact; revenue and ROI were not measured.

## Evidence

- [Playable game](index.html) and [instructions](README.md).
- Historical checks: 200 random boards and 50 legal moves reaching 3,700 points before the final Top 10. The original test package was not retained.
- Recorded gross tokens from an earlier reading of local Codex session logs: approximately **27.6 million** — main sessions 22.2 million (80.6%), subagents 5.4 million (19.4%). The historical aggregation was not rerun for this review; these counts do not establish actual AI cost or financial return.

## Human lesson

I judged how the game felt and chose simple local distribution.
My playtesting, feedback and judgment remained necessary alongside Codex's technical checks.

## Reusable asset

- **Asset:** The prompt → playable change → check → correction loop.
- **Location:** [Development process](docs/DEVELOPMENT_PROCESS.md).
- **Reuse conditions:** Small prototypes with frequent human playtesting and technical checks; retain evidence limitations.

## Future relevance

As code generation becomes easier, useful scope and human evaluation remain essential.

## Next opportunity

Retain reproducible checks for this version and measure effort against a comparable task.

## Confidentiality check

- [x] Clients and other participants are anonymized, where applicable — personal project; no third parties named.
- [x] No confidential information or private personal data about other people is included.
- [x] Metrics are accurate and can be supported — effort is my estimate, tokens are an earlier Codex log reading, and historical figures were not independently remeasured.
- **Publication or reuse permission:** N/A — personal project; no client or organizational approval required.
