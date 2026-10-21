# Text sources still to import

*Generated from `data/text-sources.json` by `python3 tools/text_sources.py --md`. Edit the JSON, not this file.*

Where the texts still missing from each rite can come from, in the order they should be imported. A source listed here is a lead, not a clearance: check the exact scan, edition and territory before extracting, as docs/source-review.md requires. Run `python3 tools/text_sources.py --audit` to re-check every Internet Archive identifier.

Reviewed 2026-10-21. Families are taken in this order: Catholic, Anglican, Eastern Orthodox, Oriental Orthodox and Church of the East, Lutheran, Reformed, Old Catholic.

## Rights labels

- **pd**: Published before 1931: public domain in the United States. Print after checking the scan matches the edition named.
- **pd-reprint**: A later facsimile or reprint of a pre-1931 text. The text is public domain; transcribe from it but cite the original edition.
- **ancient**: Latin, Greek, Syriac or Ge'ez liturgical text of ancient or medieval origin in a later edition. Print what is traceable to a pre-1931 source; leave out anything newly composed for that edition.
- **open**: Openly licensed data or software (licence named in the note). Check that the licence actually covers the text, not only the code.
- **check-renewal**: United States publication 1931-1963. Public domain only if the copyright was not renewed: search the Copyright Office renewal records before importing.
- **check-uraa**: Foreign publication 1931 or later. May have had its US copyright restored; treat as protected unless the source-country term had expired by 1996.
- **permission**: In copyright. Cite and cue it; reproduce only with written permission from the holder named in the note.
- **reference**: Study or calendar reference only. Not a text to print.
- **crown-uk**: Public domain outside the United Kingdom; Crown rights in the UK (existing project policy for the 1662 Prayer Book).

## Summary

