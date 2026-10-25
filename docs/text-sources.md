# Text sources still to import

*Generated from `data/text-sources.json` by `python3 tools/text_sources.py --md`. Edit the JSON, not this file.*

Where the texts still missing from each rite can come from, in the order they should be imported. A source listed here is a lead, not a clearance: check the exact scan, edition and territory before extracting, as docs/source-review.md requires. Run `python3 tools/text_sources.py --audit` to re-check every Internet Archive identifier.

Reviewed 2026-10-21. Families are taken in this order: Catholic, Anglican, Eastern Orthodox, Oriental Orthodox and Church of the East, Lutheran, Reformed, Methodist, Moravian and other Protestant, Old Catholic.

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
- **policy**: In copyright, but the holder publishes the text free and its policy allows some reproduction without asking (terms in the note). Check that the terms cover this site before printing; otherwise treat as permission.

## Summary

| # | Gap | Now | Printable leads | Under a reuse policy | Blocked on |
|---|---|---|---|---|---|
| 1 | [roman-modern-mass](#roman-modern-mass) | guide | 6 | 0 | English collects, prefaces and Eucharistic Prayers II-IV: ICEL permission (icelweb.org); Latin new compositions: Libreria Editrice Vaticana permission |
| 2 | [liturgy-of-the-hours](#liturgy-of-the-hours) | guide | 5 | 0 | English antiphons, responsories, intercessions and prayers: ICEL permission; Latin new compositions: Libreria Editrice Vaticana permission |
| 3 | [divine-worship-mass](#divine-worship-mass) | guide | 4 | 0 | Divine Worship: The Missal (2015) itself: permission from the Congregation for Divine Worship via the Ordinariates |
| 4 | [divine-worship-office](#divine-worship-office) | full (Prime, Terce, Sext and None from the Day-Hours, 1877) | 2 | 0 | Divine Worship: Daily Office (2020/21): permission |
| 5 | [byzantine-catholic](#byzantine-catholic) | order (Liturgy), guide (Office) | 13 | 0 | Byzantine Daily Worship, the Ruthenian Divine Liturgy (2007) and current UGCC books: permission from the issuing eparchies |
| 6 | [dominican-mass](#dominican-mass) | order (Ordinary in Latin and English) | 2 | 0 | nothing |
| 7 | [ambrosian](#ambrosian) | order (Ordinary and Canon in Latin and English, Atchley 1909) | 6 | 0 | current Ambrosian Missal and Lectionary: Archdiocese of Milan permission |
| 8 | [mozarabic](#mozarabic) | order (English Ordinary) | 6 | 0 | Missale Hispano-Mozarabicum (1991-94): Archdiocese of Toledo permission |
| 9 | [braga](#braga) | none | 1 | 0 | Braga breviary: not located |
| 10 | [religious-order-uses](#religious-order-uses) | none | 4 | 0 | Premonstratensian and Carmelite breviaries: not located; modern Carthusian books: not public |
| 11 | [zaire-use](#zaire-use) | none | 0 | 0 | Missel romain pour les diocèses du Zaïre: permission from the Episcopal Conference of the Democratic Republic of the Congo |
| 12 | [alexandrian-catholic](#alexandrian-catholic) | The Coptic Liturgy of St Basil in full, from Bute's English of 1882/1908 (rite copt); the shared reader offers a Coptic Orthodox citation snapshot and a separate Catholic/local profile requiring its own appointments | 5 | 0 | Agpeya in public-domain English: not located; Coptic Catholic calendar and appointment verification remain; the Orthodox snapshot does not establish Catholic appointments |
| 13 | [west-syriac-catholic](#west-syriac-catholic) | none | 4 | 0 | Shehimo in public-domain English: not located |
| 14 | [east-syriac-catholic](#east-syriac-catholic) | The Liturgy of Adai and Mari in full, from the Assyrian Mission's English of 1893 (rite adai); Chaldean differences noted | 5 | 0 | Syro-Malabar Raza (1986) and current Chaldean books: permission |
| 15 | [armenian-catholic](#armenian-catholic) | The Divine Liturgy in full, from the London 1908 English translation by two Armenian priests (rite arm) | 4 | 0 | Armenian Book of Hours in public-domain English: not located |
| 16 | [anglican-prayer-books](#anglican-prayer-books) | US 1928 and US 1979 in full (Holy Communion or Eucharist with the collect of the day; the daily offices); England 1662 Holy Communion with the collect, epistle and gospel; 1662 Office inside the Ordinariate; Holy Communion in full with the Introit, collect, epistle and gospel of the day from the Prayer Books of 1549, 1552 and 1559, and in full (the day's collect, epistle and gospel cited) from those of 1637, 1789 and 1892; the current 1979 two-year Office lessons and appointed 1979 Psalter are included, with an explicit original Eucharistic-table option and a link to the current Episcopal RCL | 21 | 0 | Canada 1962, Ireland 2004, South Africa 1954, India 1960 supplement: in copyright; current books with free downloads are under anglican-current-books |
| 17 | [anglo-catholic-missals](#anglo-catholic-missals) | none | 1 | 0 | English Missal 1912 first edition: not located on the Internet Archive |
| 18 | [anglican-music-and-psalter](#anglican-music-and-psalter) | partial (hymns.json) | 4 | 0 | The Hymnal 1940 and 1982: Church Publishing, in copyright |
| 19 | [anglican-current-books](#anglican-current-books) | none | 0 | 4 | Church of Ireland 2004: its site refused automated access; check by hand; Scottish Episcopal Church current liturgies: download page not located; written permission from ACNA, Canada, New Zealand and Wales for an app |
| 20 | [orthodox-byzantine](#orthodox-byzantine) | order / guide | 4 | 0 | Lenten Triodion and Festal Menaion (Mother Mary and Ware), HTM Pentecostarion, Lambertsen Menaion, Ephrem Lash: in copyright; ask each translator or publisher |
| 21 | [western-rite-orthodox](#western-rite-orthodox) | none | 1 | 0 | St Andrew Service Book and Orthodox Missal: Antiochian Archdiocese permission |
| 22 | [oriental-orthodox](#oriental-orthodox) | Armenian: the Divine Liturgy in full (1908 English, rite arm). Coptic: the Liturgy of St Basil in full (Bute, rite copt). Church of the East: the Liturgy of Adai and Mari in full (1893 English, rite adai); Coptic Orthodox Katameros citations for 2025-11-30 through 2030-11-30, including separate Matins, Vespers and Holy Week hours; three unresolved references are flagged | 7 | 0 | Agpeya, Shehimo, Armenian and Ethiopian Hours in public-domain English: not located; Coptic snapshot needs three reference resolutions and independent complete review; Hudra (1960s Trichur edition): check before use |
| 23 | [lutheran](#lutheran) | The Common Service in full (Common Service Book, 1917-19) with the Introit, Collect, Epistle, Gradual and Gospel of the day by the book's calendar rubrics; Matins, Vespers, the Litany and the Suffrages with the collect of the day | 13 | 0 | Lutheran Service Book (CPH), Evangelical Lutheran Worship and LBW (Augsburg Fortress), Christian Worship (NPH): in copyright; The Lutheran Hymnal (1941) and Service Book and Hymnal (1958): renewal status unchecked |
| 24 | [reformed](#reformed) | The Presbyterian Book of Common Worship (1906) Morning Service and Lord's Supper, and the Reformed Church in America Liturgy (1882) Order of Public Worship with the Form of Dort for the Lord's Supper and its Order of Scripture Lessons for the day, and the Mercersburg Order of Worship (1866) Morning and Evening Service, Litany and Holy Communion with its Preparation, in full | 13 | 0 | Book of Praise (Canadian Reformed), Psalter Hymnal, Trinity Psalter Hymnal, Book of Common Worship 1993/2018, modern Dort translations: in copyright |
| 25 | [methodist-moravian-and-others](#methodist-moravian-and-others) | The Lord's Supper from Wesley's Sunday Service (1784) in full with its Sunday collects, epistles and gospels, and its Morning and Evening Prayer and Litany with the Select Psalms, the collects and the table of Sunday lessons; the Lord's Supper from the Ritual of the Methodist Episcopal Church (1908) in full | 6 | 0 | United Methodist Book of Worship and Hymnal, Methodist Worship Book (UK), Moravian Book of Worship: in copyright; Moravian, Congregational and Holiness families are not in the catalog yet |
| 26 | [old-catholic](#old-catholic) | none | 0 | 0 | no candidate source found yet |

## Catholic

### 1. roman-modern-mass

Catalog: `roman-modern` · rite `n` · Mass · now **guide**

Missing: entrance and communion antiphons; collect; prayer over the offerings; prefaces; Eucharistic Prayers II-IV; prayer after communion; English Order of Mass.

No public-domain English exists for the 1970/2002 Missal. Three steps reach the most text: (1) print the Graduale Romanum Introit and Communion, which the GIRM allows in place of the Missal antiphons, from GregoBase (CC0) using the Ordo cantus Missae assignments; (2) map each oration to its ancient source and print the public-domain Latin with a public-domain English where one exists; (3) offer the Roman Canon (already printed) as the default Eucharistic Prayer. Collects composed after 1965, the new prefaces and Eucharistic Prayers II-IV stay cued unless ICEL (English) or the Libreria Editrice Vaticana (Latin) grants permission.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Ordo cantus Missae — Assignments are facts; the chants themselves come from GregoBase. Controlled-lending scan; the 1988 editio altera is item OCMissae. ([ordocantusmissae0000cath](https://archive.org/details/ordocantusmissae0000cath)) | 1972 | la | scan | which chant Introit and Communion belong to each day | reference |
| GregoBase chant database — CC0, already the project's chant source. ([link](https://gregobase.selapa.net/)) | | la | | Introit; Communion; Gradual; Alleluia texts with notation | open |
| The Gelasian Sacramentary (ed. H. A. Wilson) ([gelasiansacrame00gelagoog](https://archive.org/details/gelasiansacrame00gelagoog)) | 1894 | la | scan | ancient sources of collects, prayers over the offerings and after communion | pd |
| The Gregorian Sacramentary under Charles the Great (ed. H. A. Wilson) ([gregoriansacrame00cath](https://archive.org/details/gregoriansacrame00cath)) | 1915 | la | scan | ancient sources of orations and prefaces | pd |
| Sacramentarium Leonianum (ed. C. L. Feltoe) ([sacramentariuml00feltgoog](https://archive.org/details/sacramentariuml00feltgoog)) | 1896 | la | scan | ancient sources of orations and prefaces | pd |
| Ancient Collects and Other Prayers (W. Bright) ([ancientcollects00briggoog](https://archive.org/details/ancientcollects00briggoog)) | 1862 | en | scan | public-domain English for many of the ancient orations | pd |
| Missale Romanum (Paul VI) — Libreria Editrice Vaticana. Use to identify which ancient prayer each oration reproduces; do not copy new compositions. ([missale-romanum-pauli-pp-vi-1970-concilii-vaticno-ii](https://archive.org/details/missale-romanum-pauli-pp-vi-1970-concilii-vaticno-ii)) | 1970 | la | scan | the official Latin of every proper, for collation | permission |
| Divinum Officium, Ordo Missae (Latin) — MIT. The English file beside it (English/Ordo/OrdoN.txt) is the 2010 ICEL translation and is not covered by the MIT licence; do not import it. ([link](https://github.com/DivinumOfficium/divinum-officium/blob/master/web/www/missa/Latin/Ordo/OrdoN.txt)) | | la | | Latin Order of Mass with rubrics | open |

Blocked: English collects, prefaces and Eucharistic Prayers II-IV: ICEL permission (icelweb.org); Latin new compositions: Libreria Editrice Vaticana permission.

### 2. liturgy-of-the-hours

Catalog: `roman-modern` · rite `loth` · Office · now **guide**

Missing: hymns; antiphons; responsories; Office of Readings second readings; intercessions; concluding prayers.

Most of the Office is older than its 1971 edition. Hymns: the Latin originals are public domain (Divinum Officium's breviary hymns, noting where the 1971 hymnal restored pre-1632 wording), with English from the English Hymnal and The Hymner. Second readings in the Office of Readings are patristic: print them from the Schaff Ante-Nicene and Nicene Fathers on CCEL once the two-year and one-year cycles are tabulated (the tables are facts). Concluding prayers are the Missal collects, so they follow the Mass plan. Antiphons and responsories are mostly Scripture and can be shown as the verse in Douay-Rheims, labelled as such. Intercessions are modern compositions and stay cued.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Divinum Officium breviary data — MIT; already the source of the traditional breviaries. ([link](https://github.com/DivinumOfficium/divinum-officium)) | | la | | Latin hymn texts | open |
| The English Hymnal ([theenglishhymnal00milfuoft](https://archive.org/details/theenglishhymnal00milfuoft)) | 1906 | en | scan | English translations of the Office hymns | pd |
| The Hymner (translations of the Sarum breviary hymns) ([TheHymner1905](https://archive.org/details/TheHymner1905)) | 1905 | en | scan | English translations of the Office hymns | pd |
| Hymns Ancient and Modern ([hymnsancientand01unkngoog](https://archive.org/details/hymnsancientand01unkngoog)) | 1904 | en | scan | English translations of the Office hymns | pd |
| Ante-Nicene and Nicene and Post-Nicene Fathers (Schaff) — 1885-1900 translations. Wording differs from the breviary's own; label the translator. ([link](https://www.ccel.org/fathers.html)) | | en | | Office of Readings patristic readings | pd |
| Te decet hymnus (A. Lentini): the Liturgia Horarum hymnal with sources ([te-decet-hymnus-1984](https://archive.org/details/te-decet-hymnus-1984)) | 1984 | la | scan | which hymn is sung when, and the source of each text | reference |
| Liturgia Horarum, textus inserendi — Libreria Editrice Vaticana. Reference for tables only. ([liturgia-horarum-textus-inserendi-2005](https://archive.org/details/liturgia-horarum-textus-inserendi-2005)) | 2005 | la | scan | collation of later additions | permission |

Blocked: English antiphons, responsories, intercessions and prayers: ICEL permission; Latin new compositions: Libreria Editrice Vaticana permission.

### 3. divine-worship-mass

Catalog: `divine-worship` · rite `o` · Mass · now **guide**

Missing: Divine Worship collects, secrets and post-communions (now filled from the 1962 English); proper prefaces; offertory and communion sentences.

Divine Worship's propers descend from the Anglican Missal tradition. Replace the 1962 English fallback with the 1921 Anglican Missal, which prints the whole year in Prayer Book English, and the 1928 American collects where Divine Worship uses them. Mark the result 'Anglican Missal wording' rather than claiming Divine Worship's text.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| The Anglican Missal ([anglicanmissal00churuoft](https://archive.org/details/anglicanmissal00churuoft)) | 1921 | en | scan | full propers for the year in traditional English; prefaces; Ordinary | pd |
| Book of Common Prayer, USA 1928 (Society of Archbishop Justus transcription) ([link](https://justus.anglican.org/resources/bcp/1928/BCP_1928.htm)) | 1928 | en | | collects Divine Worship takes from the 1928 book | pd |
| The Sarum Missal in English (A. H. Pearson) ([sarummissalinen00unkngoog](https://archive.org/details/sarummissalinen00unkngoog)) | 1884 | en | scan | sequences and English-use propers | pd |
| The Sarum Missal in English (F. E. Warren), part 1 ([cu31924092460033](https://archive.org/details/cu31924092460033)) | 1911 | en | scan | sequences and English-use propers | pd |
| The American Missal — Controlled-lending scan. ([americanmissalbe0000unse](https://archive.org/details/americanmissalbe0000unse)) | 1931 | en | scan | American-use propers | check-renewal |
| The English Missal for the Laity — British 1933 edition; look for the 1912 first edition by W. Knott instead. ([englishmissalfor0000vari](https://archive.org/details/englishmissalfor0000vari)) | 1933 | en | scan | English Missal wording | check-uraa |

Blocked: Divine Worship: The Missal (2015) itself: permission from the Congregation for Divine Worship via the Ordinariates.

### 4. divine-worship-office

Catalog: `divine-worship` · rite `dwdo` · Office · now **full (Prime, Terce, Sext and None from the Day-Hours, 1877)**

Missing: proper antiphons and hymn endings of feasts and seasons (Day-Hours, Proper of the Seasons).

The Day Hours of the Church of England supplies the little hours in Prayer Book English with the Coverdale psalter already in the project.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| The Day-Hours of the Church of England ([thedayhours00unknuoft](https://archive.org/details/thedayhours00unknuoft)) | 1877 | en | scan | Prime; Terce; Sext; None; office hymns | pd |
| The Day-Hours of the Church of England (first edition) ([dayhourschurche00unkngoog](https://archive.org/details/dayhourschurche00unkngoog)) | 1858 | en | scan | collation | pd |
| The Monastic Diurnal (Episcopal) — Controlled-lending scan. ([monasticdiurnalo0000epis](https://archive.org/details/monasticdiurnalo0000epis)) | 1932 | en | scan | little hours in English | check-renewal |

Blocked: Divine Worship: Daily Office (2020/21): permission.

### 5. byzantine-catholic

Catalog: `byzantine-catholic`, `catholic-ukrainian`, `catholic-ruthenian`, `catholic-melkite` · rite `b, byz` · Divine Liturgy and Office · now **order (Liturgy), guide (Office)**

Missing: prayers of the Divine Liturgy; troparia and kontakia of the day; Sunday resurrection hymns in eight tones; Menaion propers; Triodion and Pentecostarion propers.

Transcribe Hapgood (1906) for the fixed Liturgy and Vespers/Matins prayers, separating Chrysostom and Basil (docs/source-review.md notes the companion's OCR is unreliable). Add the Sunday Octoechos and the General and Ferial Menaia from Orloff. For Triodion, Pentecostarion and the monthly Menaion, no complete public-domain English exists: print the Greek or Church Slavonic originals and cue the English. These are Greco-Russian texts; Ruthenian and Ukrainian recensions differ in places and must say so.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (I. F. Hapgood) ([cu31924029363128](https://archive.org/details/cu31924029363128)) | 1906 | en | scan | Divine Liturgies of Chrysostom, Basil and the Presanctified; Vespers; Matins; occasional services | pd |
| The Divine Liturgy of the Holy Orthodox Catholic Apostolic Graeco-Russian Church (P. Kuvochinsky) ([divineliturgyofh00orthuoft](https://archive.org/details/divineliturgyofh00orthuoft)) | 1909 | en | scan | second witness for the Liturgy | pd |
| The Octoechos: Sunday services in eight tones (N. Orloff) ([link](https://www.ponomar.net/data/octoechos_orloff.pdf)) | 1898 | en | | Sunday resurrection troparia, kontakia and stichera | pd |
| The General Menaion (N. Orloff) — A 1969 facsimile is on the Internet Archive as generalmenaionor0000orth. ([link](https://www.ponomar.net/data/orloff_general_menaion.pdf)) | 1899 | en | | common services for classes of saints | pd |
| The Ferial Menaion: services for the twelve great feasts (N. Orloff) — 1969 facsimile of the 1900 edition; controlled lending. ([ferialmenaionorb0000orth](https://archive.org/details/ferialmenaionorb0000orth)) | 1900 | en | scan | great-feast propers | pd-reprint |
| Offices from the Service-Books of the Holy Eastern Church (R. F. Littledale) ([officesfromserv00unkngoog](https://archive.org/details/officesfromserv00unkngoog)) | 1863 | en | scan | selected Triodion and Menaion offices | pd |
| Hymns of the Eastern Church (J. M. Neale) ([hymnseasternchu01nealgoog](https://archive.org/details/hymnseasternchu01nealgoog)) | 1862 | en | scan | selected hymns in verse | pd |
| Parakletike (Great Octoechos), Greek ([parakltiktoiokt00churgoog](https://archive.org/details/parakltiktoiokt00churgoog)) | 1858 | grc | scan | complete weekday and Sunday tone propers | pd |
| Menaia of the whole year, Greek ([menaiatouolouen00churgoog](https://archive.org/details/menaiatouolouen00churgoog)) | 1888 | grc | scan | monthly Menaion | pd |
| Triodion katanyktikon, Greek ([triodion-katanyktikon-periechon-hapasan-1](https://archive.org/details/triodion-katanyktikon-periechon-hapasan-1)) | 1876 | grc | scan | Lenten Triodion | pd |
| Horologion to mega, Greek ([hrologiontomega00koutgoog](https://archive.org/details/hrologiontomega00koutgoog)) | 1838 | grc | scan | Horologion | pd |
| Sluzhebnyia minei (September-November), Church Slavonic ([sluzhebnyiaminei01orthuoft](https://archive.org/details/sluzhebnyiaminei01orthuoft)) | 1886 | cu | scan | Slavonic Menaion | pd |
| Ponomar project (calendar, menologion and service data) — GPL-3.0. Check the provenance of each text file: the repository and ponomar.net also carry modern translations that are not theirs to license. ([link](https://github.com/typiconman/Ponomar)) | | en, cu, el | | menologion and service-assembly rules | open |

Blocked: Byzantine Daily Worship, the Ruthenian Divine Liturgy (2007) and current UGCC books: permission from the issuing eparchies.

### 6. dominican-mass

Catalog: `dominican` · rite `new: Dominican Mass` · Mass · now **order (Ordinary in Latin and English)**

Missing: Dominican propers and calendar.

Divinum Officium already carries the Dominican Ordinary and the 1962 Dominican calendar, so a Dominican Mass guide can reuse the existing 1962 propers plus the Order's own feasts from the 1933 Missal.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Divinum Officium, Dominican Ordo Missae (Latin and English) — MIT. Check the English file's translation source before import. ([link](https://github.com/DivinumOfficium/divinum-officium/blob/master/web/www/missa/Latin/Ordo/OrdoOP.txt)) | | la, en | | Dominican Ordinary | open |
| Missale S. Ordinis Praedicatorum ([missalesordinisp00unse](https://archive.org/details/missalesordinisp00unse)) | 1933 | la | scan | Dominican propers | ancient |
| A History of the Dominican Liturgy (W. R. Bonniwell) ([historyofdominic00bonn](https://archive.org/details/historyofdominic00bonn)) | 1944 | en | scan | rubrics and differences from the Roman rite | reference |

### 7. ambrosian

Catalog: `ambrosian` · rite `new` · Mass and Office · now **order (Ordinary and Canon in Latin and English, Atchley 1909)**

Missing: Ambrosian propers; Ambrosian calendar (six-week Advent); Ambrosian lectionary; Ambrosian Office.

Keep the historical Ordinary and Canon explicitly labeled. The user selected current church calendars: import and verify the current Milan Ambrosian appointments, with six-week Advent and its own cycle alignment, after reviewing citation-table reuse terms. The current church source is linked in the reader; the 1712 Missal and medieval Manuale are historical comparisons.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Divinum Officium, Ambrosian Ordo Missae — MIT. Its English counterpart uses modern ICEL-style responses; check before import. ([link](https://github.com/DivinumOfficium/divinum-officium/blob/master/web/www/missa/Latin/Ordo/OrdoA.txt)) | | la | | Latin Ordinary | open |
| The Ambrosian Liturgy: the Ordinary and Canon of the Mass ([ambrosianliturgy00cathuoft](https://archive.org/details/ambrosianliturgy00cathuoft)) | 1909 | la, en | scan | English Ordinary and Canon | pd |
| Manuale Ambrosianum (ed. M. Magistretti), part 2 ([manualeambrosian02cath](https://archive.org/details/manualeambrosian02cath)) | 1904 | la | scan | propers and Office for the year; lectionary | pd |
| Manuale Ambrosianum (ed. M. Magistretti), part 3 ([manualeambrosian03cath](https://archive.org/details/manualeambrosian03cath)) | 1904 | la | scan | propers and Office for the year | pd |
| Missale Ambrosianum ([10869665bsb](https://archive.org/details/10869665bsb)) | 1712 | la | scan | Tridentine-era Ambrosian propers | pd |
| Manuale sive Breviarium iuxta ritum Ambrosianae ecclesiae ([bub_gb_5NAEsu90rB0C](https://archive.org/details/bub_gb_5NAEsu90rB0C)) | 1549 | la | scan | Ambrosian Office | pd |
| Missale Ambrosianum — Archdiocese of Milan. ([MA1981](https://archive.org/details/MA1981)) | 1981 | la | scan | current use, for collation | permission |

Blocked: current Ambrosian Missal and Lectionary: Archdiocese of Milan permission.

### 8. mozarabic

Catalog: `mozarabic` · rite `new` · Mass and Office · now **order (English Ordinary)**

Missing: Latin Ordinary from a public-domain edition (Missale mixtum); propers; lectionary; Office.

Keep the historical Ordinary explicitly labeled. The user selected current church calendars: verify the modern Missale Hispano-Mozarabicum and Liber Commicus with the current ordo and establish reuse terms. Toledo current rite information is linked, but is not a daily reading table. Cisneros and Migne remain historical comparisons.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Divinum Officium, Mozarabic Ordo Missae — MIT; check the English file before import. ([link](https://github.com/DivinumOfficium/divinum-officium/blob/master/web/www/missa/Latin/Ordo/OrdoM.txt)) | | la | | Latin Ordinary | open |
| Liturgia Mozarabica (Migne PL 85): Missale mixtum ([liturgiamozarab00churgoog](https://archive.org/details/liturgiamozarab00churgoog)) | 1862 | la | scan | Mass propers for the year | pd |
| Liturgia Mozarabica (Migne PL 86): Breviarium gothicum ([liturgiamozarab01churgoog](https://archive.org/details/liturgiamozarab01churgoog)) | 1862 | la | scan | Office | pd |
| Missale mixtum (ed. A. Lesley) ([missalemixtumse00leslgoog](https://archive.org/details/missalemixtumse00leslgoog)) | 1755 | la | scan | collation | pd |
| Liber comicus (ed. G. Morin) ([libercomicussive00moriuoft](https://archive.org/details/libercomicussive00moriuoft)) | 1893 | la | scan | Mozarabic lectionary | pd |
| Le Liber mozarabicus sacramentorum (ed. M. Férotin) ([lelibermozarabic06cath](https://archive.org/details/lelibermozarabic06cath)) | 1912 | la | scan | earlier sacramentary | pd |

Blocked: Missale Hispano-Mozarabicum (1991-94): Archdiocese of Toledo permission.

### 9. braga

Catalog: `braga` · rite `new` · Mass · now **none**

Missing: Braga Ordinary and propers; Braga breviary.

The 1924 Missale Bracarense is public domain in the US and covers the Mass. No Braga breviary scan was found yet.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Missale Bracarense ([missale-bracarense-1924](https://archive.org/details/missale-bracarense-1924)) | 1924 | la | scan | Ordinary and propers | pd |
| Cerimonial da Missa Cantada segundo o Rito Bracarense ([cerimonial-da-missa-cantada-segundo-o-rito-bracarense-1931](https://archive.org/details/cerimonial-da-missa-cantada-segundo-o-rito-bracarense-1931)) | 1931 | pt | scan | ceremonial | reference |
| O rito bracarense (D. Serrano) ([oritobracarense00serr](https://archive.org/details/oritobracarense00serr)) | 1906 | pt | scan | history and differences | reference |

Blocked: Braga breviary: not located.

### 10. religious-order-uses

Catalog: `carthusian`, `premonstratensian`, `carmelite` · rite `new` · Mass and Office · now **none**

Missing: Carthusian Mass and Office; Premonstratensian Mass and Office; Carmelite Mass and Office.

Each order's pre-1931 books give a historical use. Later editions (1930s-1950s) are foreign publications that may have restored US copyright; use them only for ancient texts.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Breviarium sacri Ordinis Cartusiensis ([breviariumsacri00cartgoog](https://archive.org/details/breviariumsacri00cartgoog)) | 1717 | la | scan | Carthusian Office | pd |
| Missale Carthusiense ([missale-carthusiense](https://archive.org/details/missale-carthusiense)) | 1620 | la | scan | Carthusian Mass | pd |
| Missale Praemonstratense ([missale-praemonstratense-1936](https://archive.org/details/missale-praemonstratense-1936)) | 1936 | la | scan | Premonstratensian Mass | check-uraa |
| Ordinarius Praemonstratensis ([ordinariuspraemo00unse](https://archive.org/details/ordinariuspraemo00unse)) | 1485 | la | scan | Premonstratensian rubrics | pd |
| Missale fratrum Carmelitarum ([bub_gb_PUEgJFAvalgC](https://archive.org/details/bub_gb_PUEgJFAvalgC)) | 1621 | la | scan | Carmelite Mass | pd |
| Archdale King, the Premonstratensian rite ([kingarchdalepremonstratensianriteocr](https://archive.org/details/kingarchdalepremonstratensianriteocr)) | | en | scan | history and differences | reference |

Blocked: Premonstratensian and Carmelite breviaries: not located; modern Carthusian books: not public.

### 11. zaire-use

Catalog: `zaire` · rite `new` · Mass · now **none**

Missing: Missel romain pour les diocèses du Zaïre (1988).

No public-domain text exists. Offer the Novus Ordo readings with an order-of-service outline and cue the Missel.


Blocked: Missel romain pour les diocèses du Zaïre: permission from the Episcopal Conference of the Democratic Republic of the Congo.

### 12. alexandrian-catholic

Catalog: `alexandrian-catholic`, `catholic-coptic`, `catholic-ethiopian`, `catholic-eritrean` · rite `copt (new builders for the rest)` · Liturgy · now **The Coptic Liturgy of St Basil in full, from Bute's English of 1882/1908 (rite copt); the shared reader offers a Coptic Orthodox citation snapshot and a separate Catholic/local profile requiring its own appointments**

Missing: Ethiopic Liturgy; Coptic Liturgies of St Gregory and St Cyril; Coptic Morning Incense office; Agpeya (hours); Coptic Catholic Katameros appointments and local exceptions.

Brightman gives the Coptic and Ethiopic liturgies in English; Bute's Coptic Morning Service adds the rest of the Sunday office. The hours and the Katameros have not been found in a public-domain English edition. A community-maintained Coptic Orthodox citation dataset is now imported for all supported dates; it is not a Catholic calendar or a modern translation license.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Liturgies Eastern and Western, vol. 1 (F. E. Brightman) ([liturgieseastern01unknuoft](https://archive.org/details/liturgieseastern01unknuoft)) | 1896 | en | scan | Coptic Liturgy of St Mark/Cyril and St Basil; Abyssinian (Ethiopic) Liturgy; Syrian St James; Armenian; Nestorian (East Syrian) Liturgy; Byzantine | pd |
| The Coptic Morning Service for the Lord's Day (Marquess of Bute) (Liturgy imported: tools/texts/order-coptic1908.txt) ([copticmorningser00coptuoft](https://archive.org/details/copticmorningser00coptuoft)) | 1908 | en | scan | Coptic Sunday Liturgy and morning office | pd |
| The Divine Liturgy of St Mark the Evangelist (S. C. Malan) — No OCR text on this item; transcribe from the page images. ([divineliturgysa00malagoog](https://archive.org/details/divineliturgysa00malagoog)) | 1872 | en | scan | Coptic liturgy | pd |
| The Ethiopic Liturgy (S. A. B. Mercer) ([ethiopicliturgyi00mercuoft](https://archive.org/details/ethiopicliturgyi00mercuoft)) | 1915 | en | scan | Ethiopic liturgy and anaphoras | pd |
| The Anaphoras of the Ethiopic Liturgy — Controlled-lending scan; confirm the 1928 date on the title page. ([anaphorasofethio0000yait](https://archive.org/details/anaphorasofethio0000yait)) | 1928 | en | scan | Ethiopic anaphoras | pd |

Blocked: Agpeya in public-domain English: not located; Coptic Catholic calendar and appointment verification remain; the Orthodox snapshot does not establish Catholic appointments.

### 13. west-syriac-catholic

Catalog: `west-syriac-catholic`, `catholic-syriac`, `catholic-maronite`, `catholic-syro-malankara` · rite `new` · Qurbono and Office · now **none**

Missing: Liturgy of St James (West Syriac); Maronite Qurbono; Shehimo (weekday office); lectionary.

Brightman covers St James in English. The weekday office survives in Syriac editions; no public-domain English Shehimo was found.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Liturgies Eastern and Western (Brightman) ([liturgieseastern01unknuoft](https://archive.org/details/liturgieseastern01unknuoft)) | 1896 | en | scan | Syriac Liturgy of St James | pd |
| Breviarium juxta ritum Ecclesiae Antiochenae Syrorum ([breviariumjuxta00churgoog](https://archive.org/details/breviariumjuxta00churgoog)) | 1886 | syr | scan | Syriac Catholic office | pd |
| Officium feriale juxta ritum Ecclesiae Syrorum Maronitarum ([bub_gb_1N9NaygppuoC](https://archive.org/details/bub_gb_1N9NaygppuoC)) | 1731 | syr | scan | Maronite weekday office | pd |
| Missale Chaldaicum iuxta ritum ecclesiae nationis Maronitarum ([bub_gb_5Eqy8WGF9aQC](https://archive.org/details/bub_gb_5Eqy8WGF9aQC)) | 1594 | syr | scan | Maronite Qurbono | pd |
| Two Commentaries on the Jacobite Liturgy (R. H. Connolly) ([twocommentarieso00conn](https://archive.org/details/twocommentarieso00conn)) | 1913 | en | scan | structure | reference |

Blocked: Shehimo in public-domain English: not located.

### 14. east-syriac-catholic

Catalog: `east-syriac-catholic`, `catholic-chaldean`, `catholic-syro-malabar` · rite `new` · Qurbana and Office · now **The Liturgy of Adai and Mari in full, from the Assyrian Mission's English of 1893 (rite adai); Chaldean differences noted**

Missing: Chaldean and Syro-Malabar forms of the Qurbana; anaphoras of Theodore and Nestorius; daily office; lectionary.

This tradition is the best served: Maclean (1894) translates the daily offices with their lectionary, and the 1893 English Liturgy of Addai and Mari covers the Qurbana.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| East Syrian Daily Offices (A. J. Maclean) ([eastsyriandailyo00macluoft](https://archive.org/details/eastsyriandailyo00macluoft)) | 1894 | en | scan | evening, night and morning offices; lectionary tables | pd |
| The Liturgy of the Holy Apostles Adai and Mari ([LiturgyAdai](https://archive.org/details/LiturgyAdai)) | 1893 | en | scan | Qurbana with the three anaphoras | pd |
| Breviarium Chaldaicum (P. Bedjan), 3 vols., Paris and Leipzig — Archive metadata says 1867; its description gives 1886-87. ([BreviariumChaldaicum](https://archive.org/details/BreviariumChaldaicum)) | 1886 | syr | scan | Syriac office for the year | pd |
| Missale Chaldaicum ([bub_gb_PSttGL9Rf08C](https://archive.org/details/bub_gb_PSttGL9Rf08C)) | 1767 | syr | scan | Chaldean Mass | pd |
| The Nestorians and Their Rituals, vol. 2 (G. P. Badger) ([nestorianstheirr02badg](https://archive.org/details/nestorianstheirr02badg)) | 1852 | en | scan | sacraments and liturgy | pd |

Blocked: Syro-Malabar Raza (1986) and current Chaldean books: permission.

### 15. armenian-catholic

Catalog: `catholic-armenian` · rite `new` · Badarak and Office · now **The Divine Liturgy in full, from the London 1908 English translation by two Armenian priests (rite arm)**

Missing: Book of Hours; lectionary.

The 1862 English translation was made for Armenian Catholics and is the natural base; Conybeare adds the breviary rites and the old Jerusalem lectionary.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| The Divine Liturgy of the Holy Apostolic Church of Armenia, translated by two Armenian priests (imported: tools/texts/order-armenian1908.txt) ([divineliturgyofh00arme](https://archive.org/details/divineliturgyofh00arme)) | 1908 | en | scan | Divine Liturgy | pd |
| The Armenian Liturgy, translated into English ([TheArmenianLiturgy](https://archive.org/details/TheArmenianLiturgy)) | 1862 | en | scan | Divine Liturgy | pd |
| Liturgy of the Holy Apostolic Church of Armenia (S. C. Malan) ([liturgyholyapos00asdvgoog](https://archive.org/details/liturgyholyapos00asdvgoog)) | 1887 | en | scan | Divine Liturgy | pd |
| Rituale Armenorum (F. C. Conybeare) ([ritualearmenorum00cony](https://archive.org/details/ritualearmenorum00cony)) | 1905 | en | scan | sacraments; breviary rites; old Armenian lectionary | pd |

Blocked: Armenian Book of Hours in public-domain English: not located.

## Anglican

### 16. anglican-prayer-books

Catalog: `anglican-1549-england`, `anglican-1552-england`, `anglican-1559-england`, `anglican-1604-england`, `anglican-1662-england`, `anglican-1928-england`, `anglican-1637-scotland`, `anglican-1764-scotland`, `anglican-1929-scotland`, `anglican-1789-us`, `anglican-1892-us`, `anglican-1928-us`, `anglican-1979-us`, `anglican-1918-canada`, `anglican-1878-ireland`, `anglican-1926-ireland` · rite `new: one builder per book, reusing the 1662 Mattins/Evensong/Communion builders` · Daily Office and Holy Communion · now **US 1928 and US 1979 in full (Holy Communion or Eucharist with the collect of the day; the daily offices); England 1662 Holy Communion with the collect, epistle and gospel; 1662 Office inside the Ordinariate; Holy Communion in full with the Introit, collect, epistle and gospel of the day from the Prayer Books of 1549, 1552 and 1559, and in full (the day's collect, epistle and gospel cited) from those of 1637, 1789 and 1892; the current 1979 two-year Office lessons and appointed 1979 Psalter are included, with an explicit original Eucharistic-table option and a link to the current Episcopal RCL**

Missing: 1928 lectionary tables; Automatic current Episcopal RCL table and feast transfers (reuse terms must be established); other national books.

The Society of Archbishop Justus has typed transcriptions of almost every historical book. Import in order of use: US 1928, US 1979, England 1662 Communion, US 1892/1789, Canada 1918, Ireland 1926, Scotland 1929, then the 16th-17th-century books for study. Check each transcription against a scan.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| USA 1928 ([link](https://justus.anglican.org/resources/bcp/1928/BCP_1928.htm)) | 1928 | en | | complete book | pd |
| USA 1979 — The official 2016 printing (below) has no copyright notice anywhere in its 999 pages; use it to check this transcription. ([link](https://justus.anglican.org/resources/bcp/formatted_1979.htm)) | 1979 | en | | complete book | pd |
| The Book of Common Prayer (1979), official PDF of the Standard Book, certified 2016 (in use: The Episcopal Church) — No copyright notice in the whole PDF (checked 2026-10-21). The RCL tables it now includes are the Consultation on Common Texts' and carry their own terms. ([link](https://www.episcopalcommonprayer.org/uploads/1/2/9/8/129843103/bcp_2020.pdf)) | 1979 | en | pdf | complete book; Revised Common Lectionary tables | pd |
| USA 1892 ([link](https://justus.anglican.org/resources/bcp/1892/BCP_1892.htm)) | 1892 | en | | complete book | pd |
| USA 1789 ([link](https://justus.anglican.org/resources/bcp/1789/BCP_1789.htm)) | 1789 | en | | complete book | pd |
| England 1662 ([link](https://justus.anglican.org/resources/bcp/1662/1662.html)) | 1662 | en | | Holy Communion and the rest of the book | crown-uk |
| England 1662, HTML transcription (Lynda M. Howell) ([link](https://www.eskimo.com/~lhowell/bcp1662/communion/index.html)) | 1662 | en | | Holy Communion; Collects, Epistles and Gospels (imported: tools/bcp1662.py) | crown-uk |
| England 1928 (proposed) ([link](https://justus.anglican.org/resources/bcp/CofE1928/CofE1928.htm)) | 1928 | en | | complete book | pd |
| England 1559 ([link](https://justus.anglican.org/resources/bcp/1559/BCP_1559.htm)) | 1559 | en | | complete book | pd |
| England 1552 ([link](https://justus.anglican.org/resources/bcp/1552/BCP_1552.htm)) | 1552 | en | | complete book | pd |
| England 1549 ([link](https://justus.anglican.org/resources/bcp/1549/BCP_1549.htm)) | 1549 | en | | complete book | pd |
| Scotland 1637 ([link](https://justus.anglican.org/resources/bcp/Scotland/BCP_1637.htm)) | 1637 | en | | complete book | pd |
| Scotland 1929 ([link](https://justus.anglican.org/resources/bcp/Scotland/Scottish_BCP1929.pdf)) | 1929 | en | | complete book | pd |
| Canada 1918 ([link](https://justus.anglican.org/resources/bcp/Canada/1918.htm)) | 1918 | en | | complete book | pd |
| Ireland 1878 ([link](http://books.google.com/books?id=_cMUAAAAQAAJ)) | 1878 | en | | complete book | pd |
| The First Prayer-Book of Edward VI compared with the successive revisions ([firstprayerbooko00oxfouoft](https://archive.org/details/firstprayerbooko00oxfouoft)) | 1877 | en | scan | scan to check the 1549-1662 transcriptions | pd |
| Book of Common Prayer, USA (first printing of the 1789 book, Hall & Sellers) ([bookommray00epis](https://archive.org/details/bookommray00epis)) | 1790 | en | scan | scan to check 1789 transcription | pd |
| Book of Common Prayer, USA ([bookcommonpraye00conggoog](https://archive.org/details/bookcommonpraye00conggoog)) | 1892 | en | scan | scan to check 1892 transcription | pd |
| Book of Common Prayer, Canada ([bookofcommonpray0000vari_p2b8](https://archive.org/details/bookofcommonpray0000vari_p2b8)) | 1918 | en | scan | scan to check 1918 transcription | pd |
| The Book of Common Prayer and the Scottish Liturgy (Episcopal Church in Scotland), Project Gutenberg — Gutenberg marks it public domain in the USA; confirm the edition year against the text. ([link](https://www.gutenberg.org/ebooks/29622)) | 1912 | en | epub, html, txt | Scottish book and the Scottish Communion Office as typed text | pd |
| The Book of Common Prayer of the Reformed Episcopal Church ([bookofcommonpray00refo](https://archive.org/details/bookofcommonpray00refo)) | 1874 | en | scan | Reformed Episcopal book (historical; the REC now uses a later book) | pd |

Blocked: Canada 1962, Ireland 2004, South Africa 1954, India 1960 supplement: in copyright; current books with free downloads are under anglican-current-books.

### 17. anglo-catholic-missals

Catalog: `anglican-missal`, `english-missal` · rite `new` · Mass · now **none**

Missing: Anglican Missal Mass; English Missal Mass.

The 1921 Anglican Missal is public domain and also serves the Ordinariate gap above. The English Missal needs its 1912 first edition; later editions are British and may be restored in the US.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| The Anglican Missal ([anglicanmissal00churuoft](https://archive.org/details/anglicanmissal00churuoft)) | 1921 | en | scan | complete Missal | pd |
| The English Missal for the Laity ([englishmissalfor0000vari](https://archive.org/details/englishmissalfor0000vari)) | 1933 | en | scan | English Missal wording | check-uraa |
| The People's Anglican Missal in the American Edition ([bwb_Y0-CAO-217](https://archive.org/details/bwb_Y0-CAO-217)) | 1946 | en | scan | American edition | check-renewal |
| The English Gradual ([englishgradual0000unse](https://archive.org/details/englishgradual0000unse)) | 1933 | en | scan | English plainsong propers | check-uraa |

Blocked: English Missal 1912 first edition: not located on the Internet Archive.

### 18. anglican-music-and-psalter

Catalog: `anglican` · rite `all Anglican builders` · Music · now **partial (hymns.json)**

Missing: office hymns; pointed psalter; Merbecke.

Extend hymns.json from the English Hymnal and Hymns Ancient and Modern; point the Coverdale psalter from the 1902 Manual of Plainsong.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| The English Hymnal, with tunes ([theenglishhymnal00milfuoft](https://archive.org/details/theenglishhymnal00milfuoft)) | 1906 | en | scan | hymns and office hymns | pd |
| Hymns Ancient and Modern ([hymnsancientand01unkngoog](https://archive.org/details/hymnsancientand01unkngoog)) | 1904 | en | scan | hymns | pd |
| A Manual of Plainsong (Briggs and Frere) ([manualofplainson00brig](https://archive.org/details/manualofplainson00brig)) | 1902 | en | scan | canticles and psalter pointed to Gregorian tones | pd |
| Merbecke, The Book of Common Prayer Noted (1550) ([link](https://justus.anglican.org/resources/bcp/Merbecke/Merbecke.htm)) | 1550 | en | | Merbecke settings | pd |

Blocked: The Hymnal 1940 and 1982: Church Publishing, in copyright.

### 19. anglican-current-books

Catalog: `acna-2019`, `common-worship`, `anglican` · rite `new: cited guides, or full text where a policy allows` · Daily Office and Holy Communion · now **none**

Missing: ACNA 2019; Common Worship; Book of Alternative Services; A New Zealand Prayer Book; Church in Wales 2004 Eucharist.

These books are in copyright but free to download, and several churches publish reuse policies. Common Worship is the strongest case: the Church of England allows its online texts to be reproduced on another non-commercial website if unaltered and acknowledged. ACNA allows liturgies in worship bulletins and short quotations (up to 2,500 words or 10%). New Zealand and Canada allow parish copies only. Build cited guides for all of them, print Common Worship under its web terms once someone confirms they cover an app, and ask the other holders.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Common Worship texts online (in use: Church of England) — churchofengland.org/copyright: may be reproduced on another website for non-commercial purposes, unaltered and with the acknowledgement set out in A Brief Guide to Liturgical Copyright (4th ed., 2024). ([link](https://www.churchofengland.org/prayer-and-worship/worship-texts-and-resources/common-worship)) | 2000 | en | html, pdf | Holy Communion Orders One and Two; Daily Prayer; collects; lectionary | policy |
| The Book of Common Prayer (2019), official PDF, 5th printing (in use: Anglican Church in North America) — Copyright ACNA. Churches may put liturgies in worship bulletins; other uses up to 2,500 words or 10% without asking (anglicanhousepublishers.org/permissions). A complete app needs permission: permissions@anglicanhouse.org. ([link](https://bcp2019.anglicanchurch.net/wp-content/uploads/2022/10/BCP-2019-MASTER-5th-PRINTING-05022022-3.pdf)) | 2019 | en | pdf | complete book; New Coverdale Psalter | policy |
| The Book of Alternative Services, official PDF (in use: Anglican Church of Canada) — Free use is limited to dioceses, parishes and bodies within the Anglican Church of Canada under its licence agreement. ([link](https://www.anglican.ca/wp-content/uploads/BAS.pdf)) | 1985 | en | pdf | complete book | policy |
| A New Zealand Prayer Book / He Karakia Mihinare o Aotearoa, EPUB (in use: Anglican Church in Aotearoa, New Zealand and Polynesia) — Single-occasion parish copies only, unedited and acknowledged (Copyright Rules, liturgy.co.nz/PDF/CopyrightRules.pdf). Anything else needs the General Secretary's written permission. ([link](http://www.liturgy.co.nz/resources/NZPBHKMA/A_New_Zealand_Prayer_Book.epub)) | 1989 | en, mi | epub | complete book | policy |
| An Order for the Holy Eucharist 2004, official PDF (in use: Church in Wales) — Copyright the Representative Body of the Church in Wales. ([link](https://www.churchinwales.org.uk/documents/5236/2336_-_HE04_CiW_-_English.pdf)) | 2004 | en | pdf, docx | Church in Wales Eucharist | permission |
| A Prayer Book for Australia: licence terms (in use: Anglican Church of Australia) — Parish reproduction is free since 2019, but no part may be posted online without Broughton Publishing's permission. ([link](https://www.broughtonpublishing.com.au/copyright/)) | 1995 | en | print only | terms only | reference |

Blocked: Church of Ireland 2004: its site refused automated access; check by hand; Scottish Episcopal Church current liturgies: download page not located; written permission from ACNA, Canada, New Zealand and Wales for an app.

## Eastern Orthodox

### 20. orthodox-byzantine

Catalog: `eastern-orthodox`, `orthodox-constantinople`, `orthodox-russia`, `orthodox-oca`, `goarch`, `antiochian-america`, `rocor`, `old-calendarists` · rite `b, byz (shared with Byzantine Catholic)` · Divine Liturgy and Office · now **order / guide**

Missing: as for Byzantine Catholic; Book of Needs; Julian-calendar day mapping for Old Calendarists and Russian use.

Everything in the Byzantine Catholic plan applies. Add Shann's Book of Needs for occasional services. The orthocal port already computes Julian dates; expose it.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Book of Needs (G. V. Shann) ([link](https://www.ponomar.net/data/trebnik_shann.pdf)) | 1894 | en | | occasional services | pd |
| Book of Needs of the Holy Orthodox Church (G. V. Shann), Project Gutenberg ([link](https://www.gutenberg.org/ebooks/71513)) | 1894 | en | epub, html, txt | occasional services as typed text | pd |
| Hapgood Service Book ([cu31924029363128](https://archive.org/details/cu31924029363128)) | 1906 | en | scan | see Byzantine Catholic | pd |
| Typikon of the Great Church (G. Violakis) — Archive metadata gives 1900; confirm the edition year on the title page. ([typikontstou00orth](https://archive.org/details/typikontstou00orth)) | 1900 | grc | scan | Greek ordo rules | pd |

Blocked: Lenten Triodion and Festal Menaion (Mother Mary and Ware), HTM Pentecostarion, Lambertsen Menaion, Ephrem Lash: in copyright; ask each translator or publisher.

### 21. western-rite-orthodox

Catalog: `western-rite-orthodox` · rite `new` · Mass · now **none**

Missing: Liturgy of St Gregory; Liturgy of St Tikhon.

The St Tikhon liturgy is an adaptation of the 1928 American Prayer Book and the St Gregory liturgy of the Tridentine Mass; build from the US 1928 and 1962 texts already planned, labelled as their sources, not as the Antiochian service book.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| USA 1928 Book of Common Prayer ([link](https://justus.anglican.org/resources/bcp/1928/BCP_1928.htm)) | 1928 | en | | base of the St Tikhon liturgy | pd |

Blocked: St Andrew Service Book and Orthodox Missal: Antiochian Archdiocese permission.

## Oriental Orthodox and Church of the East

### 22. oriental-orthodox

Catalog: `oriental-orthodox`, `oriental-coptic`, `oriental-syriac`, `oriental-armenian`, `oriental-ethiopian`, `oriental-eritrean`, `oriental-malankara`, `oriental-assyrian`, `oriental-ancient` · rite `new (shared builders with the Eastern Catholic churches of the same tradition)` · Liturgy and Office · now **Armenian: the Divine Liturgy in full (1908 English, rite arm). Coptic: the Liturgy of St Basil in full (Bute, rite copt). Church of the East: the Liturgy of Adai and Mari in full (1893 English, rite adai); Coptic Orthodox Katameros citations for 2025-11-30 through 2030-11-30, including separate Matins, Vespers and Holy Week hours; three unresolved references are flagged**

Missing: liturgies; hours; lectionaries; calendars (Coptic, Ethiopian, Armenian).

Use current church calendars, with separate Orthodox, Catholic and local profiles. The Coptic Orthodox snapshot is imported; Armenian Apostolic and Assyrian annual tables are linked pending verified imports. Historical service orders retain their edition labels and are not presented as modern approved texts.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Liturgies Eastern and Western (Brightman) ([liturgieseastern01unknuoft](https://archive.org/details/liturgieseastern01unknuoft)) | 1896 | en | scan | Coptic, Ethiopic, Syrian, Armenian, East Syrian liturgies | pd |
| East Syrian Daily Offices (Maclean) ([eastsyriandailyo00macluoft](https://archive.org/details/eastsyriandailyo00macluoft)) | 1894 | en | scan | Assyrian and Ancient Church of the East hours | pd |
| Liturgia Sanctorum Apostolorum Adaei et Maris (Urmia) ([liturgiasanctoru0000anon](https://archive.org/details/liturgiasanctoru0000anon)) | 1890 | syr | scan | Takhsa | pd |
| Rituale Armenorum (Conybeare) ([ritualearmenorum00cony](https://archive.org/details/ritualearmenorum00cony)) | 1905 | en | scan | Armenian rites and lectionary | pd |
| Coptic Morning Service (Bute) (Liturgy imported) ([copticmorningser00coptuoft](https://archive.org/details/copticmorningser00coptuoft)) | 1908 | en | scan | Coptic liturgy | pd |
| The Ethiopic Liturgy (Mercer) ([ethiopicliturgyi00mercuoft](https://archive.org/details/ethiopicliturgyi00mercuoft)) | 1915 | en | scan | Ethiopian and Eritrean liturgy | pd |
| The Service for the Consecration of a Church according to the Coptic Rite (G. Horner) ([serviceforconsec00hornuoft](https://archive.org/details/serviceforconsec00hornuoft)) | 1902 | en | scan | Coptic rubrics and hymn structure | reference |
| Katameros API, pinned community calendar implementation — MIT, Copyright (c) 2022 katameros; license retained. No modern Bible, prayer or Synaxarium text imported. Not a Coptic Catholic calendar. ([link](https://github.com/pierresaid/katameros-api/tree/62094eb045f067f6082edfc230a993c3d3e64668)) | | citations | code and citation-only snapshot | Coptic Orthodox reading appointments for all supported dates | open |

Blocked: Agpeya, Shehimo, Armenian and Ethiopian Hours in public-domain English: not located; Coptic snapshot needs three reference resolutions and independent complete review; Hudra (1960s Trichur edition): check before use.

## Lutheran

### 23. lutheran

Catalog: `lutheran`, `common-service`, `swedish-orders`, `lcms`, `wels`, `els`, `elca`, `nalc` · rite `new` · Divine Service and Matins/Vespers, Litany, Suffrages · now **The Common Service in full (Common Service Book, 1917-19) with the Introit, Collect, Epistle, Gradual and Gospel of the day by the book's calendar rubrics; Matins, Vespers, the Litany and the Suffrages with the collect of the day**

Missing: Swedish High Mass; current Nordic service books.

The Common Service (1888) as printed in the Church Book and the 1917 Common Service Book is the ancestor of TLH, SBH, LBW and LSB page 15; it gives a complete historic Lutheran Divine Service with propers and the one-year lectionary. Add the Missouri Synod's 1917 English Liturgy and Agenda and the 1921 Swedish rite. LSB, ELW, TLH and SBH stay cued. Typed public-domain transcriptions already exist: A Collection of Prayers has the whole Common Service Book (1917-18) as Word and PDF files, and Project Gutenberg has the 1912 Missouri Synod hymn-book. The Church of Sweden's current handbook is a free PDF but its copyright page forbids copying without permission.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| Common Service Book of the Lutheran Church ([commonserviceb00unknuoft](https://archive.org/details/commonserviceb00unknuoft)) | 1918 | en | scan | Common Service; Matins; Vespers; introits, collects, graduals; one-year lectionary | pd |
| Common Service Book (1917-18) typed in Word and PDF: The Service, Matins, Vespers, introits, collects, graduals, litany, suffrages, occasional services — Use the files marked 'common-service-book' (unaltered). The site's 'contemporary English' adaptations are CC BY-NC-ND and must not be used. ([link](https://acollectionofprayers.com/2017/01/01/common-service-book-of-the-lutheran-church/)) | 1918 | en | docx, pdf | complete Common Service Book as editable text | pd |
| Evangelical Lutheran Hymn-Book, abridged (Missouri Synod), Project Gutenberg ([link](https://www.gutenberg.org/ebooks/76498)) | 1912 | en | epub, html, txt | hymns; Order of Morning Service | pd |
| The Lutheran Hymnal (1941): all public-domain hymn texts (Project Wittenberg, Concordia Theological Seminary) — Only the hymns the seminary marks as public domain; the TLH liturgy pages are not included. ([link](https://ctsfw.edu/etext/hymnals/tlh/tlh.zip)) | 1941 | en | zip of txt | TLH hymns whose texts are public domain | pd |
| Church Service Book and Ministerial Acts (Augustana Synod) ([churchserviceboo00evan](https://archive.org/details/churchserviceboo00evan)) | 1928 | en | scan | Swedish-American Lutheran services | pd |
| The Lutheran Hymnary (Norwegian Synod and others; ancestor of ELS use) ([lutheranhymnary00synogoog](https://archive.org/details/lutheranhymnary00synogoog)) | 1913 | en | scan | Norwegian-American liturgy and hymns | pd |
| Kyrkohandbok för Svenska kyrkan, del I, official PDF (in use: Church of Sweden) — svenskakyrkan.se/kyrkohandboken/upphovsratt: copyright the Church of Sweden; no copying without permission. ([link](https://www.svenskakyrkan.se/default.aspx?id=2373422)) | 2017 | sv | pdf | current Swedish High Mass and services | permission |
| Evangelical Lutheran Church of Finland: liturgical resources in English (PDF and Word) — No reuse terms found on the page. ([link](https://evl.fi/plus/seurakuntaelama/jumalanpalvelus-ja-hengellisyys/jumalanpalveluselama/erikielisia-jumalanpalveluskaavoja/liturgical-resources-in-english/)) | 2025 | en | pdf, docx | baptism, wedding, funeral and blessing orders | permission |
| Church Book for the Use of Evangelical Lutheran Congregations ([churchbookforthe00unknuoft](https://archive.org/details/churchbookforthe00unknuoft)) | 1893 | en | scan | Common Service in its 1888 form | pd |
| Liturgy and Agenda (Missouri Synod) ([liturgyagenda00luth](https://archive.org/details/liturgyagenda00luth)) | 1918 | en | scan | Missouri Synod English orders | pd |
| Kirchen-Agende für Evang.-Luth. Gemeinden ([kirchenagendefurevang.luth.gemeinden1902](https://archive.org/details/kirchenagendefurevang.luth.gemeinden1902)) | 1902 | de | scan | German Missouri Synod orders | pd |
| Liturgy for Christian Congregations of the Lutheran Faith (W. Löhe) ([liturgyforchrist00lhew](https://archive.org/details/liturgyforchrist00lhew)) | 1902 | en | scan | Löhe's orders | pd |
| The Swedish Rite: a translation of Handbok för svenska kyrkan (E. E. Yelverton) ([swedishritetrans00sven](https://archive.org/details/swedishritetrans00sven)) | 1921 | en | scan | Church of Sweden High Mass and offices | pd |
| Kyrkohandbok ([khb-1894](https://archive.org/details/khb-1894)) | 1894 | sv | scan | Swedish original | pd |
| Evangelical Lutheran Hymn-Book (Missouri Synod) ([evangelicalluthe09evan](https://archive.org/details/evangelicalluthe09evan)) | 1909 | en | scan | hymns | pd |

Blocked: Lutheran Service Book (CPH), Evangelical Lutheran Worship and LBW (Augsburg Fortress), Christian Worship (NPH): in copyright; The Lutheran Hymnal (1941) and Service Book and Hymnal (1958): renewal status unchecked.

## Reformed

### 24. reformed

Catalog: `reformed`, `dort-forms`, `mercersburg`, `genevan-psalter`, `psalter-1912`, `westminster`, `scottish-psalter`, `bcw-1906`, `nrc`, `heritage-reformed`, `free-reformed`, `gereformeerde-gemeenten`, `canadian-reformed`, `urcna`, `pca`, `opc`, `pcusa`, `free-church-scotland`, `reformed-presbyterian` · rite `new` · Lord's Day worship and forms · now **The Presbyterian Book of Common Worship (1906) Morning Service and Lord's Supper, and the Reformed Church in America Liturgy (1882) Order of Public Worship with the Form of Dort for the Lord's Supper and its Order of Scripture Lessons for the day, and the Mercersburg Order of Worship (1866) Morning and Evening Service, Litany and Holy Communion with its Preparation, in full**

Missing: the other Dort forms (baptism, discipline, ordination, marriage) in English; metrical psalters; Westminster Directory; the rest of the Book of Common Worship (Evening Service, sacraments, Treasury of Prayers); Reformed Church in the United States orders; current denominational forms.

Reformed worship is mostly an order plus psalms: build a Lord's Day order from the Directory or the 1906 Book of Common Worship and draw psalms from the 1650 Scottish Psalter, the 1912 Psalter and the Genevan psalms. The English Dort forms come from the 19th-century Reformed Dutch printings. Several bodies publish their current forms free on the web (URCNA, CRCNA) or their Directory for Worship as a free PDF (OPC, PCA), but none states a reuse licence; cite them and ask.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| The Psalms and Hymns, with the Catechism, Confession, Canons of Dort and Liturgy (Reformed Protestant Dutch Church) ([psahc00refo](https://archive.org/details/psahc00refo)) | 1854 | en | scan | Dort liturgical forms in English | pd |
| The Liturgy of the Reformed Church in America, for use in public worship ([liturgyofreform00refo](https://archive.org/details/liturgyofreform00refo)) | 1882 | en | scan | RCA orders and Dort-derived forms | pd |
| The Liturgy of the Reformed Church in America, with the Psalter for responsive reading ([liturgyofreforme1907refo](https://archive.org/details/liturgyofreforme1907refo)) | 1907 | en | scan | RCA orders and Dort-derived forms | pd |
| An Order of Worship for the Reformed Church (Mercersburg liturgy, RCUS) ([anorderworshipf00statgoog](https://archive.org/details/anorderworshipf00statgoog)) | 1884 | en | scan | German Reformed (Mercersburg) orders | pd |
| Directory of Worship for the Reformed Church in the United States ([rcus-directory-worship-1905](https://archive.org/details/rcus-directory-worship-1905)) | 1905 | en | scan | RCUS orders (the RCUS still exists) | pd |
| The Psalter Hymnal (United Presbyterian Church of North America) ([psalterhymnalpsa00unit](https://archive.org/details/psalterhymnalpsa00unit)) | 1927 | en | scan | metrical psalms | pd |
| The Psalms of David in Metre (Scottish Psalter) ([psalmsofdavidinm00chur](https://archive.org/details/psalmsofdavidinm00chur)) | 1814 | en | scan | 1650 Scottish metrical psalter | pd |
| The Psalter, with Responsive Readings ([psalterwithresp00usgoog](https://archive.org/details/psalterwithresp00usgoog)) | 1912 | en | scan | 1912 Psalter | pd |
| Les Pseaumes de David mis en rime françoise (Marot and Bèze) ([lespseaumesdedav00maro](https://archive.org/details/lespseaumesdedav00maro)) | 1660 | fr | scan | Genevan psalter texts | pd |
| The Directory for the Publick Worship of God ([directoryforpubl00west](https://archive.org/details/directoryforpubl00west)) | 1880 | en | scan | Westminster Directory | pd |
| The Book of Common Worship (PCUSA) ([bookofcommonwors00pres](https://archive.org/details/bookofcommonwors00pres)) | 1906 | en | scan | Presbyterian orders and prayers | pd |
| The Book of Common Order (John Knox's Liturgy) ([bookofcommonorde00churuoft](https://archive.org/details/bookofcommonorde00churuoft)) | 1873 | en | scan | Scottish Reformation order | pd |
| Euchologion: a Book of Common Order (Church Service Society) ([euchologionbooko00chur](https://archive.org/details/euchologionbooko00chur)) | 1877 | en | scan | Scottish Presbyterian forms | pd |
| Hymnary.org — Check the status of each text it hosts. ([link](https://hymnary.org/)) | | en | | psalm and hymn texts with tune indexes | reference |
| URCNA liturgical forms, two forms each for baptism, profession, Lord's Supper, discipline, ordination and marriage (in use) — No reuse statement on the pages. Form 1 versions follow the historic Dort forms, which are public domain in their 19th-century English. ([link](https://www.urcna.org/liturgical-forms)) | | en | html | current Reformed forms | permission |
| Christian Reformed Church liturgical forms (in use) ([link](https://www.crcna.org/resources/church-resources/liturgical-forms)) | | en | html | current CRC forms | permission |
| OPC Book of Church Order 2025, including the Directory for the Public Worship of God (in use) — No copyright statement found in the PDF; ask the OPC before reproducing. ([link](http://opc.org/BCO/BCO_2025.pdf)) | 2025 | en | pdf | OPC order of worship | permission |
| PCA Book of Church Order 2026, including the Directory for Worship (in use) — Copyright the PCA Stated Clerk; no reproduction without written permission, including for AI models. ([link](https://www.pcaac.org/wp-content/uploads/2026/07/BCO_2026.pdf)) | 2026 | en | pdf | PCA order of worship | permission |

Blocked: Book of Praise (Canadian Reformed), Psalter Hymnal, Trinity Psalter Hymnal, Book of Common Worship 1993/2018, modern Dort translations: in copyright.

## Methodist, Moravian and other Protestant

### 25. methodist-moravian-and-others

Catalog: `methodist`, `united-methodist`, `sunday-service-1784`, `me-ritual-1908` · rite `wes84 (Wesley's Sunday Service 1784, the Lord's Supper with its collects, epistles and gospels, shown by the Prayer Book builder); me08 (the 1908 Methodist Episcopal Lord's Supper, shown by buildOrders); wes84o (Wesley's Morning and Evening Prayer and Litany, shown by buildOrders)` · Lord's Supper, Morning Prayer and occasional services · now **The Lord's Supper from Wesley's Sunday Service (1784) in full with its Sunday collects, epistles and gospels, and its Morning and Evening Prayer and Litany with the Select Psalms, the collects and the table of Sunday lessons; the Lord's Supper from the Ritual of the Methodist Episcopal Church (1908) in full**

Missing: Wesley's Sunday Service (1784): the occasional services (baptism, matrimony, burial, ordinal); the rest of the Methodist ritual (baptism, reception, matrimony, burial); Moravian liturgies; Congregational orders; Holiness church rituals.

Wesley's 1784 Sunday Service is the root of Methodist liturgy and public domain; the 1908 Methodist Episcopal Ritual and the 1920 Moravian Hymnal and Liturgies cover the 20th-century forms. Current Free Methodist and Nazarene books are free PDFs whose rituals are in copyright. These families are not in the Sanctuary catalog yet, so add them there before building guides.

| Source | Year | Lang | Format | Fills | Rights |
|---|---|---|---|---|---|
| The Sunday Service of the Methodists in North America (John Wesley) ([amernorfm00wesl](https://archive.org/details/amernorfm00wesl)) | 1784 | en | scan | Morning Prayer, Lord's Supper, baptism, ordinal, collects and lessons | pd |
| Ritual of the Methodist Episcopal Church ([ritualofmethodis01meth](https://archive.org/details/ritualofmethodis01meth)) | 1908 | en | scan | Lord's Supper and occasional services | pd |
| The Methodist Hymnal (Methodist Episcopal Church and Methodist Episcopal Church, South) ([methodisthymnalo00meth](https://archive.org/details/methodisthymnalo00meth)) | 1905 | en | scan | hymns and orders of worship | pd |
| Hymnal and Liturgies of the Moravian Church (Unitas Fratrum), American province ([hymnalliturgieso00mora](https://archive.org/details/hymnalliturgieso00mora)) | 1920 | en | scan | Moravian liturgies, litanies and lovefeast | pd |
| Liturgy and Hymns of the Moravian Church (British province) ([liturgyandhymns00unknuoft](https://archive.org/details/liturgyandhymns00unknuoft)) | 1908 | en | scan | British Moravian liturgies | pd |
| Book of Church Services (National Council of the Congregational Churches) ([bookofchurchserv00nati](https://archive.org/details/bookofchurchserv00nati)) | 1922 | en | scan | Congregational orders | pd |
| Free Methodist Church USA, 2023 Book of Discipline, official PDF, including the rituals (in use) — Copyright 2024 Free Methodist Church USA. ([link](https://fmcusa.org/wp-content/uploads/2023-Book-of-Discipline-Interactive-PDF-FINAL.pdf)) | 2023 | en | pdf | current Free Methodist rituals | permission |
| Church of the Nazarene Manual 2023, official PDF including the ritual (in use) — Read the site's terms of use before quoting. ([link](https://nazarene.org/manual/)) | 2023 | en | pdf | current Nazarene ritual | permission |

Blocked: United Methodist Book of Worship and Hymnal, Methodist Worship Book (UK), Moravian Book of Worship: in copyright; Moravian, Congregational and Holiness families are not in the catalog yet.

## Old Catholic

### 26. old-catholic

Catalog: `old-catholic`, `union-utrecht`, `pncc`, `utrecht-netherlands`, `utrecht-germany`, `utrecht-switzerland`, `utrecht-austria`, `utrecht-czechia`, `utrecht-poland` · rite `new` · Mass · now **none**

Missing: vernacular Old Catholic Mass books; PNCC liturgy.

Not yet located. The 19th-century German Old Catholic altar books and the early PNCC liturgy are the likely public-domain bases; search national library catalogues (Deutsche Digitale Bibliothek, Polona) next.


Blocked: no candidate source found yet.
