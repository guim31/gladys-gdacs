# GDACS

Verfolge in Gladys die großen Naturkatastrophen der Welt: Erdbeben, tropische Wirbelstürme,
Überschwemmungen, Vulkanausbrüche, Dürren und Waldbrände, so wie
[GDACS](https://www.gdacs.org) sie einstuft (Global Disaster Awareness and Coordination System, eine
Zusammenarbeit der Vereinten Nationen und der Europäischen Kommission). Jedes Ereignis erhält eine grüne,
orange oder rote Warnstufe, je nach erwarteten humanitären Folgen.

Die Integration behält die Ereignisse **deines Gebiets**: einen Radius um dein Haus, die Länder, die du
wählst, und auf Wunsch jede rote Warnung der Welt (Familie im Ausland, Reisen). Kein Konto, kein
API-Schlüssel.

Eine Ergänzung, kein Sicherheitswarnsystem: Befolge im Notfall die Anweisungen deiner örtlichen Behörden.
Nicht mit GDACS, der Europäischen Kommission oder den Vereinten Nationen verbunden.

## Was du bekommst

- Ein Gerät **GDACS-Warnungen**: Anzahl der aktiven Warnungen in deinem Gebiet, höchste Warnstufe,
  neuestes Ereignis (ausgeschrieben) und Entfernung des nächsten Ereignisses, mit ihrem Verlauf.
- Ein **Dashboard-Widget**, das die aktuellen Warnungen auflistet, höchste Stufe zuerst, dann die nächsten,
  jede mit ihrem GDACS-Bericht.
- Zwei **Szenen-Auslöser**: ein neues Ereignis in deinem Gebiet, und die Warnstufe eines Ereignisses
  erhöht.
- Eine **Szenen-Aktion**, die die aktuellen Warnungen als einen Satz liest, zum Senden per Nachricht oder
  zum Vorlesen.

## Voraussetzungen

- Gladys Assistant 5.1 oder neuer.
- Internetzugang vom Gladys-Rechner (die Integration liest `www.gdacs.org`).
- Für den Radius um dein Haus: ein Standort für dein Haus in Gladys (Einstellungen → Häuser) oder in der
  Konfiguration eingetragene Koordinaten.

## Konfiguration

### Einstellungen

| Einstellung                              | Wirkung                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Breiten- und Längengrad des Mittelpunkts | Mittelpunkt des Gebiets. Lass beide leer, um den Standort deines Hauses in Gladys zu verwenden. Dezimalkomma wird akzeptiert.  |
| Radius                                   | 100 bis 5.000 km um den Mittelpunkt (standardmäßig 1.000 km).                                                                  |
| Länder                                   | ISO-Codes (`DE` oder `DEU`, durch Kommas getrennt): die Ereignisse, die diese Länder betreffen, egal wo ihr Mittelpunkt liegt. |
| Ereignistypen                            | Die zu verfolgenden Gefahren (standardmäßig alle sechs).                                                                       |
| Mindestwarnstufe                         | Grün (Standard), Orange oder Rot.                                                                                              |
| Rote Warnungen der ganzen Welt           | Verfolge auch jede rote Warnung, wo auch immer (standardmäßig aus).                                                            |
| Aktualisierungsintervall                 | 10, 15 (Standard), 30 oder 60 Minuten.                                                                                         |
| Sprache der Texte                        | Namen der Funktionen (bei ihrer Erstellung) und Texte für die Szenen. Standardmäßig Französisch.                               |

Speichere, öffne dann den Tab **Entdecken** der Integration und lege das Gerät **GDACS-Warnungen** an. Der
Knopf **Aktuelle Warnungen anzeigen** in der Konfiguration listet sofort die Warnungen deines Gebiets auf:
ein schneller Weg, die Einstellungen zu prüfen.

### Das verfolgte Gebiet

Ein Ereignis wird verfolgt, wenn es auf GDACS aktuell ist, von einem gewählten Typ, mindestens auf der
Mindeststufe, und:

- sein Punkt innerhalb des Radius um den Mittelpunkt liegt. Der Punkt ist der, den GDACS angibt: das
  Epizentrum eines Erdbebens, die aktuelle Position eines Wirbelsturms, die Mitte einer Flut, einer Dürre
  oder eines Brandes;
- oder es eines der gewählten Länder betrifft (die Liste der betroffenen Länder, die GDACS veröffentlicht);
- oder es eine rote Warnung ist und „Rote Warnungen der ganzen Welt“ eingeschaltet ist.

