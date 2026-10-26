# Architecture

A static, single-page site. Everything the browser runs is in `index.html`; the data it fetches sits beside it.

## Build

```
python3 src/assemble.py            # writes index.html (the GitHub Pages build)
```

`index.html` is generated: edit the files in `src/`, never `index.html` by hand.

| File | What it does |
|---|---|
| `src/page_head.html` | `<title>`, fonts, and all CSS (theme tokens on `:root`, dark mode under `prefers-color-scheme`) |
| `src/page_body.html` | Static markup: header, tabs, the Compare / Every lectionary / Hybrid / 1955 vs 1962 / Divine Office / Sources sections |
| `src/pagedata.json`, `src/extradata.json` | Inlined data for the comparison tabs |
| `src/page_script.js` | Tabs, Compare-the-year table, precedence, Byzantine calendar helpers |
| `src/music.js` | Chant (GABC) rendering and playback, hymn tunes (`window.LectMusic`) |
| `src/mass.js` | Builds each Mass and Office guide, fits it to a target length (`window.LectMass.render`) |
| `src/tools.js` | Timer, live sessions, role views, presenter, chat script, read-aloud, booklet (`window.LectTools`) |
| `src/p2p.js` | Peer-to-peer live sessions (PeerJS/WebRTC), used when the page is not inside Claude (`window.LectP2P`) |
| `src/mytexts.js` | "Add text": the user's own copy of copyrighted texts, kept in localStorage (`window.LectTexts`) |
| `src/today.js` | Pray-today questionnaire, today band, session page, Office text loaders, coverage labels (`window.LectApp`) |
| `src/assemble.py` | Concatenates the above into `index.html` with the Open Graph / Discord meta tags |

## Data (fetched at runtime)

