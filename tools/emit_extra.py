"""Byzantine Sunday/feast readings, Liturgia Horarum Office of Readings Sundays, breviary Matins lessons."""
import json

# Byzantine (Slavic usage for the Luke order). Source: byzcath.org Byzantine lectionary;
# obvious typos in that table corrected to the standard citations (noted in comments).
EP = [None,
 "Heb 11:33-12:2",          # 1 All Saints (source: '11:323')
 "Rom 2:10-16", "Rom 5:1-10", "Rom 6:18-23", "Rom 10:1-10", "Rom 12:6-14", "Rom 15:1-7",
 "1 Cor 1:10-18", "1 Cor 3:9-17", "1 Cor 4:9-16", "1 Cor 9:2-12", "1 Cor 15:1-11", "1 Cor 16:13-24",
 "2 Cor 1:21-2:4", "2 Cor 4:6-15", "2 Cor 6:1-10", "2 Cor 6:16-7:1", "2 Cor 9:6-11", "2 Cor 11:31-12:9",
 "Gal 1:11-19", "Gal 2:16-20", "Gal 6:11-18",
 "Eph 2:4-10", "Eph 2:14-22",  # 24 (source: '2:4-22')
 "Eph 4:1-6", "Eph 5:9-19", "Eph 6:10-17", "Col 1:12-18",
 "Col 3:4-11",               # 29 (source repeats 3:12-16)
 "Col 3:12-16", "1 Tim 1:15-17", "1 Tim 4:9-15"]
GM = [None, "Matt 10:32-33, 37-38; 19:27-30", "Matt 4:18-23", "Matt 6:22-33", "Matt 8:5-13", "Matt 8:28-9:1",
      "Matt 9:1-8", "Matt 9:27-35", "Matt 14:14-22", "Matt 14:22-34", "Matt 17:14-23", "Matt 18:23-35",
      "Matt 19:16-26", "Matt 21:33-42", "Matt 22:1-14", "Matt 22:35-46", "Matt 25:14-30", "Matt 15:21-28"]
LG = [None, "Luke 5:1-11", "Luke 6:31-36", "Luke 7:11-16", "Luke 8:5-15", "Luke 16:19-31", "Luke 8:26-39",
      "Luke 8:41-56", "Luke 10:25-37", "Luke 12:16-21", "Luke 13:10-17", "Luke 14:16-24", "Luke 17:12-19",
      "Luke 18:18-27", "Luke 18:35-43"]   # 28th: Luke 14:16-24 (source shows 18:35-43 twice)
