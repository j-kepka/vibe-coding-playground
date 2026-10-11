# Name and licence review

**Later title change:** I selected **Wandmoss Journey** on 2026-10-10.
This report remains the audit of the preceding Mosslight/Mchowa Dolina names
and delivered assets. Its observations, original hashes and registry queries
do not clear the replacement title. See the
[candidate screening](REPLACEMENT_NAME_SCREENING.md) and
[rename verification](../VERIFICATION.md#wandmoss-journey-branding-and-save-compatibility--2026-10-10).

**Checked:** 2026-10-10  
**Reviewer:** Codex  
**Scope:** The current Mosslight game before publication, including its English,
German and Polish names, source code, procedural artwork, effects, recordings,
credits and distribution notices.

**Result:** Replace **Mosslight** before publication. Exact game titles and
related game-industry names already exist. The owner subsequently made renaming
the highest-priority backlog item. The asset audit found no concrete missing
licence, attribution or preservation requirement in the current distribution.
These findings are evidence for a publication decision, not a legal clearance
certificate or a guarantee against all third-party claims.

The accompanying [audit data](NAME_AND_LICENSE_AUDIT.json) retains the queries,
observations, identifiers, source URLs, file hashes and limitations. This report
distinguishes name collisions, registered marks and copyright permissions:
finding a similar name does not itself establish infringement, and an asset
licence does not clear a game title.

## Names actually used

| Interface | Current title | Assessment |
| --- | --- | --- |
| English | Mosslight | Exact game-title collisions confirmed; replace the public title. |
| German | Mosslight · Ein Märchenabenteuer; heading Mosslight | The same title is used, so the English-name conflict also applies to German. |
| Polish | Mchowa Dolina · Mosslight; heading Mchowa Dolina | No exact game-title collision was identified in the bounded searches. A joined commercial name exists, and the Polish register could not be searched successfully; this title is not formally cleared. |
| German story setting | Moostal | An in-world valley name, not a separate game title. Existing business and game-mod uses were found. |

These values were read from `../../i18n.js` and `../../index.html`. **Mooslicht**
was additionally searched as a possible literal translation; it is not a name
currently shipped by the game and is not being approved as a replacement.

## Existing public uses

The following are publisher, creator or storefront pages, rather than search
snippets used as proof of ownership.

| Observed name | Verified source and context | Relevance |
| --- | --- | --- |
| Mosslight | [Google Play listing](https://play.google.com/store/apps/details?id=com.kartiop.locak.baltodoar), displaying Kappa Mesa Software Inc.; Android forest adventure; listing updated October 3, 2026 | Exact game-title overlap. The listing identifies a publisher, not independently verified trademark ownership. |
| Mosslight / MossLight | [FluckyAnticsGames on itch.io](https://fluckyanticsgames.itch.io/mosslight), released Windows/Linux game, published September 30, 2026; [the same game's Steam page](https://store.steampowered.com/app/5351650/?curator_clanid=4777282), marked coming soon | One competing game on two channels; an exact title overlap, despite capitalization. |
| Moss Light | [zjikra's creator page](https://zjikra.itch.io/moss-light), released tower-defence/roguelike | Close game title with a space. Its precise release date was not established. |
| Mosslight Games | [Studio's own itch.io profile](https://mosslightgames.itch.io/), describing a UK game studio | Existing game-industry branding. |
| Mosslight Meadow | [Steam storefront](https://store.steampowered.com/app/5032300/Mosslight_Meadow/), Lanternleaf Games, forthcoming adventure | Related game name using the same dominant word; the storefront is not evidence of a completed release. |
| MossLight — Botanical Resource | [Apple App Store listing](https://apps.apple.com/us/app/mosslight-botanical-resource/id6774940375) | Additional software-market use, outside games. |
| Mosslight Series: Base Tileset | [Creator's asset-pack page](https://givty.itch.io/basetileset) | Related game-art branding. This project does not incorporate that pack. |
| MchowaDolina | [Allegro seller/manufacturer listing](https://allegro.pl/oferta/drzewko-obraz-mech-chrobotek-personalizowane-50x28-cm-14609255452), moss decorations | A real commercial identifier in another field; it does not automatically prohibit a game title. |
| MoosTal | [Business's own page](https://www.moostal.shop/UEber-uns/), stove construction and parts | Commercial use outside games. |
| Moostal | [Original Farming Simulator mod page](https://www.modhoster.de/mods/moostal), Thomy_Toast, February 28, 2018 | Existing game-related place/map name. Our current use is a fictional valley name. |

**Practical conclusion:** Capitalization, spacing or adding a generic subtitle
would not give Mosslight a clearly distinct identity among these games. Choose
and research a replacement title and its language variants before the first
publication PR. This is a risk assessment from the observed uses, not a finding
that a particular publisher can necessarily prohibit this project.

## Trademark and German title searches

No class or live-status filter was deliberately applied to the following name
searches. Results describe the queries performed on the review date, not a
worldwide search for every phonetic, visual or translated similarity.

| Source | Query/scope | Observed outcome |
| --- | --- | --- |
| [EUIPO eSearch](https://euipo.europa.eu/eSearch/#basic/1+1+1+1/100+100+100+100/Mosslight) | Basic Mosslight query | Zero trademark results; a Nintendo control returned 129 marks before repeating the target query. |
| [USPTO Trademark Search](https://tmsearch.uspto.gov/search/search-results) | Wordmark Mosslight; live and dead included | Zero live/dead records; Nintendo returned 203 (67 live, 136 dead) before repeating the target query. |
| [TMview](https://www.tmdn.org/tmview/#/tmview/results?page=1&pageSize=30&criteria=C&basicSearch=Mosslight) | Contains Mosslight; default offices and territories | Six records: China one, Japan five; classes 14, 20, 21 and 25. Three were reported registered; the others ended/expired. |
| [WIPO Global Brand Database](https://branddb.wipo.int/en/) | Embedded/contains Mosslight; default collections | Five Japanese records in the same four classes; two reported registered, three expired. The exact query URL is retained in the audit data. |
| [DPMAregister](https://register.dpma.de/DPMAregister/marke/basis) | DE/EM/IR checked; nine exact/joined/prefix queries listed below | Nine explicit no-hit HTTP responses; seven independently repeated with native browser input. A Nintendo control returned 121 entries. |
| [UPRP](https://ewyszukiwarka.pue.uprp.gov.pl/search/simple-search?lng=pl) | Attempted access to the Polish public search | No usable result: web reader/direct HTTPS/fresh Chrome did not expose a usable form. This is unavailable evidence, not a zero result. |
| [Titelschutz-Journal archive](https://www.titelschutzjournal.de/titel-archiv/) | Six names; no country/year/issue restriction | No hits in this publisher's own title notices since 2002. Other archives and unannounced titles are outside this search. |

DPMA queries: `Mosslight`, `Moss Light`, `Mchowa Dolina`, `MchowaDolina`,
`Moostal`, `Mosslight*`, `*Moss*Light*`, `Mooslicht`, `Moostal*`. The wildcard
queries include the literal asterisks submitted in the form. The archive used
the six names without
wildcards. Exact server expressions and successful browser confirmations are
retained in the JSON. Plain-form responses, timeouts and an accidentally
concatenated input were excluded from the results.

TMview reported registered **MOSSLIGHT**, Chinese application **6303457**,
class 25, and Japanese applications **2017092461** (**Mosslight**) and
**2017092462** (**Mosslight-LED**), class 21. WIPO reports the Japanese
registration numbers as **6060253** and **6060254**. Application and registration
numbers are different identifiers for the same underlying Japanese marks.
The audit data retains the other ended/expired records separately. Their status
is attributed to the aggregators; CNIPA/JPO origin registers were not checked
independently. TMview and WIPO have different coverage, so their counts must
not be added as independent registrations.

No class 9 or 41 entry appeared in those Mosslight queries. Downloadable game
software and online game services are relevant examples in the
[WIPO Nice class 9 list](https://nclpub.wipo.int/esen/pdf-download.pdf?classNumber=9&dateInForce=20260101&lang=en&tab=&viewMode=flat)
and [class 41 list](https://www.wipo.int/classifications/nice/nclpub/en/fr/?basic_numbers=show&class_number=41&explanatory_=).
Different-class marks are not automatically prohibitions, and the absence of
these classes does not clear existing game titles or related commercial use.

EUIPO/USPTO positive controls and target queries were completed after
resumption with normal browser animation timing; the native fields echoed the
correct names. Additional international searches for Polish/German variants
did not produce retained outcomes; do not extend the Mosslight results to those
unchecked variants. The initial automated browser helper froze animation
timing; the successful TMview/WIPO runs and final EUIPO/USPTO checks used normal
timing. Aggregator results, incomplete similarity coverage and unregistered
rights remain limitations even after these controls pass.

[DPMA's own guidance](https://www.dpma.de/marken/markenrecherche/index.html)
warns that its search is not a similarity clearance and that EU/IR data may be
incomplete. [USPTO's clearance guidance](https://www.uspto.gov/trademarks/search/comprehensive-clearance-search-similar-trademarks)
also requires considering related goods and existing unregistered commercial
use. German [MarkenG §5](https://www.gesetze-im-internet.de/markeng/__5.html)
protects business identifiers and work titles beyond registered trademarks.
The title archive expressly says no result does not establish freedom to use.
Accordingly, none of these negative searches overrides the confirmed game
collisions or constitutes full clearance of **Mchowa Dolina**.

## Code, artwork and effects

The inspected distribution contains eight local JavaScript modules, HTML/CSS,
five MP3 recordings and four retained game screenshots. No runtime package
dependency, imported library, bundled font or standalone gameplay texture or
sprite was identified. `renderer.js` draws scenery and characters with Canvas
paths, shapes, gradients and cached canvases; CSS contains procedural SVG
turbulence. `effects.js` generates Web Audio tones/noise without audio samples.
Georgia, Trebuchet MS and Arial are local/system font references; font files
are not redistributed by this project.

The existing [MIT licence](../../LICENSE) names Jarosław Kępka and applies to
the project's original contributions. Its text matches the
[OSI MIT licence](https://opensource.org/license/mit). Keep the copyright and
permission notice in copies or substantial portions. The MIT declaration
does not grant rights in somebody else's material or establish that every
AI-assisted element attracts exclusive copyright.

Codex viewed the four already retained screenshots and inspected the rendering
source. The purple dwarf wizard, wand, forests, phoenixes and clouds showed no
obvious Nintendo character, logo or copied interface. No Nintendo recording,
sprite sheet or game map was identified in the shipped files. This is a
bounded source/visual review, not comparison against every copyrighted work.

The initial request's platform-game inspiration does not itself supply a
licence to copy specific expression. EU
[Directive 2009/24/EC, Article 1](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009L0024)
separates protected program expression from ideas and principles. The CJEU's
[Nintendo judgment C-355/12](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A62012CJ0355)
also recognizes creative graphic and sound elements of games. In Poland,
[the published copyright act, Articles 1–2](https://eli.gov.pl/api/acts/DU/2025/24/text/T/D20250024L.pdf)
distinguishes expression from ideas and inspiration from adaptation. German
[UrhG §2](https://www.gesetze-im-internet.de/urhg/__2.html) and
[§69a](https://www.gesetze-im-internet.de/urhg/__69a.html) make corresponding
distinctions for works and programs. These principles support the scope of the
review; they do not decide a hypothetical similarity dispute.

## AI-assisted output and ownership limits

[OpenAI's European terms, Content](https://openai.com/policies/eu-terms-of-use/)
assign OpenAI's rights, if any, in output to the user to the extent permitted
by law, while warning that outputs need not be unique. The
[Services Agreement, §4](https://openai.com/policies/services-agreement/)
has a corresponding rule for covered business/developer services. Which
contract applies depends on the actual account; no private account agreement
was reviewed. The [service terms, Codex and Code Generation](https://openai.com/policies/service-terms/)
expressly preserve possible third-party/open-source licence obligations in
generated code. Assignment is not a guarantee of originality or clearance.

Copyright protection also depends on qualifying human authorship. The
[US Copyright Office's January 2025 findings](https://copyright.gov/newsnet/2025/1060.html)
distinguish human creative arrangements/modifications from prompting alone;
they are US guidance, not a Polish or German ruling. The Polish/German
provisions cited above require individual creative expression. This project's
human requirements, choices and revisions are documented, but this audit does
not determine the protected share of each generated file. MIT can describe
permissions for rights actually held without promising copyright over every
generated element. Preserve the existing disclosure of Codex's contribution.

## Recordings and provenance

All five local recordings matched both their existing provenance and fresh
downloads from the author's official URLs **byte for byte**: **36,189,518
bytes** in total. Titles, ISRCs and original filenames matched the current
[official 1,443-entry catalog](https://incompetech.com/music/royalty-free/pieces.json).
The five track URLs returned HTTP 200. They serve a common dynamic template,
not five independently static attribution pages; the JavaScript/catalog
lookup resolves each ISRC and supplies the CC BY 4.0 attribution. The
[author's licensing page](https://incompetech.com/music/royalty-free/licenses/)
and [game-use FAQ](https://incompetech.com/music/royalty-free/faq.html) corroborate
the offer and credit placement.

| Recording | ISRC | Bundled bytes | Fresh source comparison |
| --- | --- | ---: | --- |
| Call to Adventure | USUAN1300022 | 9,894,055 | Identical |
| Enchanted Journey | USUAN1100799 | 10,784,428 | Identical |
| Folk Round | USUAN1100357 | 7,472,358 | Identical |
| Evening Fall (Harp) | USUAN1100236 | 4,759,305 | Identical |
| Fairytale Waltz | USUAN1100232 | 3,279,372 | Identical |

The audit data includes all SHA-256 values and source/download URLs.
The [bundled CC BY text](../../assets/music/CC-BY-4.0.txt) also matched the
[current official text](https://creativecommons.org/licenses/by/4.0/legalcode.txt):
18,657 bytes, SHA-256
`9ba9550ad48438d0836ddab3da480b3b69ffa0aac7b7878b5a0039e7ab429411`.
Supplied author/composer and copyright metadata, including the two 2005
notices, are preserved. Four original MP3 packages also contain embedded
JPEG artwork; it is retained as supplied by the author and is not extracted
or displayed by the game. Do not describe that third-party artwork as part
of the project's original MIT graphics.

## MIT and CC BY 4.0 conditions

The five recordings use the author's **CC BY 4.0** offer, rather than MIT.
[CC's licence summary](https://creativecommons.org/licenses/by/4.0/)
permits commercial sharing and adaptation with attribution; it has no
NonCommercial, NoDerivatives or ShareAlike condition. The
[CC FAQ](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software)
allows separate game music/art under CC while recommending software licences
for the program itself.

There is a material distinction between unchanged MP3 bytes and integration:
[CC BY 4.0, §1(a)](https://creativecommons.org/licenses/by/4.0/legalcode.en)
treats synchronization with moving images as adapted material. §§2(a)(1)(B)
and 3(a)(4) permit it, provided the game's contribution terms allow compliance
with CC. Thus MIT on the game's original contributions can coexist with the
recordings' CC permissions; it does not relicense the recordings. This is the
licence interpretation applied to the current separate files and notices.

Keep creator/source attribution, supplied copyright and licence notices,
the disclaimer reference and the CC text/link; describe modifications and
retain earlier modification notices. Do not imply endorsement or impose
restrictions/DRM that block recipients' CC rights. These obligations are
identified in §§2(a)(5)–(6) and 3(a) of the legal code. The current
[third-party notices](../../THIRD_PARTY_NOTICES.md) document scene accompaniment,
repetition, volume changes, fades and pauses while distinguishing them from
unedited source files. The game exposes credits and links to the notices and
offline licence. No additional payment or separate author permission is
required for uses already covered by the verified CC offer and its conditions.

Codex's fresh native-browser check passed **48 credit assertions**, **16 per
language**, in English, German and Polish. The accessible dialog retained all
five proper recording titles, Kevin MacLeod, official source URLs, CC BY 4.0,
MIT scope, notices/offline links and supplied copyright notices. Browser language
does not change the licence; its international terms apply to the same files.

**Asset finding:** No concrete attribution, source, licence-separation or
preservation defect was found. Licences cover the rights their licensors hold;
the review does not independently establish every underlying right or resolve
all collecting-society, patent, title or similarity questions for every market.

## Recorded limits and next steps

The quota interruption occurred after most research but before the public
report was written. On resumption, Codex recovered the retained evidence;
unretained or unperformed registry attempts are explicitly labelled. No
account was created for a register, no owner was contacted and no legal opinion
was obtained. Public databases and marketplace pages can change; refresh the
checks for the chosen replacement and target publication markets.

The owner requires **P0 — rename before publication**. Choose the replacement
and decide the Polish/German presentation, search similar names and applicable
registers, then update current branding and references. Preserve historical
records under their names at the time. Current-name research is completed;
replacement-title clearance and the publication decision remain open.

The owner's later **game-panel fullscreen** proposal is recorded separately
in the [backlog](../BACKLOG.md). The owner explicitly chose backlog placement,
so it was not implemented during this rights review. The proposal is to show
the game area with essential controls, omit the surrounding page title and
instructions, preserve picture proportions, and return with Escape. The
[Fullscreen API standard](https://fullscreen.spec.whatwg.org/) supports
fullscreen display of an element, with a user-triggered request; actual
browser exit/input/state behaviour remains to be implemented and tested.

Only documentation and evidence changed in this iteration. Game code, audio,
licence files, existing provenance, four screenshots and files outside
Mosslight are preserved. No new screenshots were captured. Final GitHub Pages
tests, publication and polished process/outcome documentation remain later
work.