| Path | Contents |
|---|---|
| `days.json` | One record per day, 2025-11-30 to 2030-11-30: celebrations and readings for every rite (keys `n` Novus Ordo, `o` Ordinariate, `m` 1962, `p` pre-1955, `h` hybrid, `b` Byzantine) |
| `bible/dr`, `bible/kj`, `bible/cv` | Douay-Rheims, King James, Coverdale psalter, several books per shard `s<N>.json` (`tools/shard_bible.py`; index in `src/today.js`) |
| `propers-1962.json`, `propers-pre55.json`, `ordo.json` | Traditional Mass propers and Ordinary, Latin and English |
| `chant.json`, `hymns.json` | Gregorian chant (GABC) and public-domain hymns |
| `bcp-office.json` | 1662 Mattins, Evensong and collects |
| `data/bcp1979.json` | The 1979 Prayer Book: the daily offices, the Holy Eucharist with its Eucharistic Prayers and Prayers of the People, prefaces, collects and the 30-day psalter, built by `tools/bcp1979.py` from bcponline.org; `pb79Day()` in `src/mass.js` finds the day's collect by the 1979 calendar |
| `data/orders.json` | Orders of service printed in full (the Presbyterian Book of Common Worship 1906, the Reformed Church in America Liturgy 1882 with the Form of Dort, the Mercersburg Order of Worship 1866, Hapgood Great Vespers, Matins, Hours and Compline, Wesley's Morning and Evening Prayer and Litany 1784, Lutheran Matins, Vespers, Litany and Suffrages from the Common Service Book (the collect of the day comes from `data/lutheran-csb.json`), the Methodist Episcopal Lord's Supper 1908, the Armenian Divine Liturgy in the English of 1908, the Coptic Liturgy of St Basil in Bute's English, the East Syrian Liturgy of Adai and Mari in the English of 1893), built by `tools/orders.py` from the hand-proofread texts in `tools/texts/order-*.txt` (markup described in the script); `ORDER_RITES` in mass.js says which orders make up each rite and `buildOrders()` shows them. |
| `data/rca1882-lessons.json` | The Order of Scripture Lessons of the Reformed Church in America Liturgy (1882), read from the page images: morning and evening Old and New Testament lessons for the Christmas, Easter and Pentecost seasons. `rcaLessonDay(T, iso)` in `src/mass.js` names the day; the `rca` rite prints the morning lessons at its `@lessons` slot |
| `data/mercersburg.json` | The Mercersburg Order of Worship's Gospels, Epistles, Collects and Festival Prayers for the church year (69 days, compared across three scans) and its Table of Scripture Lessons for Sundays (read from the page images); `mercDay()` in `mass.js` maps a date to the book's day. |
| `data/eastsyriac-1894.json` | The East Syrian lectionary of the Liturgy from Maclean's East Syrian Daily Offices (1894), read from the page images: Law, Prophecy, Acts, Apostle and Gospel for 108 days. `esyDay()` in `lectionary.js` sets Maclean's year (with his rules for joining the Sundays of the Epiphany and placing the Sundays of Eliya after the Cross) on the Gregorian calendar. |
| `data/lutheran-csb.json` | The Common Service Book (Lutheran, 1917-19): The Service and the propers of the church year, built by `tools/csb.py` from the proofread transcriptions in `tools/texts/csb-*.txt`; `csbDay()` in mass.js applies the book's calendar and precedence rubrics and `buildCSB()` shows The Service. |
| `data/bcp1662.json` | The 1662 Holy Communion and the collects, epistles and gospels, built by `tools/bcp1662.py` from Lynda Howell's HTML transcription (rubrics in red, headings centred, drop capitals rebuilt), with the 1662 wording of the opening rubrics restored; shown by `buildPB(ctx, opts, "bcp62")` in mass.js, which it shares with 1928 (`PB_BOOKS`). |
| `data/bcp1928.json` | The American Prayer Book of 1928: Morning and Evening Prayer, Holy Communion and the collects, epistles and gospels, built by `tools/bcp1928.py` from the Society of Archbishop Justus HTML (for the rubrics) and ePub (for the text) |
| `data/bcp1549.json`, `bcp1552`, `bcp1559`, `bcp1637`, `bcp1784`, `bcp1789`, `bcp1892` | The Holy Communion service of the earlier Prayer Books and of Wesley's Sunday Service (1784, with its collects, epistles and gospels, its table of proper lessons, `data/bcp1784-psalter.json` for its Select Psalms by day of the month, and `fallback: "sunday"` because it keeps no weekday or saints' propers), built by `tools/bcp_early.py` from the hand-proofread orders `tools/texts/bcp-<year>.txt` (a first draft from the Society of Archbishop Justus pages by `tools/justus.py`; each header lists the hand corrections). Shown by `buildPB(ctx, opts, rite)` with the `PB_BOOKS` entry for the book; for 1549, 1552 and 1559 `propers` holds the day-by-day table (`tools/bcp_propers.py`); for the others the collect, epistle and gospel of the day are cited (`propers` is empty) |
| `data/ordo-rites.json` | The Ordinaries of the Dominican, Ambrosian and Mozarabic Masses, parsed from Divinum Officium's Ordo files by `tools/do_ordo.py` (which also corrects OCR slips); the Ambrosian English is Atchley's 1909 translation, page-checked in `tools/texts/atchley-ambrosian.txt` |
| `data/dayhours.json` | Prime, Terce, Sext and None from The Day-Hours of the Church of England (1877), compiled by `tools/dayhours.py` from the page-checked transcription in `tools/texts/dayhours-little.txt` |
| `data/byz-liturgy.json` | Liturgies of St John Chrysostom, St Basil and the Presanctified (Hapgood, 1906) plus the Sunday hymns of the eight tones (Appendix A), compiled by `tools/byz_texts.py` from the page-checked transcriptions in `tools/texts/hapgood-liturgy.txt` and `hapgood-tones.txt` |
| `breviary/<form>/` | Full Breviary per form (`br62`, `br55`, `mon`, `op`): `manifest.json`, line shards `l-NNN`, row shards `r-NNN`, a day index per year `y-YYYY` |

## Pipeline (`tools/`)

Offline scripts that produced the data. `office_gen.py` runs the Divinum Officium engine (clone `DivinumOfficium/divinum-officium` into `tools/do/`, perl with `-I tools/perlstub`). `build_days.py` builds `days.json`; `byz_daily.py` ports orthocal's Byzantine lectionary; `bcp_*.py` extract the 1662 texts from a copy of the Prayer Book you supply.

