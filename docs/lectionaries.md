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
- The 1979 Eucharist uses the **original 1979 three-year Sunday lectionary**;
  the Office uses the two-year Daily Office lectionary. Morning uses the Old Testament
  and Epistle in Year One, the Old Testament and Gospel in Year Two; Evening uses
  the remaining reading. Holy-day pairs and special Holy Week distributions take
  precedence. Noonday and Compline retain their fixed short readings.
- Hapgood Vespers and Matins can print the ordinary kathismata and the Sunday
  Resurrection Gospel. Bright Week has no kathisma. The ordinary course is suppressed
  in the Great Fast and Holy Week, pending their special tables. The existing site's
  Byzantine calendar uses **Gregorian Pascha**, not the Orthodox Paschalion.
- Local Coptic citations are placed in the Pauline, Catholic Epistle, Acts, Psalm
  and Gospel positions separately. Armenian and East Syriac selections likewise stay
  in their respective Scripture positions. Ambrosian and Mozarabic selections enter
  the reading portions without substituting the Roman calendar.

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

The Episcopal Church adopted the RCL for Sundays beginning Advent 2007; see
[the Episcopal Church's lectionary explanation](https://www.episcopalchurch.org/worship-prayer/lectionary/).
The historical 1979 selection must not be described as today's Episcopal RCL.
The 1979 guides remain **Guided**: local transfers, optional offices and unbundled
2 Esdras still require the book. These limits are not changed to Green by adding a reader.

Kathisma appointments were checked against the OCA's
[Matins table](https://www.oca.org/liturgics/outlines/kathisma-readings-at-matins) and
[Vespers table](https://www.oca.org/liturgics/outlines/kathisma-readings-at-vespers).
Only the ancient reading appointments are used; modern translated prayer text is
not copied. Parish abbreviations and feast/vigil exceptions still require the local ordo.

## Still to complete

These are substantive imports, not automatically completed by the local reader:

| Item | Remaining source work |
| --- | --- |
| Mercersburg | Proofread the 1867 Gospel/Epistle propers and separate evening table; its four Sundays before Advent must not be replaced by the 1662 calendar. |
| Coptic | Import the Katameros with the Coptic fixed and movable calendar and local commemorations. |
| Armenian | Verify the annual movable calendar and its own lesson table. |
| East Syriac | Transcribe and verify the Hudra/Maclean seasonal lesson tables. |
| Ambrosian | Choose and verify the historical or modern edition; six-week Advent and the modern three-year calendar differ. |
| Mozarabic | Verify the historic Liber Commicus and the edition used; the modern missal cannot be silently substituted. |
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
