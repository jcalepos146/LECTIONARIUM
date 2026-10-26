# Lectionary implementation and remaining work

The Claude transcript supplied on 25 October 2026 was compared with GitHub main
after PR #8 merged. PRs #1–8 already contain the completed text imports, participation
question, Sanctuary default, interdenominational preview, homepage complete-text list,
WIP page, Wesley services and Psalter, RCA lessons, Lutheran offices and Hapgood offices.
These changes should not be imported a second time.

## This change

- Every service has a **Lectionary calendar and Bible** panel with a date picker.
  Extra citations are rendered from the bundled Bible and saved locally for exactly
  one service, hour and date. Clearing them restores the source appointments.
  No remote Bible API, account, or shared storage is involved.
- The 1979 Eucharist defaults to the **current Episcopal RCL source calendar**.
  Automatic RCL citations are not yet bundled: enter the church calendar's citations
  in the reader. The original 1979 three-year table remains an explicit historical
  study option in the calendar selector. Its A/B/C rotation now follows the book's
  rule: Year A begins in Advent of years divisible by three. The Office uses the
  current two-year Daily Office lectionary. Morning uses the Old Testament
  and Epistle in Year One, the Old Testament and Gospel in Year Two; Evening uses
  the remaining reading. Holy-day pairs and special Holy Week distributions take
  precedence. Appointed psalms use the existing **1979 Psalter**, preserving its
  verse numbering rather than applying it to KJV verses. Noonday and Compline
  retain their fixed short readings.
- Hapgood Vespers and Matins can print the ordinary kathismata and the Sunday
  Resurrection Gospel. Bright Week has no kathisma. The ordinary course is suppressed
  in the Great Fast and Holy Week, pending their special tables. The existing site's
  Byzantine calendar uses **Gregorian Pascha**, not the Orthodox Paschalion.
- Coptic Orthodox appointments now cover every supported date. The Liturgy's
  Pauline, Catholic Epistle, Acts, Psalm and Gospel readings enter their own positions.
  Matins, Vespers and Holy Week hours are separate choices in the reader. A day
  with only Holy Week hours does not borrow those readings for the historical Mass.
  A separate Catholic/local profile requires its own citations and does not load
  the Orthodox snapshot.
  Armenian and East Syriac local selections likewise stay
  in their respective Scripture positions. Ambrosian and Mozarabic selections enter
  the reading portions without substituting the Roman calendar.
- Current source links identify the **Armenian Apostolic Eastern Prelacy**,
  **Assyrian Church of the East**, **Archdiocese of Milan** and **Toledo**.
  These do not assert that Catholic, Orthodox and other branches share a calendar.
  The displayed historical service orders remain historical even when used with
  current reading appointments. These profiles do not import a complete table.
- The current **RCUS** profile accepts the congregation's Scripture selections.
  Its present Directory of Worship does not supply a fixed daily reading cycle;
  the historical Mercersburg order is not assigned an unrelated church's cycle.

## Sources and review limits

