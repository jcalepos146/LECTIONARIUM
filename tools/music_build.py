"""Build chant.json (GABC for propers, Kyriale, dialogues, antiphons) and hymns.json (Open Hymnal ABC)."""
import json, re, sqlite3, os, glob, collections

db = sqlite3.connect("../music/gb.sqlite")
GA = json.load(open("../music/gabc_all.json"))
CM = json.load(open("chantmap.json"))


def ids_named(name, srcs=(2, 3, 5, 1)):
    r = db.execute('''select c.id, group_concat(distinct s.source) from gregobase_chants c join gregobase_chant_sources s on s.chant_id=c.id
                      where c.incipit=? group by c.id''', (name,)).fetchall()
    r.sort(key=lambda x: min([srcs.index(int(s)) if int(s) in srcs else 9 for s in x[1].split(",")]))
    return r[0][0] if r else None


ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]
NAMES = {"I": "Lux et origo", "II": "Kyrie fons bonitatis", "III": "Kyrie Deus sempiterne", "IV": "Cunctipotens Genitor Deus",
         "V": "Kyrie magnae Deus potentiae", "VI": "Kyrie Rex Genitor", "VII": "Kyrie Rex splendens", "VIII": "De Angelis",
         "IX": "Cum jubilo", "X": "Alme Pater", "XI": "Orbis factor", "XII": "Pater cuncta", "XIII": "Stelliferi Conditor orbis",
         "XIV": "Jesu Redemptor", "XV": "Dominator Deus", "XVI": "Ferial", "XVII": "Advent and Lent Sundays", "XVIII": "Deus Genitor alme"}
KYRIALE = {}
for r in ROMAN:
    m = {}
    for part in ("Kyrie", "Gloria", "Sanctus", "Agnus"):
        cid = ids_named(f"{part} {r}")
        if cid: m[part] = cid
    ite = ids_named(f"Ite {r}") or ids_named(f"Ite {r}a")
    if ite: m["Ite"] = ite
    elif r in ("XVI", "XVII", "XVIII"):
        m["Benedicamus"] = ids_named("Benedicamus XVII") if r == "XVII" else ids_named("Benedicamus (ad lib.)")
    if r == "I":
        m["Ite"] = ids_named("Ite Ia")
    KYRIALE[r] = {"name": NAMES[r], "ids": m}
CREDO = {r: ids_named(f"Credo {r}") for r in ("I", "II", "III", "IV", "V", "VI")}
COMMON = {
    "asperges": ids_named("Asperges me"), "vidi": ids_named("Vidi aquam"),
    "pref_sol": 4449, "pref_fer": 4450, "orat_fest": 4487, "evang": 4490,
    "pater": 7282, "mortem": 7269, "paxdomini": 7385, "ite_no": 7388,
    "salve": 2435, "alma": 1851, "ave": 2153, "regina": 2290,
}
used = set(CM["used"])
for v in KYRIALE.values(): used.update(v["ids"].values())
used.update(x for x in CREDO.values() if x); used.update(COMMON.values())
CH = {}
for cid in sorted(used):
    inc, part, mode, gabc = GA[str(cid)]
    CH[cid] = {"i": inc, "p": part, "m": mode, "g": gabc}