## Rules the code follows

- **Copyright.** Print only public-domain or openly licensed texts. Copyrighted liturgical texts (ICEL, Divine Worship, current Byzantine service books, current Lutheran/Reformed/Anglican books unless their licence permits) are cited by name with a `cue`, never reproduced; the user can fill them in locally with Add text.
- **Coverage labels.** Every rite shows Complete text, Guided text or Order and readings (`coverage()` in `today.js`). Keep these honest when adding rites.
- **Roles.** Text elements carry `data-r` = `cel`, `srv`, `lec`, `ppl` or `all`; the role views, chat script and read-aloud depend on it.
- **Timing.** Builders return sections with `min` (minutes); `mass.js` fits sessions to a target length.
- **Two hosts.** The same code runs on GitHub Pages and inside a Claude artifact (which provides `window.claude` for live sessions); nothing may assume one or the other.

## Sanctuary launcher

`src/sanctuary.js` is assembled after `today.js`; `src/sanctuary.css` is included
inside the existing style block. `data/traditions.json` is a lazy array of catalog
records, including parent/family IDs, source URLs, edition rights notes and an
explicit source-review status. `src/tradition_sources.html` is generated from catalog
URLs and inlined at assembly so opening Sources does not fetch the catalog. Null calendars mean locality-dependent or not yet
verified; they must never be silently treated as Gregorian.

The launcher is an accessible modal layer over the existing `.wrap`. The normal
page becomes inert while open. It restores focus and scroll on exit. The old tab
router ignores slash-prefixed routes so hash history belongs to Sanctuary until
exit. The launcher owns home, Study, hierarchical detail and search screens; it never
renders a service. `LectApp.follow()` remains the service handoff and
`LectApp.coverage()` exposes the existing coverage labels without duplicating
coverage policy. Existing guide controls, roles, music and live-session code are
reused unchanged.

Keyboard navigation uses horizontal shelf wrapping and geometric movement
between rows; focus scrolls into view and Tab remains in the modal. Gamepad polling
uses `requestAnimationFrame`, dead zones, an initial 360 ms hold delay and 140 ms
directional repeats. Action buttons require release between selections. Input
prompts reflect the latest input. WebAudio sounds are opt-in. Reduced-motion
preferences disable tile transitions. Theme and text size are local to Sanctuary.

Sanctuary guide navigation shares the launcher's gamepad polling loop. Up/down
focuses service sections, left/right focuses visible controls within a section,
and Back returns to the launch route. The loop preserves held-button state across
catalog/guide transitions. Native editing controls and visible modal tools take
precedence. The Study route opens the existing tab panels without changing the
remembered home preference. Classic tabs are hidden only in the Sanctuary skin.
The Sources table is rendered from `LectApp.rites()` so its coverage matches the
home and WIP inventories.

The home view is a remembered choice (`lect-home`: `sanctuary`, the default, or
`classic`). With the Sanctuary as home, a visit whose opened URL has no fragment
is routed to `#/sanctuary` (the URL is read from the navigation entry, because
the tab router may already have written `#today`), and the classic page is
skinned with `data-skin="sanctuary"` on the root: the shared colour variables
are remapped to the Sanctuary palette (night, or vellum with its theme), the
body type becomes the display serif, and a sticky `#san-bar` offers Sanctuary,
Search and Classic view. Classic view removes the skin and the redirect.

`tools/build_traditions.py` validates parent links, guide mappings and URLs, emits
share stubs and captures original church and tradition artwork using the vellum/penwork from
`tools/card.html`. `--check` verifies exact stub contents, PNG dimensions and the
512-file project budget. Book editions inherit family artwork; source claims
require human review even if the generator and browser tests pass.

`tests/test_sanctuary.py` covers lazy loading, routes/history, hierarchy, focus,
controller input, search, guide handoff, recent guides, Sources aggregation,
Add text, live-session controls, Breviary text loading, build reproducibility,
and screenshots at 390/1920 px under light/dark system preferences. External
network services are excluded. A pinned local PeerJS server and client exercise
a real two-browser host/join, readiness, roles and position exchange in CI.
Managed Chromium installations that block direct WebRTC skip this regression
with an explicit policy reason; other local failures remain failures. The read-only
`tools/audit_tradition_sources.py` reports source reachability for the outstanding
editorial audit without asserting that reachable content confirms each claim.

