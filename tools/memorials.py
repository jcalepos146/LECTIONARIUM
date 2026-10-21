"""General Roman Calendar memorials, with the proper calendar of the United States (M = obligatory, m = optional; r = red)."""
RAW = """
01-02|M|w|Sts Basil the Great and Gregory Nazianzen, bishops and doctors
01-03|m|w|The Most Holy Name of Jesus
01-04|M|w|St Elizabeth Ann Seton, religious (USA)
01-05|M|w|St John Neumann, bishop (USA)
01-06|m|w|St André Bessette, religious (USA)
01-07|m|w|St Raymond of Penyafort, priest
01-13|m|w|St Hilary, bishop and doctor
01-17|M|w|St Anthony, abbot
01-20|m|r|St Fabian, pope and martyr
01-20|m|r|St Sebastian, martyr
01-21|M|r|St Agnes, virgin and martyr
01-23|m|r|St Vincent, deacon and martyr (USA)
01-23|m|w|St Marianne Cope, virgin (USA)
01-24|M|w|St Francis de Sales, bishop and doctor
01-26|M|w|Sts Timothy and Titus, bishops
01-27|m|w|St Angela Merici, virgin
01-28|M|w|St Thomas Aquinas, priest and doctor
01-31|M|w|St John Bosco, priest
02-03|m|r|St Blaise, bishop and martyr
02-03|m|w|St Ansgar, bishop
02-05|M|r|St Agatha, virgin and martyr
02-06|M|r|Sts Paul Miki and companions, martyrs
02-08|m|w|St Jerome Emiliani
02-08|m|w|St Josephine Bakhita, virgin
02-10|M|w|St Scholastica, virgin
02-11|m|w|Our Lady of Lourdes
02-14|M|w|Sts Cyril, monk, and Methodius, bishop
02-17|m|w|Seven Holy Founders of the Servite Order
02-21|m|w|St Peter Damian, bishop and doctor
02-23|M|r|St Polycarp, bishop and martyr
02-27|m|w|St Gregory of Narek, abbot and doctor
03-03|m|w|St Katharine Drexel, virgin (USA)
03-04|m|w|St Casimir
03-07|M|r|Sts Perpetua and Felicity, martyrs
03-08|m|w|St John of God, religious
03-09|m|w|St Frances of Rome, religious
03-17|m|w|St Patrick, bishop
03-18|m|w|St Cyril of Jerusalem, bishop and doctor
03-23|m|w|St Toribio of Mogrovejo, bishop
04-02|m|w|St Francis of Paola, hermit
04-04|m|w|St Isidore, bishop and doctor
04-05|m|w|St Vincent Ferrer, priest
04-07|M|w|St John Baptist de la Salle, priest
04-11|M|r|St Stanislaus, bishop and martyr
04-13|m|r|St Martin I, pope and martyr
04-21|m|w|St Anselm, bishop and doctor
04-23|m|r|St George, martyr
04-23|m|r|St Adalbert, bishop and martyr
04-24|m|r|St Fidelis of Sigmaringen, priest and martyr
04-28|m|r|St Peter Chanel, priest and martyr
04-28|m|w|St Louis Grignion de Montfort, priest
04-29|M|w|St Catherine of Siena, virgin and doctor
04-30|m|w|St Pius V, pope
05-01|m|w|St Joseph the Worker
05-02|M|w|St Athanasius, bishop and doctor
05-10|m|w|St Damien de Veuster, priest (USA)
05-10|m|w|St John of Avila, priest and doctor
05-12|m|r|Sts Nereus and Achilleus, martyrs
05-12|m|r|St Pancras, martyr
05-13|m|w|Our Lady of Fatima
05-15|m|w|St Isidore the Farmer (USA)
05-18|m|r|St John I, pope and martyr
05-20|m|w|St Bernardine of Siena, priest
05-21|m|r|St Christopher Magallanes and companions, martyrs
05-22|m|w|St Rita of Cascia, religious
05-25|m|w|St Bede the Venerable, priest and doctor
05-25|m|w|St Gregory VII, pope
05-25|m|w|St Mary Magdalene de' Pazzi, virgin
05-26|M|w|St Philip Neri, priest
05-27|m|w|St Augustine of Canterbury, bishop
05-29|m|w|St Paul VI, pope
06-01|M|r|St Justin, martyr
06-02|m|r|Sts Marcellinus and Peter, martyrs
06-03|M|r|Sts Charles Lwanga and companions, martyrs
06-05|M|r|St Boniface, bishop and martyr
06-06|m|w|St Norbert, bishop
06-09|m|w|St Ephrem, deacon and doctor
06-11|M|r|St Barnabas, apostle
06-13|M|w|St Anthony of Padua, priest and doctor
06-19|m|w|St Romuald, abbot
06-21|M|w|St Aloysius Gonzaga, religious
06-22|m|w|St Paulinus of Nola, bishop
06-22|m|r|Sts John Fisher, bishop, and Thomas More, martyrs
06-27|m|w|St Cyril of Alexandria, bishop and doctor
06-28|M|r|St Irenaeus, bishop, martyr and doctor
06-30|m|r|The First Martyrs of the Holy Roman Church
07-01|m|w|St Junípero Serra, priest (USA)
07-05|m|w|St Anthony Zaccaria, priest
07-05|m|w|St Elizabeth of Portugal (USA)
07-06|m|r|St Maria Goretti, virgin and martyr
07-09|m|r|Sts Augustine Zhao Rong and companions, martyrs
07-11|M|w|St Benedict, abbot
07-13|m|w|St Henry
07-14|M|w|St Kateri Tekakwitha, virgin (USA)
07-15|M|w|St Bonaventure, bishop and doctor
07-16|m|w|Our Lady of Mount Carmel
07-18|m|w|St Camillus de Lellis, priest (USA)
07-20|m|r|St Apollinaris, bishop and martyr
07-21|m|w|St Lawrence of Brindisi, priest and doctor
07-23|m|w|St Bridget, religious
07-24|m|w|St Sharbel Makhlūf, priest
07-26|M|w|Sts Joachim and Anne, parents of the Blessed Virgin Mary
07-29|M|w|Sts Martha, Mary and Lazarus
07-30|m|w|St Peter Chrysologus, bishop and doctor
07-31|M|w|St Ignatius of Loyola, priest
08-01|M|w|St Alphonsus Liguori, bishop and doctor
08-02|m|w|St Eusebius of Vercelli, bishop
08-02|m|w|St Peter Julian Eymard, priest
08-04|M|w|St John Vianney, priest
08-05|m|w|The Dedication of the Basilica of St Mary Major
08-07|m|r|St Sixtus II, pope, and companions, martyrs
08-07|m|w|St Cajetan, priest
08-08|M|w|St Dominic, priest
08-09|m|r|St Teresa Benedicta of the Cross, virgin and martyr
08-11|M|w|St Clare, virgin
08-12|m|w|St Jane Frances de Chantal, religious
08-13|m|r|Sts Pontian, pope, and Hippolytus, priest, martyrs
08-14|M|r|St Maximilian Kolbe, priest and martyr
08-16|m|w|St Stephen of Hungary
08-19|m|w|St John Eudes, priest
08-20|M|w|St Bernard, abbot and doctor
08-21|M|w|St Pius X, pope
08-22|M|w|The Queenship of the Blessed Virgin Mary
08-23|m|w|St Rose of Lima, virgin
08-25|m|w|St Louis
08-25|m|w|St Joseph Calasanz, priest
08-27|M|w|St Monica
08-28|M|w|St Augustine, bishop and doctor
08-29|M|r|The Passion of St John the Baptist
09-03|M|w|St Gregory the Great, pope and doctor
09-09|M|w|St Peter Claver, priest (USA)
09-12|m|w|The Most Holy Name of Mary
09-13|M|w|St John Chrysostom, bishop and doctor
09-15|M|w|Our Lady of Sorrows
09-16|M|r|Sts Cornelius, pope, and Cyprian, bishop, martyrs
09-17|m|w|St Robert Bellarmine, bishop and doctor
09-17|m|w|St Hildegard of Bingen, virgin and doctor
09-19|m|r|St Januarius, bishop and martyr
09-20|M|r|Sts Andrew Kim Tae-gŏn, Paul Chŏng Ha-sang and companions, martyrs
09-23|M|w|St Pius of Pietrelcina, priest
09-26|m|r|Sts Cosmas and Damian, martyrs
09-27|M|w|St Vincent de Paul, priest
09-28|m|r|St Wenceslaus, martyr
09-28|m|r|Sts Lawrence Ruiz and companions, martyrs
09-30|M|w|St Jerome, priest and doctor
10-01|M|w|St Thérèse of the Child Jesus, virgin and doctor
10-02|M|w|The Holy Guardian Angels
10-04|M|w|St Francis of Assisi
10-05|m|w|St Faustina Kowalska, virgin
10-06|m|w|St Bruno, priest
10-06|m|w|Bl. Marie Rose Durocher, virgin (USA)
10-07|M|w|Our Lady of the Rosary
10-09|m|r|St Denis, bishop, and companions, martyrs
10-09|m|w|St John Leonardi, priest
10-11|m|w|St John XXIII, pope
10-14|m|r|St Callistus I, pope and martyr
10-15|M|w|St Teresa of Jesus, virgin and doctor
10-16|m|w|St Hedwig, religious
10-16|m|w|St Margaret Mary Alacoque, virgin
10-17|M|r|St Ignatius of Antioch, bishop and martyr
10-19|M|r|Sts John de Brébeuf, Isaac Jogues and companions, martyrs (USA)
10-20|m|w|St Paul of the Cross, priest (USA)
10-22|m|w|St John Paul II, pope
10-23|m|w|St John of Capistrano, priest
10-24|m|w|St Anthony Mary Claret, bishop
11-03|m|w|St Martin de Porres, religious
11-04|M|w|St Charles Borromeo, bishop
11-10|M|w|St Leo the Great, pope and doctor
11-11|M|w|St Martin of Tours, bishop
11-12|M|r|St Josaphat, bishop and martyr
11-13|M|w|St Frances Xavier Cabrini, virgin (USA)
11-15|m|w|St Albert the Great, bishop and doctor
11-16|m|w|St Margaret of Scotland
11-16|m|w|St Gertrude, virgin
11-17|M|w|St Elizabeth of Hungary, religious
11-18|m|w|The Dedication of the Basilicas of Sts Peter and Paul
11-18|m|w|St Rose Philippine Duchesne, virgin (USA)
11-21|M|w|The Presentation of the Blessed Virgin Mary
11-22|M|r|St Cecilia, virgin and martyr
11-23|m|r|St Clement I, pope and martyr
11-23|m|w|St Columban, abbot
11-23|m|r|Bl. Miguel Agustín Pro, priest and martyr (USA)
11-24|M|r|Sts Andrew Dũng-Lạc and companions, martyrs
11-25|m|r|St Catherine of Alexandria, virgin and martyr
12-03|M|w|St Francis Xavier, priest
12-04|m|w|St John Damascene, priest and doctor
12-06|m|w|St Nicholas, bishop
12-07|M|w|St Ambrose, bishop and doctor
12-09|m|w|St Juan Diego Cuauhtlatoatzin
12-10|m|w|Our Lady of Loreto
12-11|m|w|St Damasus I, pope
12-13|M|r|St Lucy, virgin and martyr
12-14|M|w|St John of the Cross, priest and doctor
12-21|m|w|St Peter Canisius, priest and doctor
12-23|m|w|St John of Kanty, priest
12-29|m|r|St Thomas Becket, bishop and martyr
12-31|m|w|St Sylvester I, pope
"""
MEM = {}
for line in RAW.strip().splitlines():
    md, rk, col, name = line.split("|", 3)
    MEM.setdefault(md, []).append((rk, "red" if col == "r" else "white", name))
# obligatory memorials whose readings are proper (Lectionary for Mass): label -> citation
PROPER = {
    "01-26": [("First Reading", "2 Tim 1:1-8 or Titus 1:1-5")],
    "06-11": [("First Reading", "Acts 11:21b-26; 13:1-3")],
    "07-26": [("Gospel", "Matt 13:16-17")],
    "07-29": [("Gospel", "John 11:19-27 or Luke 10:38-42")],
    "08-29": [("Gospel", "Mark 6:17-29")],
    "09-15": [("Gospel", "John 19:25-27 or Luke 2:33-35")],
    "10-02": [("Gospel", "Matt 18:1-5, 10")],
    "IHM": [("Gospel", "Luke 2:41-51")],
}
