"""Emit the page data (names, seasons, readings, hybrid plan) as compact JSON."""
import json

d = json.load(open("data_all.json"))
TRAD, NO = d["TRAD"], d["NO"]
raw = json.load(open("no_raw.json"))

# 2nd Sunday after Christmas (#19) for the Holy Name / Jan 2-5 slot
NO["Christmas2"] = {y: {"first": ["Sir 24:1-2, 8-12"], "psalm": ["Ps 147:12-13, 14-15, 19-20"],
                        "second": ["Eph 1:3-6, 15-18"], "gospel": ["John 1:1-18 or 1:1-5, 9-14"]} for y in "ABC"}
# The spreadsheet records Sir 24 as 24:1-4, 12-16 (older numbering); keep its text
NO["Christmas2"] = {y: {"first": ["Sir 24:1-4, 12-16"], "psalm": ["Ps 147:12-13, 14-15, 19-20"],
                        "second": ["Eph 1:3-6, 15-18"], "gospel": ["John 1:1-18 or 1:1-5, 9-14"]} for y in "ABC"}

T_NAMES = {
 "Adv1": ("1st Sunday of Advent", "advent", "violet"), "Adv2": ("2nd Sunday of Advent", "advent", "violet"),
 "Adv3": ("3rd Sunday of Advent (Gaudete)", "advent", "rose"), "Adv4": ("4th Sunday of Advent", "advent", "violet"),
 "Christmas-Midnight": ("Christmas · Mass at Midnight", "christmas", "white"),
 "Christmas-Dawn": ("Christmas · Mass at Dawn", "christmas", "white"),
 "Christmas-Day": ("Christmas · Mass during the Day", "christmas", "white"),
 "SunOctChristmas": ("Sunday within the Octave of Christmas", "christmas", "white"),
 "Jan1": ("Octave Day of Christmas (Circumcision)", "christmas", "white"),
 "HolyName": ("Most Holy Name of Jesus", "christmas", "white"),
 "Epiphany": ("Epiphany of the Lord", "epiphany", "white"),
 "HolyFamily": ("Holy Family (Sunday after Epiphany)", "epiphany", "white"),
 "Epi2": ("2nd Sunday after Epiphany", "epiphany", "green"), "Epi3": ("3rd Sunday after Epiphany", "epiphany", "green"),
 "Epi4": ("4th Sunday after Epiphany", "epiphany", "green"), "Epi5": ("5th Sunday after Epiphany", "epiphany", "green"),
 "Epi6": ("6th Sunday after Epiphany", "epiphany", "green"),
 "Septuagesima": ("Septuagesima Sunday", "gesima", "violet"), "Sexagesima": ("Sexagesima Sunday", "gesima", "violet"),
 "Quinquagesima": ("Quinquagesima Sunday", "gesima", "violet"), "AshWed": ("Ash Wednesday", "lent", "violet"),
 "Lent1": ("1st Sunday of Lent", "lent", "violet"), "Lent2": ("2nd Sunday of Lent", "lent", "violet"),
 "Lent3": ("3rd Sunday of Lent", "lent", "violet"), "Lent4": ("4th Sunday of Lent (Laetare)", "lent", "rose"),
 "Lent5": ("Passion Sunday", "lent", "violet"), "PalmSunday": ("Palm Sunday", "holyweek", "red"),
 "HolyThursday": ("Holy Thursday · Mass of the Lord's Supper", "holyweek", "white"),
 "GoodFriday": ("Good Friday", "holyweek", "black"), "EasterVigil": ("Easter Vigil", "holyweek", "white"),
 "Easter": ("Easter Sunday", "easter", "white"), "Pasc1": ("Low Sunday (1st after Easter)", "easter", "white"),
 "Pasc2": ("2nd Sunday after Easter", "easter", "white"), "Pasc3": ("3rd Sunday after Easter", "easter", "white"),
 "Pasc4": ("4th Sunday after Easter", "easter", "white"), "Pasc5": ("5th Sunday after Easter", "easter", "white"),
 "Ascension": ("Ascension of the Lord", "easter", "white"),
 "SunAfterAscension": ("Sunday after the Ascension", "easter", "white"),
 "PentecostVigil": ("Vigil of Pentecost", "easter", "red"), "Pentecost": ("Pentecost Sunday", "easter", "red"),
 "Trinity": ("Most Holy Trinity", "pentecost", "white"), "CorpusChristi": ("Corpus Christi", "pentecost", "white"),
 "SacredHeart": ("Most Sacred Heart of Jesus", "pentecost", "white"),
 "ChristKing": ("Christ the King (last Sunday of October)", "pentecost", "white"),
 "Presentation": ("Presentation of the Lord (Candlemas)", "sanctoral", "white"),
 "StJoseph": ("St Joseph", "sanctoral", "white"), "Annunciation": ("Annunciation", "sanctoral", "white"),
 "JohnBaptist": ("Nativity of St John the Baptist", "sanctoral", "white"),
 "PeterPaul": ("Sts Peter and Paul", "sanctoral", "red"), "Transfiguration": ("Transfiguration", "sanctoral", "white"),
 "Assumption": ("Assumption of the BVM", "sanctoral", "white"), "AllSaints": ("All Saints", "sanctoral", "white"),
 "AllSouls": ("All Souls (1st Mass)", "sanctoral", "black"), "Immaculate": ("Immaculate Conception", "sanctoral", "white"),
}
for i in range(2, 25):
    T_NAMES[f"Pent{i}"] = (f"{i}{'nd' if i in (2, 22) else 'rd' if i in (3, 23) else 'st' if i == 21 else 'th'} Sunday after Pentecost", "pentecost", "green")