Eine Dürre oder eine Flut kann sich über Tausende Kilometer erstrecken: Der Mittelpunkt kann weit von dir
entfernt sein, während dein Land betroffen ist. Trage dein Land in die Einstellung **Länder** ein, um sie
zu erfassen.

Die GDACS-Stufen: **Grün**, ein begrenztes Ereignis, keine internationale Hilfe erwartet; **Orange**, Hilfe
kann nötig sein; **Rot**, eine schwere Katastrophe. Grün heißt nicht „nichts passiert“: Ein Erdbeben der
Stärke 4,5 nahe deinem Zuhause ist grün.

## Gerät

| Funktion                            | Typ             | Wert                                                                                                         |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| Aktive Warnungen                    | Zähler          | Anzahl der verfolgten Ereignisse                                                                             |
| Höchste Warnstufe                   | Risiko          | 0 keine Warnung, 1 Grün, 2 Orange, 3 Rot (das Risiko-Abzeichen von Gladys, eine Stufe über der GDACS-Farbe)  |
| Neuestes Ereignis                   | Text            | Das neueste Ereignis, z. B. `Orange · Tropischer Wirbelsturm SIMON-26 250 km/h · México · 3.279 km`          |
| Entfernung des nächsten Ereignisses | Entfernung (km) | Entfernung zum nächsten verfolgten Ereignis; 20.038 km (so weit kann ein Punkt höchstens sein) ohne Ereignis |

Ohne Mittelpunkt (kein Hausstandort und keine Koordinaten) wird die Entfernung nicht veröffentlicht. Die
Werte werden im Container in jedem Intervall gelesen: Gladys fragt das Gerät nicht ab.

## Dashboard-Widget

**GDACS-Warnungen**: eine Überschrift mit der Anzahl der Warnungen, dann bis zu 8 Ereignisse, höchste Stufe
zuerst, dann die nächsten. Jede Zeile zeigt Typ und Stärke, Land und Entfernung, und die Stufe als
Abzeichen. Tippe auf eine Zeile, um die GDACS-Beschreibung des Ereignisses, seine Daten und den Link zu
seinem GDACS-Bericht zu sehen. Die Fußzeile nennt die Quelle und die Zeit der letzten Abfrage, mit einem
Link zu gdacs.org.

## Szenen-Auslöser

**GDACS: neues Ereignis in meinem Gebiet** löst aus, wenn ein Ereignis zum ersten Mal in das verfolgte
Gebiet eintritt: ein neues Erdbeben, ein näher kommender Wirbelsturm, eine rote Warnung irgendwo, falls
gewählt. Filter: Ereignistypen, Warnstufe.

**GDACS: Warnstufe erhöht** löst aus, wenn ein verfolgtes Ereignis von Grün auf Orange oder Rot wechselt,
oder von Orange auf Rot. Filter: Ereignistypen, neue Stufe.

Die Ereignisse, die beim allerersten Start der Integration oder bei einer Änderung ihrer Konfiguration
schon da sind, lösen nichts aus: Das sind keine Neuigkeiten. Was gesehen wurde, wird gespeichert, also löst
auch ein Neustart nichts aus. Höchstens 20 Ereignisse pro Aktualisierung.

Variablen beider Auslöser: `event_type` (`earthquake`, `tropical_cyclone`, `flood`, `volcano`,
`drought`, `wildfire`), `level` (`green`, `orange`, `red`), `event_type_name` und `level_name`
(ausgeschrieben), `name` (Typ und Stärke), `country`, `distance_km`, `summary` (eine Zeile, wie die
Funktion Neuestes Ereignis) und `url` (GDACS-Bericht). Der Stufen-Auslöser fügt `previous_level` und
`previous_level_name` hinzu.

## Szenen-Aktion

**GDACS: aktuelle Warnungen lesen** fragt GDACS erneut ab, wenn die letzte Abfrage älter als ein Intervall
ist, und gibt dann zurück:

- `text`: die Warnungen in einem Satz, z. B. `2 GDACS-Warnungen: Orange · Tropischer Wirbelsturm SIMON-26
250 km/h in México, 3.279 km entfernt; Grün · Erdbeben M4,5 in Panama, 182 km entfernt.` (höchstens 5
  Ereignisse, dann „und N weitere“);
- `count`: die Anzahl der Warnungen;
- `max_level`: `none`, `green`, `orange` oder `red`.

## Szenen-Beispiele