MOVE = {  # offset from Pascha (Gregorian here): [name, epistle, gospel]
 -77: ["Sunday of Zacchaeus", "1 Tim 4:9-15", "Luke 19:1-10"],
 -70: ["Sunday of the Publican and Pharisee", "2 Tim 3:10-15", "Luke 18:10-14"],
 -63: ["Sunday of the Prodigal Son", "1 Cor 6:12-20", "Luke 15:11-32"],
 -56: ["Meatfare Sunday · Last Judgment", "1 Cor 8:8-9:2", "Matt 25:31-46"],
 -49: ["Cheesefare Sunday · Forgiveness", "Rom 13:11-14:4", "Matt 6:14-21"],
 -42: ["1st Sunday of Lent · Orthodoxy", "Heb 11:24-26, 32-12:2", "John 1:43-51"],
 -35: ["2nd Sunday of Lent", "Heb 1:10-2:3", "Mark 2:1-12"],
 -28: ["3rd Sunday of Lent · Holy Cross", "Heb 4:14-5:6", "Mark 8:34-9:1"],
 -21: ["4th Sunday of Lent · St John Climacus", "Heb 6:13-20", "Mark 9:17-31"],
 -14: ["5th Sunday of Lent · St Mary of Egypt", "Heb 9:11-14", "Mark 10:32-45"],
 -7: ["Palm Sunday", "Phil 4:4-9", "John 12:1-18"],
 -3: ["Great and Holy Thursday", "1 Cor 11:23-32", "Matt 26:1-27:2 (composite)"],
 -2: ["Great and Holy Friday · Vespers", "1 Cor 1:18-2:2", "Matt 27:1-61 (composite)"],
 -1: ["Holy Saturday · Vesperal Liturgy", "Rom 6:3-11", "Matt 28:1-20"],
 0: ["Pascha", "Acts 1:1-8", "John 1:1-17"],
 7: ["Thomas Sunday", "Acts 5:12-20", "John 20:19-31"],
 14: ["Sunday of the Myrrhbearers", "Acts 6:1-7", "Mark 15:43-16:8"],
 21: ["Sunday of the Paralytic", "Acts 9:32-42", "John 5:1-15"],
 28: ["Sunday of the Samaritan Woman", "Acts 11:19-26, 29-30", "John 4:5-42"],   # source: '11:15-26', 'John 4:5-4:2'
 35: ["Sunday of the Blind Man", "Acts 16:16-34", "John 9:1-38"],
 39: ["Ascension", "Acts 1:1-12", "Luke 24:36-53"],
 42: ["Fathers of the First Council", "Acts 20:16-18, 28-36", "John 17:1-13"],
 49: ["Pentecost", "Acts 2:1-11", "John 7:37-52; 8:12"],
}
FIXEDSUN = [  # [month, firstDay, lastDay, name, epistle, gospel]
 [7, 13, 19, "Fathers of the Six Councils", "Heb 13:7-16", "John 17:1-13"],
 [9, 7, 13, "Sunday before the Exaltation", "Gal 6:11-18", "John 3:13-17"],
 [9, 15, 21, "Sunday after the Exaltation", "Gal 2:16-20", "Mark 8:34-9:1"],
 [12, 11, 17, "Sunday of the Forefathers", "Col 3:4-11", "Luke 14:16-24"],
 [12, 18, 24, "Sunday before the Nativity", "Heb 11:9-10, 17-23, 32-40", "Matt 1:1-25"],
 [12, 26, 31, "Sunday after the Nativity", "Gal 1:11-19", "Matt 2:13-23"],
 [1, 1, 5, "Sunday before Theophany", "2 Tim 4:5-8", "Mark 1:1-8"],
 [1, 7, 13, "Sunday after Theophany", "Eph 4:7-13", "Matt 4:12-17"],
]
FEASTS = {  # "MM-DD": [name, epistle, gospel]
 "12-25": ["Nativity of Christ", "Gal 4:4-7", "Matt 2:1-12"],
 "01-06": ["Theophany", "Titus 2:11-14; 3:4-7", "Matt 3:13-17"],
 "02-02": ["Meeting of the Lord", "Heb 7:7-17", "Luke 2:22-40"],
 "03-25": ["Annunciation", "Heb 2:11-18", "Luke 1:24-38"],
 "06-24": ["Nativity of John the Baptist", "Rom 13:11-14:4", "Luke 1:1-25, 57-68, 76, 80"],
 "06-29": ["Sts Peter and Paul", "2 Cor 11:21-12:9", "Matt 16:13-19"],
 "08-06": ["Transfiguration", "2 Pet 1:10-19", "Matt 17:1-9"],
 "08-15": ["Dormition", "Phil 2:5-11", "Luke 10:38-42; 11:27-28"],
 "09-08": ["Nativity of the Theotokos", "Phil 2:5-11", "Luke 10:38-42; 11:27-28"],
 "09-14": ["Exaltation of the Holy Cross", "1 Cor 1:18-24", "John 19:6-11, 13-20, 25-28, 30-35"],
 "11-21": ["Entrance of the Theotokos into the Temple", "Heb 9:1-7", "Luke 10:38-42; 11:27-28"],
 "01-01": ["Circumcision of the Lord · St Basil the Great", "Col 2:8-12", "Luke 2:20-21, 40-52"],
 "08-29": ["Beheading of St John the Baptist", "Acts 13:25-32", "Mark 6:14-30"],
 "10-01": ["Holy Protection of the Theotokos", "Heb 9:1-7", "Luke 10:38-42; 11:27-28"],
}
# precedence class: "lord" replaces a Sunday; any other feast on a Sunday is kept together with the Sunday
KIND = {"12-25": "lord", "01-06": "lord", "02-02": "lord", "08-06": "lord", "09-14": "lord", "01-01": "lord",
        "03-25": "theotokos", "08-15": "theotokos", "09-08": "theotokos", "11-21": "theotokos", "10-01": "theotokos",
        "06-24": "saint", "06-29": "saint", "08-29": "saint"}