## Monastic chant extension

`data/monastic-build.json` records the Divinum Officium revision and MIT notice.
`office_gen.py unpack` reconstructs the full text/chant caches from published
shards; extending only missing dates therefore preserves prior data. `pack mon
2000` stages approximately 2 MB shards and swaps the output directory only after
writing it. `LECTIONARIUM_DO`, `LECTIONARIUM_OFFICE_WORK` and
`LECTIONARIUM_OFFICE_WORKERS` select the engine, scratch directory and concurrency.
`tools/check_office.py` checks shard references, all eight text hours and seven
chant-mode hours through the requested date. `--baseline` compares every original
title and rendered cell, independently of reindexed shard positions. The known
unnotated Triduum little hours still require complete hour records; other missing
notation fails validation.

`office_gen.py rechunk <key> <kilobytes>` consolidates an existing pack without
renumbering text or row IDs; its output must be validated with `--baseline`
before replacement. The br55/br62 packs use 4 MB shards to leave room for the
individual catalog share pages within the 512-file site limit.

## Local participation mode

`src/participation.js` is loaded before Mass/session tools. It owns the local
localStorage choice between lay study and a self-declared priest-or-seminarian
mode, and asks the first-time question (a non-blocking `<dialog>` over a guide
already drawn in lay study). The host’s options never supply that choice. The
words of consecration are veiled in three ways: the Roman, Ambrosian,
Dominican and Mozarabic builders match their institution formulas (`INST_RE`);
the prayer-book, Common Service and Byzantine texts are matched by `CONS_RE`;
the orders in `tools/texts/order-*.txt` mark them explicitly with
`[consecration]` … `[/consecration]`. Mass rendering derives
`veil` locally; received live options are normalized before comparison so a
host’s priest mode cannot override a lay follower or cause redraw loops.

Reserved Eucharistic sections, priest-role paragraphs and their user-pasted
texts carry `data-priest-only`. The shared extraction path filters these for
lay chat/presenter output and for all read-aloud output. Whole traditional
Canons are collapsed as study references. Public responses remain separate
where role markup distinguishes them. Local role selection, peer assignment
options and received assignments enforce the same priest-mode condition;
only a recipient’s own choice enables a celebrant role. Office officiant
roles remain available, with the canonical obligation/approved-book limits
explained separately in Sources. Mode changes stop queued speech and clear
an inappropriate celebrant selection.

## Source appointments and local calendar readings

`src/lectionary.js` is assembled before `mass.js`. It exposes `LectCalendar` for
the current Episcopal calendar link, an explicit original 1979 Eucharistic
option, the two-year Office appointments, Coptic Orthodox appointments,
ordinary Byzantine kathismata and Resurrection Gospels, and the shared
date-scoped Bible reader. Appointed Prayer Book psalms use the bundled 1979
Psalter, whose verse numbers differ from the KJV.
`tools/texts/bcp1979-lectionary.json` records readable source citations and PDF
pages; `tools/bcp_lectionary.py` validates and packs the runtime JSON.
`tools/texts/coptic-lectionary.json` stores 1,827 dates referencing 221 distinct
day tables, with separate service/hour sections, citation provenance and three
unresolved references. `tools/coptic_lectionary.py` validates every unflagged
citation against the bundled Bible and packs an 83 KB runtime file. The optional
.NET exporter in `tools/coptic-export/` reads a pinned upstream checkout; it
serializes citation identifiers only. Neither the upstream database nor modern
Bible/prayer/Synaxarium text enters the site. Normal builds and CI remain offline.
Local citations use a structured localStorage key containing type, rite, hour
and ISO date. They are never uploaded. The orders renderer selects each citation
by its actual lesson slot, preventing a Gospel from consuming a Psalm slot or
all Coptic lessons from appearing at the Pauline reading.
See `docs/lectionaries.md` for source limits and unfinished imports.