| # | Gap | Now | Printable leads | Blocked on |
|---|---|---|---|---|
| 1 | [roman-modern-mass](#roman-modern-mass) | guide | 6 | English collects, prefaces and Eucharistic Prayers II-IV: ICEL permission (icelweb.org); Latin new compositions: Libreria Editrice Vaticana permission |
| 2 | [liturgy-of-the-hours](#liturgy-of-the-hours) | guide | 5 | English antiphons, responsories, intercessions and prayers: ICEL permission; Latin new compositions: Libreria Editrice Vaticana permission |
| 3 | [divine-worship-mass](#divine-worship-mass) | guide | 4 | Divine Worship: The Missal (2015) itself: permission from the Congregation for Divine Worship via the Ordinariates |
| 4 | [divine-worship-office](#divine-worship-office) | full (Prime in outline) | 2 | Divine Worship: Daily Office (2020/21): permission |
| 5 | [byzantine-catholic](#byzantine-catholic) | order (Liturgy), guide (Office) | 13 | Byzantine Daily Worship, the Ruthenian Divine Liturgy (2007) and current UGCC books: permission from the issuing eparchies |
| 6 | [dominican-mass](#dominican-mass) | none (Office complete) | 2 | nothing |
| 7 | [ambrosian](#ambrosian) | none | 6 | current Ambrosian Missal and Lectionary: Archdiocese of Milan permission |
| 8 | [mozarabic](#mozarabic) | none | 6 | Missale Hispano-Mozarabicum (1991-94): Archdiocese of Toledo permission |
| 9 | [braga](#braga) | none | 1 | Braga breviary: not located |
| 10 | [religious-order-uses](#religious-order-uses) | none | 4 | Premonstratensian and Carmelite breviaries: not located; modern Carthusian books: not public |
| 11 | [zaire-use](#zaire-use) | none | 0 | Missel romain pour les diocèses du Zaïre: permission from the Episcopal Conference of the Democratic Republic of the Congo |
| 12 | [alexandrian-catholic](#alexandrian-catholic) | none | 5 | Agpeya in public-domain English: not located; Katameros (Coptic lectionary) data: not located |
| 13 | [west-syriac-catholic](#west-syriac-catholic) | none | 4 | Shehimo in public-domain English: not located |
| 14 | [east-syriac-catholic](#east-syriac-catholic) | none | 5 | Syro-Malabar Raza (1986) and current Chaldean books: permission |
| 15 | [armenian-catholic](#armenian-catholic) | none | 3 | Armenian Book of Hours in public-domain English: not located |
| 16 | [anglican-prayer-books](#anglican-prayer-books) | none (1662 Office only, inside the Ordinariate) | 17 | Canada 1962, Ireland 2004, South Africa 1954, India 1960 supplement, ACNA 2019, Common Worship: in copyright; each church's permissions policy applies |
| 17 | [anglo-catholic-missals](#anglo-catholic-missals) | none | 1 | English Missal 1912 first edition: not located on the Internet Archive |
| 18 | [anglican-music-and-psalter](#anglican-music-and-psalter) | partial (hymns.json) | 4 | The Hymnal 1940 and 1982: Church Publishing, in copyright |
| 19 | [orthodox-byzantine](#orthodox-byzantine) | order / guide | 3 | Lenten Triodion and Festal Menaion (Mother Mary and Ware), HTM Pentecostarion, Lambertsen Menaion, Ephrem Lash: in copyright; ask each translator or publisher |
| 20 | [western-rite-orthodox](#western-rite-orthodox) | none | 1 | St Andrew Service Book and Orthodox Missal: Antiochian Archdiocese permission |
| 21 | [oriental-orthodox](#oriental-orthodox) | none | 6 | Agpeya, Katameros, Shehimo, Armenian Book of Hours and Ethiopian Book of Hours in public-domain English: not located; Hudra (1960s Trichur edition): check before use |
| 22 | [lutheran](#lutheran) | none | 8 | Lutheran Service Book (CPH), Evangelical Lutheran Worship and LBW (Augsburg Fortress), Christian Worship (NPH): in copyright; The Lutheran Hymnal (1941) and Service Book and Hymnal (1958): renewal status unchecked |
| 23 | [reformed](#reformed) | none | 8 | Book of Praise (Canadian Reformed), Psalter Hymnal, Trinity Psalter Hymnal, Book of Common Worship 1993/2018, modern Dort translations: in copyright |
| 24 | [old-catholic](#old-catholic) | none | 0 | no candidate source found yet |

## Catholic

### 1. roman-modern-mass

Catalog: `roman-modern` · rite `n` · Mass · now **guide**

Missing: entrance and communion antiphons; collect; prayer over the offerings; prefaces; Eucharistic Prayers II-IV; prayer after communion; English Order of Mass.

No public-domain English exists for the 1970/2002 Missal. Three steps reach the most text: (1) print the Graduale Romanum Introit and Communion, which the GIRM allows in place of the Missal antiphons, from GregoBase (CC0) using the Ordo cantus Missae assignments; (2) map each oration to its ancient source and print the public-domain Latin with a public-domain English where one exists; (3) offer the Roman Canon (already printed) as the default Eucharistic Prayer. Collects composed after 1965, the new prefaces and Eucharistic Prayers II-IV stay cued unless ICEL (English) or the Libreria Editrice Vaticana (Latin) grants permission.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Ordo cantus Missae — Assignments are facts; the chants themselves come from GregoBase. Controlled-lending scan; the 1988 editio altera is item OCMissae. ([ordocantusmissae0000cath](https://archive.org/details/ordocantusmissae0000cath)) | 1972 | la | which chant Introit and Communion belong to each day | reference |
| GregoBase chant database — CC0, already the project's chant source. ([link](https://gregobase.selapa.net/)) | | la | Introit; Communion; Gradual; Alleluia texts with notation | open |
| The Gelasian Sacramentary (ed. H. A. Wilson) ([gelasiansacrame00gelagoog](https://archive.org/details/gelasiansacrame00gelagoog)) | 1894 | la | ancient sources of collects, prayers over the offerings and after communion | pd |
| The Gregorian Sacramentary under Charles the Great (ed. H. A. Wilson) ([gregoriansacrame00cath](https://archive.org/details/gregoriansacrame00cath)) | 1915 | la | ancient sources of orations and prefaces | pd |
| Sacramentarium Leonianum (ed. C. L. Feltoe) ([sacramentariuml00feltgoog](https://archive.org/details/sacramentariuml00feltgoog)) | 1896 | la | ancient sources of orations and prefaces | pd |
| Ancient Collects and Other Prayers (W. Bright) ([ancientcollects00briggoog](https://archive.org/details/ancientcollects00briggoog)) | 1862 | en | public-domain English for many of the ancient orations | pd |
| Missale Romanum (Paul VI) — Libreria Editrice Vaticana. Use to identify which ancient prayer each oration reproduces; do not copy new compositions. ([missale-romanum-pauli-pp-vi-1970-concilii-vaticno-ii](https://archive.org/details/missale-romanum-pauli-pp-vi-1970-concilii-vaticno-ii)) | 1970 | la | the official Latin of every proper, for collation | permission |
| Divinum Officium, Ordo Missae (Latin) — MIT. The English file beside it (English/Ordo/OrdoN.txt) is the 2010 ICEL translation and is not covered by the MIT licence; do not import it. ([link](https://github.com/DivinumOfficium/divinum-officium/blob/master/web/www/missa/Latin/Ordo/OrdoN.txt)) | | la | Latin Order of Mass with rubrics | open |

Blocked: English collects, prefaces and Eucharistic Prayers II-IV: ICEL permission (icelweb.org); Latin new compositions: Libreria Editrice Vaticana permission.

### 2. liturgy-of-the-hours

Catalog: `roman-modern` · rite `loth` · Office · now **guide**

Missing: hymns; antiphons; responsories; Office of Readings second readings; intercessions; concluding prayers.

Most of the Office is older than its 1971 edition. Hymns: the Latin originals are public domain (Divinum Officium's breviary hymns, noting where the 1971 hymnal restored pre-1632 wording), with English from the English Hymnal and The Hymner. Second readings in the Office of Readings are patristic: print them from the Schaff Ante-Nicene and Nicene Fathers on CCEL once the two-year and one-year cycles are tabulated (the tables are facts). Concluding prayers are the Missal collects, so they follow the Mass plan. Antiphons and responsories are mostly Scripture and can be shown as the verse in Douay-Rheims, labelled as such. Intercessions are modern compositions and stay cued.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Divinum Officium breviary data — MIT; already the source of the traditional breviaries. ([link](https://github.com/DivinumOfficium/divinum-officium)) | | la | Latin hymn texts | open |
| The English Hymnal ([theenglishhymnal00milfuoft](https://archive.org/details/theenglishhymnal00milfuoft)) | 1906 | en | English translations of the Office hymns | pd |
| The Hymner (translations of the Sarum breviary hymns) ([TheHymner1905](https://archive.org/details/TheHymner1905)) | 1905 | en | English translations of the Office hymns | pd |
| Hymns Ancient and Modern ([hymnsancientand01unkngoog](https://archive.org/details/hymnsancientand01unkngoog)) | 1904 | en | English translations of the Office hymns | pd |
| Ante-Nicene and Nicene and Post-Nicene Fathers (Schaff) — 1885-1900 translations. Wording differs from the breviary's own; label the translator. ([link](https://www.ccel.org/fathers.html)) | | en | Office of Readings patristic readings | pd |
| Te decet hymnus (A. Lentini): the Liturgia Horarum hymnal with sources ([te-decet-hymnus-1984](https://archive.org/details/te-decet-hymnus-1984)) | 1984 | la | which hymn is sung when, and the source of each text | reference |
| Liturgia Horarum, textus inserendi — Libreria Editrice Vaticana. Reference for tables only. ([liturgia-horarum-textus-inserendi-2005](https://archive.org/details/liturgia-horarum-textus-inserendi-2005)) | 2005 | la | collation of later additions | permission |

Blocked: English antiphons, responsories, intercessions and prayers: ICEL permission; Latin new compositions: Libreria Editrice Vaticana permission.

### 3. divine-worship-mass

Catalog: `divine-worship` · rite `o` · Mass · now **guide**

Missing: Divine Worship collects, secrets and post-communions (now filled from the 1962 English); proper prefaces; offertory and communion sentences.

Divine Worship's propers descend from the Anglican Missal tradition. Replace the 1962 English fallback with the 1921 Anglican Missal, which prints the whole year in Prayer Book English, and the 1928 American collects where Divine Worship uses them. Mark the result 'Anglican Missal wording' rather than claiming Divine Worship's text.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| The Anglican Missal ([anglicanmissal00churuoft](https://archive.org/details/anglicanmissal00churuoft)) | 1921 | en | full propers for the year in traditional English; prefaces; Ordinary | pd |
| Book of Common Prayer, USA 1928 (Society of Archbishop Justus transcription) ([link](https://justus.anglican.org/resources/bcp/1928/BCP_1928.htm)) | 1928 | en | collects Divine Worship takes from the 1928 book | pd |
| The Sarum Missal in English (A. H. Pearson) ([sarummissalinen00unkngoog](https://archive.org/details/sarummissalinen00unkngoog)) | 1884 | en | sequences and English-use propers | pd |
| The Sarum Missal in English (F. E. Warren), part 1 ([cu31924092460033](https://archive.org/details/cu31924092460033)) | 1911 | en | sequences and English-use propers | pd |
| The American Missal — Controlled-lending scan. ([americanmissalbe0000unse](https://archive.org/details/americanmissalbe0000unse)) | 1931 | en | American-use propers | check-renewal |
| The English Missal for the Laity — British 1933 edition; look for the 1912 first edition by W. Knott instead. ([englishmissalfor0000vari](https://archive.org/details/englishmissalfor0000vari)) | 1933 | en | English Missal wording | check-uraa |

Blocked: Divine Worship: The Missal (2015) itself: permission from the Congregation for Divine Worship via the Ordinariates.

### 4. divine-worship-office

Catalog: `divine-worship` · rite `dwdo` · Office · now **full (Prime in outline)**

Missing: Prime; Terce, Sext and None; office hymns.

The Day Hours of the Church of England supplies the little hours in Prayer Book English with the Coverdale psalter already in the project.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| The Day-Hours of the Church of England ([thedayhours00unknuoft](https://archive.org/details/thedayhours00unknuoft)) | 1877 | en | Prime; Terce; Sext; None; office hymns | pd |
| The Day-Hours of the Church of England (first edition) ([dayhourschurche00unkngoog](https://archive.org/details/dayhourschurche00unkngoog)) | 1858 | en | collation | pd |
| The Monastic Diurnal (Episcopal) — Controlled-lending scan. ([monasticdiurnalo0000epis](https://archive.org/details/monasticdiurnalo0000epis)) | 1932 | en | little hours in English | check-renewal |

Blocked: Divine Worship: Daily Office (2020/21): permission.

### 5. byzantine-catholic

Catalog: `byzantine-catholic`, `catholic-ukrainian`, `catholic-ruthenian`, `catholic-melkite` · rite `b, byz` · Divine Liturgy and Office · now **order (Liturgy), guide (Office)**

Missing: prayers of the Divine Liturgy; troparia and kontakia of the day; Sunday resurrection hymns in eight tones; Menaion propers; Triodion and Pentecostarion propers.

Transcribe Hapgood (1906) for the fixed Liturgy and Vespers/Matins prayers, separating Chrysostom and Basil (docs/source-review.md notes the companion's OCR is unreliable). Add the Sunday Octoechos and the General and Ferial Menaia from Orloff. For Triodion, Pentecostarion and the monthly Menaion, no complete public-domain English exists: print the Greek or Church Slavonic originals and cue the English. These are Greco-Russian texts; Ruthenian and Ukrainian recensions differ in places and must say so.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (I. F. Hapgood) ([cu31924029363128](https://archive.org/details/cu31924029363128)) | 1906 | en | Divine Liturgies of Chrysostom, Basil and the Presanctified; Vespers; Matins; occasional services | pd |
| The Divine Liturgy of the Holy Orthodox Catholic Apostolic Graeco-Russian Church (P. Kuvochinsky) ([divineliturgyofh00orthuoft](https://archive.org/details/divineliturgyofh00orthuoft)) | 1909 | en | second witness for the Liturgy | pd |
| The Octoechos: Sunday services in eight tones (N. Orloff) ([link](https://www.ponomar.net/data/octoechos_orloff.pdf)) | 1898 | en | Sunday resurrection troparia, kontakia and stichera | pd |
| The General Menaion (N. Orloff) — A 1969 facsimile is on the Internet Archive as generalmenaionor0000orth. ([link](https://www.ponomar.net/data/orloff_general_menaion.pdf)) | 1899 | en | common services for classes of saints | pd |
| The Ferial Menaion: services for the twelve great feasts (N. Orloff) — 1969 facsimile of the 1900 edition; controlled lending. ([ferialmenaionorb0000orth](https://archive.org/details/ferialmenaionorb0000orth)) | 1900 | en | great-feast propers | pd-reprint |
| Offices from the Service-Books of the Holy Eastern Church (R. F. Littledale) ([officesfromserv00unkngoog](https://archive.org/details/officesfromserv00unkngoog)) | 1863 | en | selected Triodion and Menaion offices | pd |
| Hymns of the Eastern Church (J. M. Neale) ([hymnseasternchu01nealgoog](https://archive.org/details/hymnseasternchu01nealgoog)) | 1862 | en | selected hymns in verse | pd |
| Parakletike (Great Octoechos), Greek ([parakltiktoiokt00churgoog](https://archive.org/details/parakltiktoiokt00churgoog)) | 1858 | grc | complete weekday and Sunday tone propers | pd |
| Menaia of the whole year, Greek ([menaiatouolouen00churgoog](https://archive.org/details/menaiatouolouen00churgoog)) | 1888 | grc | monthly Menaion | pd |
| Triodion katanyktikon, Greek ([triodion-katanyktikon-periechon-hapasan-1](https://archive.org/details/triodion-katanyktikon-periechon-hapasan-1)) | 1876 | grc | Lenten Triodion | pd |
| Horologion to mega, Greek ([hrologiontomega00koutgoog](https://archive.org/details/hrologiontomega00koutgoog)) | 1838 | grc | Horologion | pd |
| Sluzhebnyia minei (September-November), Church Slavonic ([sluzhebnyiaminei01orthuoft](https://archive.org/details/sluzhebnyiaminei01orthuoft)) | 1886 | cu | Slavonic Menaion | pd |
| Ponomar project (calendar, menologion and service data) — GPL-3.0. Check the provenance of each text file: the repository and ponomar.net also carry modern translations that are not theirs to license. ([link](https://github.com/typiconman/Ponomar)) | | en, cu, el | menologion and service-assembly rules | open |

Blocked: Byzantine Daily Worship, the Ruthenian Divine Liturgy (2007) and current UGCC books: permission from the issuing eparchies.

### 6. dominican-mass

Catalog: `dominican` · rite `new: Dominican Mass` · Mass · now **none (Office complete)**

Missing: Dominican Ordinary; Dominican propers and calendar.

Divinum Officium already carries the Dominican Ordinary and the 1962 Dominican calendar, so a Dominican Mass guide can reuse the existing 1962 propers plus the Order's own feasts from the 1933 Missal.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Divinum Officium, Dominican Ordo Missae (Latin and English) — MIT. Check the English file's translation source before import. ([link](https://github.com/DivinumOfficium/divinum-officium/blob/master/web/www/missa/Latin/Ordo/OrdoOP.txt)) | | la, en | Dominican Ordinary | open |
| Missale S. Ordinis Praedicatorum ([missalesordinisp00unse](https://archive.org/details/missalesordinisp00unse)) | 1933 | la | Dominican propers | ancient |
| A History of the Dominican Liturgy (W. R. Bonniwell) ([historyofdominic00bonn](https://archive.org/details/historyofdominic00bonn)) | 1944 | en | rubrics and differences from the Roman rite | reference |

### 7. ambrosian

Catalog: `ambrosian` · rite `new` · Mass and Office · now **none**

Missing: Ambrosian Ordinary; Ambrosian propers; Ambrosian calendar (six-week Advent); Ambrosian lectionary; Ambrosian Office.

Start with the Mass: Latin Ordinary from Divinum Officium and the 1909 English Ordinary and Canon. Propers and lectionary come from the 1904 Manuale Ambrosianum (medieval) and the 1712 Missal, labelled as the pre-1976 use. The current 1976/1981 Missal and 2008 lectionary are in copyright. The Ambrosian calendar needs its own computation before any day is mapped.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Divinum Officium, Ambrosian Ordo Missae — MIT. Its English counterpart uses modern ICEL-style responses; check before import. ([link](https://github.com/DivinumOfficium/divinum-officium/blob/master/web/www/missa/Latin/Ordo/OrdoA.txt)) | | la | Latin Ordinary | open |
| The Ambrosian Liturgy: the Ordinary and Canon of the Mass ([ambrosianliturgy00cathuoft](https://archive.org/details/ambrosianliturgy00cathuoft)) | 1909 | la, en | English Ordinary and Canon | pd |
| Manuale Ambrosianum (ed. M. Magistretti), part 2 ([manualeambrosian02cath](https://archive.org/details/manualeambrosian02cath)) | 1904 | la | propers and Office for the year; lectionary | pd |
| Manuale Ambrosianum (ed. M. Magistretti), part 3 ([manualeambrosian03cath](https://archive.org/details/manualeambrosian03cath)) | 1904 | la | propers and Office for the year | pd |
| Missale Ambrosianum ([10869665bsb](https://archive.org/details/10869665bsb)) | 1712 | la | Tridentine-era Ambrosian propers | pd |
| Manuale sive Breviarium iuxta ritum Ambrosianae ecclesiae ([bub_gb_5NAEsu90rB0C](https://archive.org/details/bub_gb_5NAEsu90rB0C)) | 1549 | la | Ambrosian Office | pd |
| Missale Ambrosianum — Archdiocese of Milan. ([MA1981](https://archive.org/details/MA1981)) | 1981 | la | current use, for collation | permission |

Blocked: current Ambrosian Missal and Lectionary: Archdiocese of Milan permission.

### 8. mozarabic

Catalog: `mozarabic` · rite `new` · Mass and Office · now **none**

Missing: Mozarabic Ordinary; propers; lectionary; Office.

The 1500 Cisneros books reprinted in Migne (Patrologia Latina 85-86) give the Missale mixtum and Breviarium gothicum complete; the Liber comicus gives the old lectionary. The restored Missale Hispano-Mozarabicum (1991-94) differs and is in copyright, so label the guide 'Cisneros use'.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Divinum Officium, Mozarabic Ordo Missae — MIT; check the English file before import. ([link](https://github.com/DivinumOfficium/divinum-officium/blob/master/web/www/missa/Latin/Ordo/OrdoM.txt)) | | la | Latin Ordinary | open |
| Liturgia Mozarabica (Migne PL 85): Missale mixtum ([liturgiamozarab00churgoog](https://archive.org/details/liturgiamozarab00churgoog)) | 1862 | la | Mass propers for the year | pd |
| Liturgia Mozarabica (Migne PL 86): Breviarium gothicum ([liturgiamozarab01churgoog](https://archive.org/details/liturgiamozarab01churgoog)) | 1862 | la | Office | pd |
| Missale mixtum (ed. A. Lesley) ([missalemixtumse00leslgoog](https://archive.org/details/missalemixtumse00leslgoog)) | 1755 | la | collation | pd |
| Liber comicus (ed. G. Morin) ([libercomicussive00moriuoft](https://archive.org/details/libercomicussive00moriuoft)) | 1893 | la | Mozarabic lectionary | pd |
| Le Liber mozarabicus sacramentorum (ed. M. Férotin) ([lelibermozarabic06cath](https://archive.org/details/lelibermozarabic06cath)) | 1912 | la | earlier sacramentary | pd |

Blocked: Missale Hispano-Mozarabicum (1991-94): Archdiocese of Toledo permission.

### 9. braga

Catalog: `braga` · rite `new` · Mass · now **none**

Missing: Braga Ordinary and propers; Braga breviary.

The 1924 Missale Bracarense is public domain in the US and covers the Mass. No Braga breviary scan was found yet.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Missale Bracarense ([missale-bracarense-1924](https://archive.org/details/missale-bracarense-1924)) | 1924 | la | Ordinary and propers | pd |
| Cerimonial da Missa Cantada segundo o Rito Bracarense ([cerimonial-da-missa-cantada-segundo-o-rito-bracarense-1931](https://archive.org/details/cerimonial-da-missa-cantada-segundo-o-rito-bracarense-1931)) | 1931 | pt | ceremonial | reference |
| O rito bracarense (D. Serrano) ([oritobracarense00serr](https://archive.org/details/oritobracarense00serr)) | 1906 | pt | history and differences | reference |

Blocked: Braga breviary: not located.

### 10. religious-order-uses

Catalog: `carthusian`, `premonstratensian`, `carmelite` · rite `new` · Mass and Office · now **none**

Missing: Carthusian Mass and Office; Premonstratensian Mass and Office; Carmelite Mass and Office.

Each order's pre-1931 books give a historical use. Later editions (1930s-1950s) are foreign publications that may have restored US copyright; use them only for ancient texts.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Breviarium sacri Ordinis Cartusiensis ([breviariumsacri00cartgoog](https://archive.org/details/breviariumsacri00cartgoog)) | 1717 | la | Carthusian Office | pd |
| Missale Carthusiense ([missale-carthusiense](https://archive.org/details/missale-carthusiense)) | 1620 | la | Carthusian Mass | pd |
| Missale Praemonstratense ([missale-praemonstratense-1936](https://archive.org/details/missale-praemonstratense-1936)) | 1936 | la | Premonstratensian Mass | check-uraa |
| Ordinarius Praemonstratensis ([ordinariuspraemo00unse](https://archive.org/details/ordinariuspraemo00unse)) | 1485 | la | Premonstratensian rubrics | pd |
| Missale fratrum Carmelitarum ([bub_gb_PUEgJFAvalgC](https://archive.org/details/bub_gb_PUEgJFAvalgC)) | 1621 | la | Carmelite Mass | pd |
| Archdale King, the Premonstratensian rite ([kingarchdalepremonstratensianriteocr](https://archive.org/details/kingarchdalepremonstratensianriteocr)) | | en | history and differences | reference |

Blocked: Premonstratensian and Carmelite breviaries: not located; modern Carthusian books: not public.

### 11. zaire-use

Catalog: `zaire` · rite `new` · Mass · now **none**

Missing: Missel romain pour les diocèses du Zaïre (1988).

No public-domain text exists. Offer the Novus Ordo readings with an order-of-service outline and cue the Missel.


Blocked: Missel romain pour les diocèses du Zaïre: permission from the Episcopal Conference of the Democratic Republic of the Congo.

### 12. alexandrian-catholic

Catalog: `alexandrian-catholic`, `catholic-coptic`, `catholic-ethiopian`, `catholic-eritrean` · rite `new` · Liturgy · now **none**

Missing: Coptic Liturgy of St Basil; Ethiopic Liturgy; Agpeya (hours); Katameros (lectionary).

Brightman gives the Coptic and Ethiopic liturgies in English; Bute's Coptic Morning Service adds the rest of the Sunday office. The hours and the Katameros have not been found in a public-domain English edition.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Liturgies Eastern and Western, vol. 1 (F. E. Brightman) ([liturgieseastern01unknuoft](https://archive.org/details/liturgieseastern01unknuoft)) | 1896 | en | Coptic Liturgy of St Mark/Cyril and St Basil; Abyssinian (Ethiopic) Liturgy; Syrian St James; Armenian; Nestorian (East Syrian) Liturgy; Byzantine | pd |
| The Coptic Morning Service for the Lord's Day (Marquess of Bute) ([copticmorningser00coptuoft](https://archive.org/details/copticmorningser00coptuoft)) | 1908 | en | Coptic Sunday Liturgy and morning office | pd |
| The Divine Liturgy of St Mark the Evangelist (S. C. Malan) — No OCR text on this item; transcribe from the page images. ([divineliturgysa00malagoog](https://archive.org/details/divineliturgysa00malagoog)) | 1872 | en | Coptic liturgy | pd |
| The Ethiopic Liturgy (S. A. B. Mercer) ([ethiopicliturgyi00mercuoft](https://archive.org/details/ethiopicliturgyi00mercuoft)) | 1915 | en | Ethiopic liturgy and anaphoras | pd |
| The Anaphoras of the Ethiopic Liturgy — Controlled-lending scan; confirm the 1928 date on the title page. ([anaphorasofethio0000yait](https://archive.org/details/anaphorasofethio0000yait)) | 1928 | en | Ethiopic anaphoras | pd |

Blocked: Agpeya in public-domain English: not located; Katameros (Coptic lectionary) data: not located.

### 13. west-syriac-catholic

Catalog: `west-syriac-catholic`, `catholic-syriac`, `catholic-maronite`, `catholic-syro-malankara` · rite `new` · Qurbono and Office · now **none**

Missing: Liturgy of St James (West Syriac); Maronite Qurbono; Shehimo (weekday office); lectionary.

Brightman covers St James in English. The weekday office survives in Syriac editions; no public-domain English Shehimo was found.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Liturgies Eastern and Western (Brightman) ([liturgieseastern01unknuoft](https://archive.org/details/liturgieseastern01unknuoft)) | 1896 | en | Syriac Liturgy of St James | pd |
| Breviarium juxta ritum Ecclesiae Antiochenae Syrorum ([breviariumjuxta00churgoog](https://archive.org/details/breviariumjuxta00churgoog)) | 1886 | syr | Syriac Catholic office | pd |
| Officium feriale juxta ritum Ecclesiae Syrorum Maronitarum ([bub_gb_1N9NaygppuoC](https://archive.org/details/bub_gb_1N9NaygppuoC)) | 1731 | syr | Maronite weekday office | pd |
| Missale Chaldaicum iuxta ritum ecclesiae nationis Maronitarum ([bub_gb_5Eqy8WGF9aQC](https://archive.org/details/bub_gb_5Eqy8WGF9aQC)) | 1594 | syr | Maronite Qurbono | pd |
| Two Commentaries on the Jacobite Liturgy (R. H. Connolly) ([twocommentarieso00conn](https://archive.org/details/twocommentarieso00conn)) | 1913 | en | structure | reference |

Blocked: Shehimo in public-domain English: not located.

### 14. east-syriac-catholic

Catalog: `east-syriac-catholic`, `catholic-chaldean`, `catholic-syro-malabar` · rite `new` · Qurbana and Office · now **none**

Missing: Qurbana of Addai and Mari; daily office; lectionary.

This tradition is the best served: Maclean (1894) translates the daily offices with their lectionary, and the 1893 English Liturgy of Addai and Mari covers the Qurbana.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| East Syrian Daily Offices (A. J. Maclean) ([eastsyriandailyo00macluoft](https://archive.org/details/eastsyriandailyo00macluoft)) | 1894 | en | evening, night and morning offices; lectionary tables | pd |
| The Liturgy of the Holy Apostles Adai and Mari ([LiturgyAdai](https://archive.org/details/LiturgyAdai)) | 1893 | en | Qurbana with the three anaphoras | pd |
| Breviarium Chaldaicum (P. Bedjan), 3 vols., Paris and Leipzig — Archive metadata says 1867; its description gives 1886-87. ([BreviariumChaldaicum](https://archive.org/details/BreviariumChaldaicum)) | 1886 | syr | Syriac office for the year | pd |
| Missale Chaldaicum ([bub_gb_PSttGL9Rf08C](https://archive.org/details/bub_gb_PSttGL9Rf08C)) | 1767 | syr | Chaldean Mass | pd |
| The Nestorians and Their Rituals, vol. 2 (G. P. Badger) ([nestorianstheirr02badg](https://archive.org/details/nestorianstheirr02badg)) | 1852 | en | sacraments and liturgy | pd |

Blocked: Syro-Malabar Raza (1986) and current Chaldean books: permission.

### 15. armenian-catholic

Catalog: `catholic-armenian` · rite `new` · Badarak and Office · now **none**

Missing: Divine Liturgy (Badarak); Book of Hours; lectionary.

The 1862 English translation was made for Armenian Catholics and is the natural base; Conybeare adds the breviary rites and the old Jerusalem lectionary.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| The Armenian Liturgy, translated into English ([TheArmenianLiturgy](https://archive.org/details/TheArmenianLiturgy)) | 1862 | en | Divine Liturgy | pd |
| Liturgy of the Holy Apostolic Church of Armenia (S. C. Malan) ([liturgyholyapos00asdvgoog](https://archive.org/details/liturgyholyapos00asdvgoog)) | 1887 | en | Divine Liturgy | pd |
| Rituale Armenorum (F. C. Conybeare) ([ritualearmenorum00cony](https://archive.org/details/ritualearmenorum00cony)) | 1905 | en | sacraments; breviary rites; old Armenian lectionary | pd |

Blocked: Armenian Book of Hours in public-domain English: not located.

## Anglican

### 16. anglican-prayer-books

Catalog: `anglican-1549-england`, `anglican-1552-england`, `anglican-1559-england`, `anglican-1604-england`, `anglican-1662-england`, `anglican-1928-england`, `anglican-1637-scotland`, `anglican-1764-scotland`, `anglican-1929-scotland`, `anglican-1789-us`, `anglican-1892-us`, `anglican-1928-us`, `anglican-1979-us`, `anglican-1918-canada`, `anglican-1878-ireland`, `anglican-1926-ireland` · rite `new: one builder per book, reusing the 1662 Mattins/Evensong/Communion builders` · Daily Office and Holy Communion · now **none (1662 Office only, inside the Ordinariate)**

Missing: each book's Communion order; Office variants; collects; lectionary tables; calendars.

The Society of Archbishop Justus has typed transcriptions of almost every historical book. Import in order of use: US 1928, US 1979, England 1662 Communion, US 1892/1789, Canada 1918, Ireland 1926, Scotland 1929, then the 16th-17th-century books for study. Check each transcription against a scan.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| USA 1928 ([link](https://justus.anglican.org/resources/bcp/1928/BCP_1928.htm)) | 1928 | en | complete book | pd |
| USA 1979 — Widely treated as uncopyrighted (no copyright notice; Wikimedia Commons hosts it as such). Confirm the absence of a notice in a 1979 printing before import. ([link](https://justus.anglican.org/resources/bcp/formatted_1979.htm)) | 1979 | en | complete book | pd |
| USA 1892 ([link](https://justus.anglican.org/resources/bcp/1892/BCP_1892.htm)) | 1892 | en | complete book | pd |
| USA 1789 ([link](https://justus.anglican.org/resources/bcp/1789/BCP_1789.htm)) | 1789 | en | complete book | pd |
| England 1662 ([link](https://justus.anglican.org/resources/bcp/1662/1662.html)) | 1662 | en | Holy Communion and the rest of the book | crown-uk |
| England 1928 (proposed) ([link](https://justus.anglican.org/resources/bcp/CofE1928/CofE1928.htm)) | 1928 | en | complete book | pd |
| England 1559 ([link](https://justus.anglican.org/resources/bcp/1559/BCP_1559.htm)) | 1559 | en | complete book | pd |
| England 1552 ([link](https://justus.anglican.org/resources/bcp/1552/BCP_1552.htm)) | 1552 | en | complete book | pd |
| England 1549 ([link](https://justus.anglican.org/resources/bcp/1549/BCP_1549.htm)) | 1549 | en | complete book | pd |
| Scotland 1637 ([link](https://justus.anglican.org/resources/bcp/Scotland/BCP_1637.htm)) | 1637 | en | complete book | pd |
| Scotland 1929 ([link](https://justus.anglican.org/resources/bcp/Scotland/Scottish_BCP1929.pdf)) | 1929 | en | complete book | pd |
| Canada 1918 ([link](https://justus.anglican.org/resources/bcp/Canada/1918.htm)) | 1918 | en | complete book | pd |
| Ireland 1878 ([link](http://books.google.com/books?id=_cMUAAAAQAAJ)) | 1878 | en | complete book | pd |
| The First Prayer-Book of Edward VI compared with the successive revisions ([firstprayerbooko00oxfouoft](https://archive.org/details/firstprayerbooko00oxfouoft)) | 1877 | en | scan to check the 1549-1662 transcriptions | pd |
| Book of Common Prayer, USA (first printing of the 1789 book, Hall & Sellers) ([bookommray00epis](https://archive.org/details/bookommray00epis)) | 1790 | en | scan to check 1789 transcription | pd |
| Book of Common Prayer, USA ([bookcommonpraye00conggoog](https://archive.org/details/bookcommonpraye00conggoog)) | 1892 | en | scan to check 1892 transcription | pd |
| Book of Common Prayer, Canada ([bookofcommonpray0000vari_p2b8](https://archive.org/details/bookofcommonpray0000vari_p2b8)) | 1918 | en | scan to check 1918 transcription | pd |

Blocked: Canada 1962, Ireland 2004, South Africa 1954, India 1960 supplement, ACNA 2019, Common Worship: in copyright; each church's permissions policy applies.

### 17. anglo-catholic-missals

Catalog: `anglican-missal`, `english-missal` · rite `new` · Mass · now **none**

Missing: Anglican Missal Mass; English Missal Mass.

The 1921 Anglican Missal is public domain and also serves the Ordinariate gap above. The English Missal needs its 1912 first edition; later editions are British and may be restored in the US.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| The Anglican Missal ([anglicanmissal00churuoft](https://archive.org/details/anglicanmissal00churuoft)) | 1921 | en | complete Missal | pd |
| The English Missal for the Laity ([englishmissalfor0000vari](https://archive.org/details/englishmissalfor0000vari)) | 1933 | en | English Missal wording | check-uraa |
| The People's Anglican Missal in the American Edition ([bwb_Y0-CAO-217](https://archive.org/details/bwb_Y0-CAO-217)) | 1946 | en | American edition | check-renewal |
| The English Gradual ([englishgradual0000unse](https://archive.org/details/englishgradual0000unse)) | 1933 | en | English plainsong propers | check-uraa |

Blocked: English Missal 1912 first edition: not located on the Internet Archive.

### 18. anglican-music-and-psalter

Catalog: `anglican` · rite `all Anglican builders` · Music · now **partial (hymns.json)**

Missing: office hymns; pointed psalter; Merbecke.

Extend hymns.json from the English Hymnal and Hymns Ancient and Modern; point the Coverdale psalter from the 1902 Manual of Plainsong.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| The English Hymnal, with tunes ([theenglishhymnal00milfuoft](https://archive.org/details/theenglishhymnal00milfuoft)) | 1906 | en | hymns and office hymns | pd |
| Hymns Ancient and Modern ([hymnsancientand01unkngoog](https://archive.org/details/hymnsancientand01unkngoog)) | 1904 | en | hymns | pd |
| A Manual of Plainsong (Briggs and Frere) ([manualofplainson00brig](https://archive.org/details/manualofplainson00brig)) | 1902 | en | canticles and psalter pointed to Gregorian tones | pd |
| Merbecke, The Book of Common Prayer Noted (1550) ([link](https://justus.anglican.org/resources/bcp/Merbecke/Merbecke.htm)) | 1550 | en | Merbecke settings | pd |

Blocked: The Hymnal 1940 and 1982: Church Publishing, in copyright.

## Eastern Orthodox

### 19. orthodox-byzantine

Catalog: `eastern-orthodox`, `orthodox-constantinople`, `orthodox-russia`, `orthodox-oca`, `goarch`, `antiochian-america`, `rocor`, `old-calendarists` · rite `b, byz (shared with Byzantine Catholic)` · Divine Liturgy and Office · now **order / guide**

Missing: as for Byzantine Catholic; Book of Needs; Julian-calendar day mapping for Old Calendarists and Russian use.

Everything in the Byzantine Catholic plan applies. Add Shann's Book of Needs for occasional services. The orthocal port already computes Julian dates; expose it.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Book of Needs (G. V. Shann) ([link](https://www.ponomar.net/data/trebnik_shann.pdf)) | 1894 | en | occasional services | pd |
| Hapgood Service Book ([cu31924029363128](https://archive.org/details/cu31924029363128)) | 1906 | en | see Byzantine Catholic | pd |
| Typikon of the Great Church (G. Violakis) — Archive metadata gives 1900; confirm the edition year on the title page. ([typikontstou00orth](https://archive.org/details/typikontstou00orth)) | 1900 | grc | Greek ordo rules | pd |

Blocked: Lenten Triodion and Festal Menaion (Mother Mary and Ware), HTM Pentecostarion, Lambertsen Menaion, Ephrem Lash: in copyright; ask each translator or publisher.

### 20. western-rite-orthodox

Catalog: `western-rite-orthodox` · rite `new` · Mass · now **none**

Missing: Liturgy of St Gregory; Liturgy of St Tikhon.

The St Tikhon liturgy is an adaptation of the 1928 American Prayer Book and the St Gregory liturgy of the Tridentine Mass; build from the US 1928 and 1962 texts already planned, labelled as their sources, not as the Antiochian service book.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| USA 1928 Book of Common Prayer ([link](https://justus.anglican.org/resources/bcp/1928/BCP_1928.htm)) | 1928 | en | base of the St Tikhon liturgy | pd |

Blocked: St Andrew Service Book and Orthodox Missal: Antiochian Archdiocese permission.

## Oriental Orthodox and Church of the East

### 21. oriental-orthodox

Catalog: `oriental-orthodox`, `oriental-coptic`, `oriental-syriac`, `oriental-armenian`, `oriental-ethiopian`, `oriental-eritrean`, `oriental-malankara`, `oriental-assyrian`, `oriental-ancient` · rite `new (shared builders with the Eastern Catholic churches of the same tradition)` · Liturgy and Office · now **none**

Missing: liturgies; hours; lectionaries; calendars (Coptic, Ethiopian, Armenian).

Reuse the Alexandrian, West Syriac, East Syriac and Armenian sources above; Orthodox and Catholic forms differ mainly in commemorations and the filioque. The Assyrian Church of the East also uses the Urmia Takhsa.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Liturgies Eastern and Western (Brightman) ([liturgieseastern01unknuoft](https://archive.org/details/liturgieseastern01unknuoft)) | 1896 | en | Coptic, Ethiopic, Syrian, Armenian, East Syrian liturgies | pd |
| East Syrian Daily Offices (Maclean) ([eastsyriandailyo00macluoft](https://archive.org/details/eastsyriandailyo00macluoft)) | 1894 | en | Assyrian and Ancient Church of the East hours | pd |
| Liturgia Sanctorum Apostolorum Adaei et Maris (Urmia) ([liturgiasanctoru0000anon](https://archive.org/details/liturgiasanctoru0000anon)) | 1890 | syr | Takhsa | pd |
| Rituale Armenorum (Conybeare) ([ritualearmenorum00cony](https://archive.org/details/ritualearmenorum00cony)) | 1905 | en | Armenian rites and lectionary | pd |
| Coptic Morning Service (Bute) ([copticmorningser00coptuoft](https://archive.org/details/copticmorningser00coptuoft)) | 1908 | en | Coptic liturgy | pd |
| The Ethiopic Liturgy (Mercer) ([ethiopicliturgyi00mercuoft](https://archive.org/details/ethiopicliturgyi00mercuoft)) | 1915 | en | Ethiopian and Eritrean liturgy | pd |
| The Service for the Consecration of a Church according to the Coptic Rite (G. Horner) ([serviceforconsec00hornuoft](https://archive.org/details/serviceforconsec00hornuoft)) | 1902 | en | Coptic rubrics and hymn structure | reference |

Blocked: Agpeya, Katameros, Shehimo, Armenian Book of Hours and Ethiopian Book of Hours in public-domain English: not located; Hudra (1960s Trichur edition): check before use.

## Lutheran

### 22. lutheran

Catalog: `lutheran`, `common-service`, `swedish-orders`, `lcms`, `wels`, `els`, `elca`, `nalc` · rite `new` · Divine Service and Matins/Vespers · now **none**

Missing: Common Service order; introits, collects and graduals; historic one-year lectionary; Swedish High Mass.

The Common Service (1888) as printed in the Church Book and the 1917 Common Service Book is the ancestor of TLH, SBH, LBW and LSB page 15; it gives a complete historic Lutheran Divine Service with propers and the one-year lectionary. Add the Missouri Synod's 1917 English Liturgy and Agenda and the 1921 Swedish rite. LSB, ELW, TLH and SBH stay cued.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| Common Service Book of the Lutheran Church ([commonserviceb00unknuoft](https://archive.org/details/commonserviceb00unknuoft)) | 1918 | en | Common Service; Matins; Vespers; introits, collects, graduals; one-year lectionary | pd |
| Church Book for the Use of Evangelical Lutheran Congregations ([churchbookforthe00unknuoft](https://archive.org/details/churchbookforthe00unknuoft)) | 1893 | en | Common Service in its 1888 form | pd |
| Liturgy and Agenda (Missouri Synod) ([liturgyagenda00luth](https://archive.org/details/liturgyagenda00luth)) | 1918 | en | Missouri Synod English orders | pd |
| Kirchen-Agende für Evang.-Luth. Gemeinden ([kirchenagendefurevang.luth.gemeinden1902](https://archive.org/details/kirchenagendefurevang.luth.gemeinden1902)) | 1902 | de | German Missouri Synod orders | pd |
| Liturgy for Christian Congregations of the Lutheran Faith (W. Löhe) ([liturgyforchrist00lhew](https://archive.org/details/liturgyforchrist00lhew)) | 1902 | en | Löhe's orders | pd |
| The Swedish Rite: a translation of Handbok för svenska kyrkan (E. E. Yelverton) ([swedishritetrans00sven](https://archive.org/details/swedishritetrans00sven)) | 1921 | en | Church of Sweden High Mass and offices | pd |
| Kyrkohandbok ([khb-1894](https://archive.org/details/khb-1894)) | 1894 | sv | Swedish original | pd |
| Evangelical Lutheran Hymn-Book (Missouri Synod) ([evangelicalluthe09evan](https://archive.org/details/evangelicalluthe09evan)) | 1909 | en | hymns | pd |

Blocked: Lutheran Service Book (CPH), Evangelical Lutheran Worship and LBW (Augsburg Fortress), Christian Worship (NPH): in copyright; The Lutheran Hymnal (1941) and Service Book and Hymnal (1958): renewal status unchecked.

## Reformed

### 23. reformed

Catalog: `reformed`, `dort-forms`, `genevan-psalter`, `psalter-1912`, `westminster`, `scottish-psalter`, `bcw-1906`, `nrc`, `heritage-reformed`, `free-reformed`, `gereformeerde-gemeenten`, `canadian-reformed`, `urcna`, `pca`, `opc`, `pcusa`, `free-church-scotland`, `reformed-presbyterian` · rite `new` · Lord's Day worship and forms · now **none**

Missing: Dort liturgical forms in English; metrical psalters; Westminster Directory; Book of Common Worship.

Reformed worship is mostly an order plus psalms: build a Lord's Day order from the Directory or the 1906 Book of Common Worship and draw psalms from the 1650 Scottish Psalter, the 1912 Psalter and the Genevan psalms. The English Dort forms come from the 19th-century Reformed Dutch printings.

| Source | Year | Lang | Fills | Rights |
|---|---|---|---|---|
| The Psalms and Hymns, with the Catechism, Confession, Canons of Dort and Liturgy (Reformed Protestant Dutch Church) ([psahc00refo](https://archive.org/details/psahc00refo)) | 1854 | en | Dort liturgical forms in English | pd |
| The Psalms of David in Metre (Scottish Psalter) ([psalmsofdavidinm00chur](https://archive.org/details/psalmsofdavidinm00chur)) | 1814 | en | 1650 Scottish metrical psalter | pd |
| The Psalter, with Responsive Readings ([psalterwithresp00usgoog](https://archive.org/details/psalterwithresp00usgoog)) | 1912 | en | 1912 Psalter | pd |
| Les Pseaumes de David mis en rime françoise (Marot and Bèze) ([lespseaumesdedav00maro](https://archive.org/details/lespseaumesdedav00maro)) | 1660 | fr | Genevan psalter texts | pd |
| The Directory for the Publick Worship of God ([directoryforpubl00west](https://archive.org/details/directoryforpubl00west)) | 1880 | en | Westminster Directory | pd |
| The Book of Common Worship (PCUSA) ([bookofcommonwors00pres](https://archive.org/details/bookofcommonwors00pres)) | 1906 | en | Presbyterian orders and prayers | pd |
| The Book of Common Order (John Knox's Liturgy) ([bookofcommonorde00churuoft](https://archive.org/details/bookofcommonorde00churuoft)) | 1873 | en | Scottish Reformation order | pd |
| Euchologion: a Book of Common Order (Church Service Society) ([euchologionbooko00chur](https://archive.org/details/euchologionbooko00chur)) | 1877 | en | Scottish Presbyterian forms | pd |
| Hymnary.org — Check the status of each text it hosts. ([link](https://hymnary.org/)) | | en | psalm and hymn texts with tune indexes | reference |

Blocked: Book of Praise (Canadian Reformed), Psalter Hymnal, Trinity Psalter Hymnal, Book of Common Worship 1993/2018, modern Dort translations: in copyright.

## Old Catholic

### 24. old-catholic

Catalog: `old-catholic`, `union-utrecht`, `pncc`, `utrecht-netherlands`, `utrecht-germany`, `utrecht-switzerland`, `utrecht-austria`, `utrecht-czechia`, `utrecht-poland` · rite `new` · Mass · now **none**

Missing: vernacular Old Catholic Mass books; PNCC liturgy.

Not yet located. The 19th-century German Old Catholic altar books and the early PNCC liturgy are the likely public-domain bases; search national library catalogues (Deutsche Digitale Bibliothek, Polona) next.


Blocked: no candidate source found yet.