# Liturgia Horarum, Office of Readings, Sunday biblical reading (one-year cycle).
# Source: Felix Just, catholic-resources.org/LoH/OfficeOfReadings-Biblical.html (vol. & page given there).
LOH = {
 "Adv1": "Isa 1:1-18", "Adv2": "Isa 22:8b-23", "Adv3": "Isa 29:13-24", "Adv4": "Dated reading (17–24 Dec)",
 "HolyFamily": "Eph 5:21-6:4", "Christmas2": "Dated reading (2–5 Jan)", "Epiphany": "Isa 60:1-22",
 "Baptism": "Isa 42:1-9; 49:1-9",
 "OT2": "Deut 1:1, 6-18", "OT3": "Deut 18:1-22", "OT4": "1 Thess 1:1-2:12", "OT5": "Gal 1:1-12",
 "OT6": "Prov 1:1-7, 20-33", "OT7": "Eccl 1:1-18", "OT8": "Job 1:1-22", "OT9": "Job 28:1-28",
 "OT10": "Sir 46:1-10", "OT11": "Judg 2:6-3:4", "OT12": "1 Sam 16:1-13", "OT13": "1 Sam 26:5-25",
 "OT14": "2 Sam 11:1-17, 26-27", "OT15": "1 Kgs 16:29-17:16", "OT16": "2 Cor 1:1-14", "OT17": "2 Cor 7:2-16",
 "OT18": "Amos 1:1-2:3", "OT19": "Hos 11:1-11", "OT20": "Isa 6:1-13", "OT21": "Zeph 1:1-7, 14-2:3",
 "OT22": "Jer 11:18-20; 12:1-13", "OT23": "Jer 37:21; 38:14-28", "OT24": "Ezek 1:3-13, 22-28",
 "OT25": "Ezek 24:15-27", "OT26": "Phil 1:1-11", "OT27": "1 Tim 1:1-20", "OT28": "Hag 1:1-2:10",
 "OT29": "Esth 1:1-3; 2:5-10, 16-17 (selections)", "OT30": "Wis 1:1-15", "OT31": "1 Macc 1:1-24",
 "OT32": "Dan 1:1-21", "OT33": "Joel 2:21-3:5", "ChristKing": "Rev 1:4b-6, 10, 12-18; 2:26, 28; 3:5b, 12, 20-21",
 "Lent1": "Exod 5:1-6:1", "Lent2": "Exod 13:17-14:9", "Lent3": "Exod 22:20-23:9", "Lent4": "Lev 8:1-17; 9:22-24",
 "Lent5": "Heb 1:1-2:4", "PalmSunday": "Heb 10:1-18", "Easter": "Replaced by the Easter Vigil",
 "Easter2": "Col 3:1-17", "Easter3": "Rev 6:1-17", "Easter4": "Rev 12:1-17", "Easter5": "Rev 18:21-19:10",
 "Easter6": "1 John 1:1-10", "Easter7": "1 John 3:18-24", "Pentecost": "Rom 8:5-27", "Trinity": "1 Cor 2:1-16",
}

office = json.load(open("office.json"))
extra = {"BYZ": {"EP": EP, "GM": GM, "LG": LG, "MOVE": {str(k): v for k, v in MOVE.items()}, "FIXEDSUN": FIXEDSUN,
                 "FEASTS": FEASTS, "KIND": KIND}, "LOH": LOH, "BRV": office}
s = json.dumps(extra, ensure_ascii=False, separators=(",", ":"))
open("extradata.json", "w").write(s)
print(len(s), "bytes")