for i in range(3, 7):
    T_NAMES[f"PentEpi{i}"] = (f"Resumed {i}{'rd' if i == 3 else 'th'} Sunday after Epiphany", "pentecost", "green")

N_NAMES = {
 "Adv1": "1st Sunday of Advent", "Adv2": "2nd Sunday of Advent", "Adv3": "3rd Sunday of Advent",
 "Adv4": "4th Sunday of Advent", "Christmas-Midnight": "Nativity · Mass at Night", "Christmas-Dawn": "Nativity · Mass at Dawn",
 "Christmas-Day": "Nativity · Mass during the Day", "HolyFamily": "Holy Family", "Jan1": "Mary, Mother of God",
 "Christmas2": "2nd Sunday after the Nativity", "Epiphany": "Epiphany of the Lord", "Baptism": "Baptism of the Lord",
 "AshWed": "Ash Wednesday", "PalmSunday": "Palm Sunday of the Lord's Passion", "HolyThursday": "Holy Thursday · Lord's Supper",
 "GoodFriday": "Good Friday", "EasterVigil": "Easter Vigil", "Easter": "Easter Sunday", "Ascension": "Ascension (Thursday)",
 "PentecostVigil": "Pentecost · Vigil Mass", "Pentecost": "Pentecost Sunday", "Trinity": "Most Holy Trinity",
 "CorpusChristi": "Body and Blood of Christ (Thursday)", "SacredHeart": "Most Sacred Heart of Jesus",
 "ChristKing": "Christ the King (34th Sunday)", "Presentation": "Presentation of the Lord", "StJoseph": "St Joseph",
 "Annunciation": "Annunciation", "JohnBaptist": "Nativity of St John the Baptist", "PeterPaul": "Sts Peter and Paul",
 "Transfiguration": "Transfiguration", "Assumption": "Assumption", "AllSaints": "All Saints", "AllSouls": "All Souls",
 "Immaculate": "Immaculate Conception",
}
for i in range(1, 6):
    N_NAMES[f"Lent{i}"] = f"{['1st','2nd','3rd','4th','5th'][i-1]} Sunday of Lent"
for i in range(2, 8):
    N_NAMES[f"Easter{i}"] = f"{['','','2nd','3rd','4th','5th','6th','7th'][i]} Sunday of Easter"
for i in range(2, 34):
    suf = "th" if 10 <= i % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(i % 10, "th")
    N_NAMES[f"OT{i}"] = f"{i}{suf} Sunday in Ordinary Time"