json.dump({"chants": CH, "kyriale": KYRIALE, "credo": CREDO, "common": COMMON, "map": CM["map"]},
          open("chant.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("chants", len(CH), os.path.getsize("chant.json") // 1024, "KB")
print({k: v["ids"] for k, v in KYRIALE.items()})

# ---------------------------------------------------------------- hymns
PICK = {
 "advent": ["O_Come_O_Come_Emmanuel", "Come_Thou_Long_Expected_Jesus", "On_Jordans_Bank_The_Baptists_Cry", "Hark_The_Glad_Sound",
            "Lo_He_Comes_On_Clouds_Descending", "Savior_Of_The_Nations_Come", "Comfort_Comfort_Ye_My_People", "The_Advent_of_Our_God",
            "Wake_Awake_For_Night_Is_Flying", "Gabriels_Message"],
 "christmas": ["O_Come_All_Ye_Faithful", "Hark_The_Herald_Angels_Sing", "Angels_We_Have_Heard_On_High", "Silent_Night", "The_First_Noel",
               "What_Child_Is_This", "Joy_To_The_World", "Of_The_Fathers_Love_Begotten", "Lo_How_A_Rose_Eer_Blooming",
               "It_Came_Upon_A_Midnight_Clear", "O_Little_Town_Of_Bethlehem", "In_The_Bleak_MidWinter", "Angels_From_The_Realms_Of_Glory",
               "God_Rest_Ye_Merry_Gentlemen", "Away_In_A_Manger", "A_Great_And_Mighty_Wonder"],
 "epiphany": ["As_With_Gladness_Men_Of_Old", "Songs_Of_Thankfulness_And_Praise", "The_Star_Proclaims_the_King_Is_Here",
              "O_Chief_Of_Cities_Bethlehem", "To_Jordan_Came_Our_Lord_The_Christ"],
 "lent": ["Lord_Who_Throughout_These_Forty_Days", "O_Sacred_Head_Now_Wounded", "When_I_Survey_The_Wondrous_Cross", "Beneath_The_Cross_Of_Jesus",
          "Jesus_In_Thy_Dying_Woes", "Out_Of_The_Deep_I_Cry_To_Thee", "Have_Mercy_On_Me_O_My_God", "Take_Up_Thy_Cross_The_Savior_Said",
          "Were_You_There", "Lord_Jesus_Think_On_Me", "Savior_When_In_Dust_To_Thee", "Go_to_Dark_Gethsemane", "Tis_Midnight_and_On_Olives_Brow",
          "Stricken_Smitten_And_Afflicted", "O_Love_How_Deep"],
 "palm": ["All_Glory_Laud_And_Honor", "Hosanna_Loud_Hosanna"],
 "easter": ["Jesus_Christ_Is_Risen_Today", "The_Strife_Is_Oer_The_Battle_Done", "At_The_Lambs_High_Feast", "Christ_The_Lord_Is_Risen_Today",
            "Alleluia_Alleluia_Hearts_to_Heaven_and_Voices_Raise", "Crown_Him_With_Many_Crowns", "Christ_Jesus_Lay_In_Deaths_Strong_Bands",
            "I_Know_That_My_Redeemer_Lives"],
 "ascension": ["See_The_Lord_Ascends_In_Triumph", "Lo_God_To_Heavn_Ascendeth", "Alleluia_Sing_To_Jesus", "The_Cloud_Received_Christ_From_Their_Sight",
               "Crown_Him_With_Many_Crowns"],
 "pentecost": ["Come_God_Creator_Holy_Ghost", "Come_Down_O_Love_Divine", "Holy_Spirit_Ever_Dwelling", "Breathe_On_Me_Breath_Of_God",
               "Come_Holy_Spirit_Lord_Our_God", "O_Holy_Spirit_Enter_In", "Holy_Ghost_With_Light_Divine"],
 "trinity": ["Holy_Holy_Holy", "Holy_God_We_Praise_Thy_Name", "O_Trinity_Most_Blessed_Light", "I_Bind_Unto_Myself_Today", "O_Holy_Blessed_Trinity"],
 "eucharist": ["Let_All_Mortal_Flesh_Keep_Silence", "Thou_Who_At_Thy_First_Eucharist", "Lord_Enthroned_In_Heavenly_Splendor",
               "O_Lord_I_Am_Not_Worthy", "Not_Worthy_Lord_To_Gather_Up_The_Crumbs", "Alleluia_Sing_To_Jesus", "I_Come_O_Savior_To_Thy_Table",
               "Savior_Who_Thy_Flock_Art_Feeding", "O_Wondrous_Type_O_Vision_Fair"],
 "general": ["Praise_To_The_Lord_The_Almighty", "Now_Thank_We_All_Our_God", "All_Creatures_Of_Our_God_And_King", "For_The_Beauty_Of_The_Earth",
             "Immortal_Invisible_God_Only_Wise", "Praise_My_Soul_The_King_Of_Heaven", "Faith_Of_Our_Fathers", "Be_Thou_My_Vision",
             "The_Churchs_One_Foundation", "Lift_High_The_Cross", "Our_God_Our_Help_In_Ages_Past", "Joyful_Joyful_We_Adore_Thee",
             "Praise_God_From_Whom_All_Blessings_Flow", "God_Himself_Is_Present", "Glorious_Things_of_Thee_Are_Spoken", "We_Gather_Together",
             "O_God_Our_Help", "Praise_The_Lord_Ye_Heavens_Adore_Him", "Jerusalem_the_Golden", "Lord_Dismiss_Us_With_Thy_Blessing",
             "O_Father_All_Creating", "The_Lords_My_Shepherd", "Jesus_Shall_Reign", "All_Hail_The_Power_Of_Jesus_Name"],
 "saints": ["For_All_The_Saints", "Behold_A_Host_Arrayed_In_White", "Jerusalem_the_Golden", "Faith_Of_Our_Fathers"],
 "king": ["Crown_Him_With_Many_Crowns", "Jesus_Shall_Reign", "All_Hail_The_Power_Of_Jesus_Name", "Christ_My_King_On_High", "Lift_High_The_Cross"],
 "mary": ["Magnificat", "Gabriels_Message"],
 "dead": ["Day_of_Wrath_O_Day_of_Mourning", "Abide_With_Me", "Jerusalem_the_Golden", "I_Know_That_My_Redeemer_Lives"],
}
HY, missing = {}, []
for season, names in PICK.items():
    for n in names:
        fs = sorted(glob.glob(f"../music/oh/Complete/{n}/*.abc"))
        if not fs:
            missing.append(n); continue
        if n in HY:
            HY[n]["s"].append(season); continue
        raw = open(fs[0], "rb").read()
        try:
            txt = raw.decode("utf-8")
        except UnicodeDecodeError:
            txt = raw.decode("cp1252")
        body = "\n".join(l for l in txt.splitlines() if not l.startswith("%") or l.startswith("%%MIDI"))
        title = next((l[2:].strip() for l in txt.splitlines() if l.startswith("T:")), n.replace("_", " "))
        tune = os.path.basename(fs[0]).split("-")[-1].replace(".abc", "").replace("_", " ")
        words = [l[2:].strip() for l in txt.splitlines() if l.startswith("W:")]
        HY[n] = {"t": title, "tune": tune, "s": [season], "abc": body, "w": words}
json.dump(HY, open("hymns.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("hymns", len(HY), "missing", missing, os.path.getsize("hymns.json") // 1024, "KB")
