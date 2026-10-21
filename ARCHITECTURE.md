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
| `bible/dr`, `bible/kj`, `bible/cv` | Douay-Rheims, King James, Coverdale psalter, one JSON per book |
| `propers-1962.json`, `propers-pre55.json`, `ordo.json` | Traditional Mass propers and Ordinary, Latin and English |
| `chant.json`, `hymns.json` | Gregorian chant (GABC) and public-domain hymns |
| `bcp-office.json` | 1662 Mattins, Evensong and collects |
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
explicit source-review status. Null calendars mean locality-dependent or not yet
verified; they must never be silently treated as Gregorian.

The launcher is an accessible modal layer over the existing `.wrap`. The normal
page becomes inert while open. It restores focus and scroll on exit. The old tab
router ignores slash-prefixed routes so hash history belongs to Sanctuary until
exit. The launcher owns home, hierarchical detail and search screens; it never
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

`tools/build_traditions.py` validates parent links, guide mappings and URLs, emits
share stubs and captures original family artwork using the vellum/penwork from
`tools/card.html`. `--check` verifies exact stub contents, PNG dimensions and the
512-file project budget. Family artwork is shared intentionally; source claims
require human review even if the generator and browser tests pass.

`tests/test_sanctuary.py` covers lazy loading, routes/history, hierarchy, focus,
controller input, search, guide handoff, recent guides, Sources aggregation,
Add text, live-session controls, Breviary text loading, build reproducibility,
and screenshots at 390/1920 px under light/dark system preferences. External
network services are excluded, not mocked as successful. The read-only
`tools/audit_tradition_sources.py` reports source reachability for the outstanding
editorial audit without asserting that reachable content confirms each claim.