# ------------------------------------------------------------------ hybrid plan
# basis: "match" = new lectionary pairs this OT reading with the same Gospel
#        "parallel" = paired there with the synoptic parallel of this Gospel
#        "chosen" = editor's pairing, drawn from the new lectionary's Sunday/weekday readings
#        "apostle" = the day already has an OT lesson; the new lectionary's Apostle is added instead
#        "acts" = Paschaltide: Acts replaces the OT, as in the new lectionary
H = {
 "Adv1": ("Jer 33:14-16", "match", "Advent 1, Year C"), "Adv2": ("Isa 35:1-6a, 10", "match", "Advent 3, Year A"),
 "Adv3": ("Isa 61:1-2a, 10-11", "match", "Advent 3, Year B"), "Adv4": ("Bar 5:1-9", "match", "Advent 2, Year C"),
 "Christmas-Midnight": ("Isa 9:1-6", "match", "Christmas at Night"), "Christmas-Dawn": ("Isa 62:11-12", "match", "Christmas at Dawn"),
 "Christmas-Day": ("Isa 52:7-10", "match", "Christmas during the Day"),
 "SunOctChristmas": ("Mal 3:1-4", "match", "Presentation of the Lord"), "Jan1": ("Num 6:22-27", "match", "Mary, Mother of God"),
 "HolyName": ("Exod 3:13-15", "chosen", "from Lent 3, Year C (Exod 3:1-8a, 13-15)"),
 "Epiphany": ("Eph 3:2-3a, 5-6", "apostle", "Epiphany"), "HolyFamily": ("Sir 3:3-7, 14-17a", "match", "Holy Family"),
 "Epi2": ("Isa 62:1-5", "match", "Ordinary Time 2, Year C"), "Epi3": ("Lev 13:1-2, 44-46", "parallel", "Ordinary Time 6, Year B"),
 "Epi4": ("Job 38:1, 8-11", "parallel", "Ordinary Time 12, Year B"), "Epi5": ("Wis 12:13, 16-19", "match", "Ordinary Time 16, Year A"),
 "Epi6": ("Ezek 17:22-24", "parallel", "Ordinary Time 11, Year B"),
 "Septuagesima": ("Isa 55:6-9", "match", "Ordinary Time 25, Year A"),
 "Sexagesima": ("Isa 55:10-11", "parallel", "Ordinary Time 15, Year A"),
 "Quinquagesima": ("Jer 31:7-9", "parallel", "Ordinary Time 30, Year B"),
 "AshWed": ("2 Cor 5:20-6:2", "apostle", "Ash Wednesday"),
 "Lent1": ("Gen 2:7-9; 3:1-7", "match", "Lent 1, Year A"), "Lent2": ("Gen 12:1-4a", "match", "Lent 2, Year A"),
 "Lent3": ("Jer 7:23-28", "match", "Lent, Week 3, Thursday"), "Lent4": ("2 Kgs 4:42-44", "match", "Ordinary Time 17, Year B"),
 "Lent5": ("Gen 17:3-9", "match", "Lent, Week 5, Thursday"),
 "PalmSunday": ("Isa 50:4-7", "match", "Palm Sunday"), "HolyThursday": ("Exod 12:1-8, 11-14", "match", "Holy Thursday"),
 "GoodFriday": ("Isa 52:13-53:12", "match", "Good Friday"),
 "Easter": ("Acts 10:34a, 37-43", "acts", "Easter Sunday"), "Pasc1": ("Acts 2:42-47", "acts", "Easter 2, Year A"),
 "Pasc2": ("Acts 2:14a, 36-41", "acts", "Easter 4, Year A"), "Pasc3": ("Acts 2:14, 22-33", "acts", "Easter 3, Year A"),
 "Pasc4": ("Acts 16:22-34", "acts", "Easter, Week 6, Tuesday"), "Pasc5": ("Acts 4:23-31", "acts", "Easter, Week 2, Monday"),
 "Ascension": ("Eph 1:17-23", "apostle", "Ascension"), "SunAfterAscension": ("Acts 1:12-14", "acts", "Easter 7, Year A"),
 "Pentecost": ("1 Cor 12:3b-7, 12-13", "apostle", "Pentecost"),
 "Trinity": ("Deut 4:32-34, 39-40", "match", "Trinity, Year B"), "CorpusChristi": ("Deut 8:2-3, 14b-16a", "chosen", "Corpus Christi, Year A"),
 "SacredHeart": ("Hos 11:1, 3-4, 8c-9", "match", "Sacred Heart, Year B"),
 "Pent2": ("Prov 9:1-6", "chosen", "Ordinary Time 20, Year B"), "Pent3": ("Ezek 34:11-16", "chosen", "Sacred Heart, Year C"),
 "Pent4": ("Isa 6:1-2a, 3-8", "match", "Ordinary Time 5, Year C"), "Pent5": ("Sir 15:16-21", "match", "Ordinary Time 6, Year A"),
 "Pent6": ("Exod 16:2-4, 12-15", "chosen", "Ordinary Time 18, Year B"), "Pent7": ("Deut 11:18, 26-28, 32", "match", "Ordinary Time 9, Year A"),
 "Pent8": ("Amos 8:4-7", "match", "Ordinary Time 25, Year C"), "Pent9": ("Jer 7:1-11", "chosen", "Ordinary Time, Week 16, Saturday (Year II)"),
 "Pent10": ("Sir 35:12-14, 16-18", "match", "Ordinary Time 30, Year C"), "Pent11": ("Isa 35:4-7a", "match", "Ordinary Time 23, Year B"),
 "Pent12": ("Deut 30:10-14", "match", "Ordinary Time 15, Year C"), "Pent13": ("2 Kgs 5:14-17", "match", "Ordinary Time 28, Year C"),
 "Pent14": ("Isa 49:14-15", "match", "Ordinary Time 8, Year A"), "Pent15": ("1 Kgs 17:17-24", "match", "Ordinary Time 10, Year C"),
 "Pent16": ("Sir 3:17-18, 20, 28-29", "match", "Ordinary Time 22, Year C"), "Pent17": ("Deut 6:2-6", "parallel", "Ordinary Time 31, Year B"),
 "Pent18": ("Isa 43:18-19, 21-22, 24b-25", "parallel", "Ordinary Time 7, Year B"), "Pent19": ("Isa 25:6-10a", "match", "Ordinary Time 28, Year A"),
 "Pent20": ("Isa 65:17-21", "match", "Lent, Week 4, Monday"), "Pent21": ("Sir 27:30-28:7", "match", "Ordinary Time 24, Year A"),
 "Pent22": ("Isa 45:1, 4-6", "match", "Ordinary Time 29, Year A"), "Pent23": ("Wis 1:13-15; 2:23-24", "parallel", "Ordinary Time 13, Year B"),
 "Pent24": ("Dan 12:1-3", "parallel", "Ordinary Time 33, Year B"),
 "Presentation": ("Heb 2:14-18", "apostle", "Presentation"), "StJoseph": ("Rom 4:13, 16-18, 22", "apostle", "St Joseph"),
 "Annunciation": ("Heb 10:4-10", "apostle", "Annunciation"), "JohnBaptist": ("Acts 13:22-26", "apostle", "John the Baptist"),
 "PeterPaul": ("2 Tim 4:6-8, 17-18", "apostle", "Sts Peter and Paul"), "Transfiguration": ("Dan 7:9-10, 13-14", "match", "Transfiguration"),
 "Assumption": ("1 Cor 15:20-27", "apostle", "Assumption"), "ChristKing": ("Dan 7:13-14", "match", "Christ the King, Year B"),
 "AllSaints": ("Zeph 2:3; 3:12-13", "parallel", "Ordinary Time 4, Year A"), "AllSouls": ("Wis 3:1-9", "match", "All Souls"),
 "Immaculate": ("Eph 1:3-6, 11-12", "apostle", "Immaculate Conception"),
}
for i in range(3, 7):
    H[f"PentEpi{i}"] = H[f"Epi{i}"]

out = {
    "T": {k: {"n": T_NAMES[k][0], "s": T_NAMES[k][1], "c": T_NAMES[k][2], "p": TRAD[k]["pre55"], "m": TRAD[k]["1962"]}
          for k in TRAD},
    "N": {k: {"n": N_NAMES.get(k, k), **{y: v for y, v in NO[k].items()}} for k in NO},
    "H": {k: {"r": v[0], "b": v[1], "f": v[2]} for k, v in H.items()},
}
missing = [k for k in TRAD if k not in H and k not in ("EasterVigil", "PentecostVigil")]
print("hybrid missing:", missing)
print("no names missing:", [k for k in NO if k not in N_NAMES])
s = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
open("pagedata.json", "w").write(s)
print(len(s), "bytes")