- **Nachricht, wenn ein großes Ereignis nahe ist**: Auslöser „GDACS: neues Ereignis in meinem Gebiet“,
  gefiltert auf Orange und Rot, Aktion „Nachricht senden“ mit `{{triggerEvent.data.summary}}` und
  `{{triggerEvent.data.url}}`.
- **Morgenüberblick**: jeden Tag um 7:30 „GDACS: aktuelle Warnungen lesen“, dann „Nachricht senden“ mit
  ihrem `text`, nur wenn `count` über 0 liegt.
- **Familie im Ausland**: Schalte „Rote Warnungen der ganzen Welt“ ein und sende bei jedem neuen roten
  Ereignis eine Nachricht: `Warnung {{triggerEvent.data.level_name}}: {{triggerEvent.data.name}},
{{triggerEvent.data.country}}`.
- **Eine Lampe im Flur**: Wenn „Höchste Warnstufe“ auf 2 oder mehr steigt, eine Lampe orange einschalten.

## Datenquellen, Bedingungen und Kontingente

- Daten © GDACS (Europäische Kommission JRC und ECHO, UN OCHA und UNOSAT), aus der öffentlichen
  Ereignis-API von GDACS gelesen, ohne Konto. Die Quelle wird im Widget genannt, wie es die
  Weiterverwendungsregeln der Europäischen Kommission verlangen.
- Die GDACS-Meldungen zu Erdbeben und Wirbelstürmen werden von Modellen automatisch erzeugt, ohne
  menschliche Prüfung: Diese Meldungen können falsch, verspätet oder unvollständig sein, und der Dienst kann ausfallen.
  Auch ersetzen sie nie die Warnungen der örtlichen oder nationalen Behörden, die allein die Bevölkerung warnen.
  Siehe die [Nutzungsbedingungen von GDACS](https://www.gdacs.org/About/termofuse.aspx).
- Kontingente: GDACS veröffentlicht keine. Die Integration fragt einmal pro Intervall ab (standardmäßig 15
  Minuten): eine Suche für Dürren und eine für die anderen Gefahren, 100 Ereignisse pro Seite, höchstens 10
  Seiten. Am 15.10.2026 brauchte ein Durchlauf 5 Anfragen auf der grünen Stufe (270 aktuelle Ereignisse,
  vor allem Waldbrände) und 2 auf der orangen Stufe.

## Fehlerbehebung

- **„Kein Mittelpunkt“ in der Konfiguration**: Gib deinem Haus in Gladys einen Standort (Einstellungen →
  Häuser) oder trage Koordinaten ein. Länder und weltweite rote Warnungen funktionieren auch ohne.
- **„GDACS antwortet nicht“**: Die Website ist ausgefallen oder vom Gladys-Rechner nicht erreichbar. Die
  letzten Werte bleiben; die Integration versucht es in jedem Intervall erneut und meldet es einmal in
  ihren Protokollen.
- **„GDACS listet zu viele Ereignisse“**: Mehr als 1.000 Ereignisse passen (vor allem Waldbrände auf der
  grünen Stufe). Erhöhe die Mindeststufe oder wähle Typen ab.
- **Kein Auslöser nach einer Änderung der Einstellungen**: erwartet, die schon vorhandenen Ereignisse sind
  keine Neuigkeit.
- **Die Namen der Funktionen sind in der falschen Sprache**: Diese werden beim Anlegen des Geräts festgelegt.
  Ändere die Sprache, lösche das Gerät und lege es dann im Tab „Entdecken“ neu an.
- Protokolle: Seite der Integration in Gladys, Tab „Logs“. `LOG_LEVEL=debug` fügt eine Zeile pro Abfrage
  hinzu.

## Grenzen

- Die Entfernung wird zu einem Punkt des Ereignisses gemessen, nicht zu seinem Umriss: Eine große Flut oder
  ein großer Brand kann dich erreichen, während sein Mittelpunkt außerhalb des Radius liegt. Nutze dafür die
  Einstellung Länder.
- GDACS deckt die großen Katastrophen mit möglichen internationalen Folgen ab, keine örtlichen Gefahren
  (Gewitter, örtliches Hochwasser, Hitzewellen): Dafür gibt es die offiziellen Warnungen deines Landes
  (zum Beispiel DWD, NINA).
- Länder- und Ereignisnamen kommen von GDACS, auf Englisch.
- Die Tsunami-Warnungen von GDACS gehören zu seinen Erdbeben-Ereignissen; sie werden nicht getrennt
  aufgeführt.
- Gegen den echten GDACS-Dienst entwickelt und getestet; Rückmeldungen zu echten Warnungen sind im Forum
  willkommen.