1979 citations: [Justus lectionary PDF](https://justus.anglican.org/resources/bcp/lectionary.pdf),
original printed pages 888–1001. The readable source JSON records the PDF page
of each row, the historical-edition distinction and corrected transcription errors.
Parenthetical verses are included. The first alternative lesson is selected.
The source PDF has a number of typographical errors; importing its text blindly
would produce impossible references. Its formatting header credits Charles Wohlers,
Satucket Software, P. O. Box 227, East Bridgewater, Massachusetts 02333,
chadwohl@satucket.com. It describes a WordPerfect 8 conversion of the 1979 text,
allows electronic redistribution without a fee provided the header is retained,
and warns that it is not a certified edition. This repository redistributes citations
and provenance, not the PDF or its layout. Scripture is the existing public-domain
King James Bible, with the existing Douay-Rheims fallback for missing deuterocanonical
passages. Some verse numbering differs, notably 3 John 14–15.
Six Psalm fields in the original extraction had absorbed the opening letters of
the adjacent Acts citation. Those artifacts have been removed and recorded in
the source's corrections, preserving the actual Psalm appointment.

The Episcopal Church adopted the RCL for Sundays beginning Advent 2007; see
[the Episcopal Church's lectionary explanation](https://www.episcopalchurch.org/worship-prayer/lectionary/).
The historical 1979 selection must not be described as today's Episcopal RCL.
The [current Episcopal calendar](https://lectionary.episcopalchurch.org/) is
linked to the selected month. The CCT's
[RCL permissions policy](https://www.commontexts.org/rcl/permissions/) permits
certain congregational and nonprofit uses with attribution but requires written
permission for other organizations and publishers. This repository has no record
of that permission or an established qualifying use, so this change does not
redistribute the complete RCL table or claim permission. This affects the imported
table, not the ability to enter citations locally or visit the church's calendar.
The 1979 guides remain **Guided**: local transfers, optional offices and unbundled
2 Esdras still require the book. These limits are not changed to Green by adding a reader.

Kathisma appointments were checked against the OCA's
[Matins table](https://www.oca.org/liturgics/outlines/kathisma-readings-at-matins) and
[Vespers table](https://www.oca.org/liturgics/outlines/kathisma-readings-at-vespers).
Only the ancient reading appointments are used; modern translated prayer text is
not copied. Parish abbreviations and feast/vigil exceptions still require the local ordo.

### Coptic calendar provenance

The citation-only snapshot was generated from
[pierresaid/katameros-api](https://github.com/pierresaid/katameros-api/tree/62094eb045f067f6082edfc230a993c3d3e64668),
commit `62094eb045f067f6082edfc230a993c3d3e64668`. The upstream is a community
implementation of the Coptic Orthodox Katameros, under the MIT license retained
in `tools/texts/katameros-LICENSE.txt`. Its fixed dates, ordinary Sundays,
Nineveh, Great Lent, Holy Week and Pentecost periods are evaluated upstream;
the generated appointments cover **2025-11-30 through 2030-11-30** inclusive.
The 1,827 dates reference 221 distinct day tables. This is a versioned community
dataset, not an official Coptic Catholic calendar or a claim of parish approval.

The Resurrection appointment was compared with the church-published
[CopticChurch.net readings for 12 April 2026](https://copticchurch.net/readings?g_day=12&g_month=04&g_year=2026).
That date is Coptic Pascha; Gregorian Easter on 5 April is Coptic Palm Sunday.
The browser suite checks the distinction, reading positions, separate hours,
Holy Week without a separate Liturgy appointment, and the supported-range limit.
These checks are not an independent ecclesiastical review of every appointment.

Only reading type, book identifier and citation are exported from the upstream
DTOs. No modern Bible translations, prayer text or Synaxarium are serialized or
committed. The 95 MB upstream database is an optional generation input, never a
runtime dependency. Scripture is rendered from the site's public-domain Bibles.
`Sir 8:1-22` and `Dan 14:1-42` explicitly use Douay-Rheims because those chapters
are not complete in the bundled KJV Apocrypha. Translation and numbering may
differ from a church's approved edition.

Three references require review. The original citation is preserved and a note
replaces the Scripture block, preventing a misleading partial reading:

| Upstream reference | Issue |
| --- | --- |
| Eph 2:1-23 | Chapter 2 has only 22 verses. |
| Ps 101:1,9 | Psalm 101 has no verse 9 in the stated English numbering. |
| Ezek 21:33-37 | The source uses a chapter division absent from the bundled Bibles; no unverified mapping is applied. |

To regenerate, install .NET SDK 10, clone the pinned upstream into the ignored
cache, then run the optional exporter. The final validation/packing step uses only
Python and runs offline in CI:

```sh
git clone https://github.com/pierresaid/katameros-api.git tools/cache/katameros-api
git -C tools/cache/katameros-api checkout 62094eb045f067f6082edfc230a993c3d3e64668
dotnet run --project tools/coptic-export/Export.csproj \
  --property:KatamerosRoot="$PWD/tools/cache/katameros-api" -- \
  "$PWD/tools/cache/katameros-api/Core" 2025-11-30 2030-11-30 \
  "$PWD/tools/cache/coptic-export.json"
python3 tools/coptic_lectionary.py --from-export tools/cache/coptic-export.json
python3 tools/coptic_lectionary.py --check
```

For the linked calendars, see the
[Armenian Prelacy annual readings](https://westernprelacy.org/daily-bible-readings/),
[Mar Yosip's 2026 Assyrian table](https://www.maryosipparish.org/documents/assyrian/propers2026.html),
[Milan's current Ambrosian readings](https://www.chiesadimilano.it/letture-rito-ambrosiano),
[Toledo's current rite information](https://www.catedralprimada.es/culto/rito-hispano-mozarabe/),
and the [current RCUS worship directory](https://rcus.org/worship/).
Mar Yosip's linked table covers 2026 Sundays and principal feasts, not every
weekday or future year. Toledo's public rite page is not a daily lectionary.

## Still to complete

These are substantive imports, not automatically completed by the local reader:

| Item | Remaining source work |
| --- | --- |
| Episcopal RCL | Establish redistribution terms, import the Episcopal adaptation and both Old Testament tracks, and verify feast transfers. The current link is not an automatic local table. |
| Coptic | Resolve the three flagged references, independently review the complete snapshot, and support local/Catholic exceptions. Automatic Orthodox appointments are implemented for all supported dates. |
| Armenian | Import and verify the current annual calendar. One published October 2026 PDF has an impossible Song 8:14–9:16 reference and a duplicate day label; it cannot be imported blindly. |
| East Syriac | Import the current Assyrian annual appointments and establish separate Ancient Church/Chaldean profiles. Avoid treating undated unused Sunday rows as appointed dates. |
| Ambrosian | Import the current Milan calendar, with its six-week Advent and its own cycle alignment. The user selected current calendars, not the historical table. |
| Mozarabic | Import and verify the modern Liber Commicus and current ordo. The user selected the current Hispano-Mozarabic calendar; the historic Missale mixtum is not a substitute. |
| Mercersburg historical comparison | Optional future work: the 1867 proper lessons and separate evening table. The current RCUS profile already supports congregational selections without inventing a fixed calendar. |
| Byzantine | Great Fast/Holy Week kathismata, feast Vespers readings, Pentecostarion Matins Gospels, Julian Pascha, and local calendar/vigil exceptions. |
| Other Prayer Books | The 1637, 1789 and 1892 propers still use an explicitly labeled 1662 comparison. Later books were deferred in the transcript. |
| Modern Hours and modern translations | Text-specific reuse permission is still needed; citations and public-domain substitutes do not make these approved texts complete. |

The transcript also proposed future Ethiopian and West Syriac liturgies, Theodore
and Nestorius, Maclean offices, Presbyterian evening worship, Old Catholic texts,
and more Protestant forms. They are not present in this change. Hapgood's 1906
preface (p. iv) explicitly says he omitted the Midnight Office; importing one from
that edition, as proposed in the transcript, is impossible. A different historical
source is required.

The source JSON is packed with `python3 tools/bcp_lectionary.py`; `--check` verifies
that the committed runtime data matches it. Calendar boundary, Gospel placement,
Bright Week, local reading isolation and invalid-input regressions run in the browser suite.
