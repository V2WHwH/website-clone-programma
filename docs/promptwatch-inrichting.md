# Promptwatch-inrichting Vision2Watch

Kant-en-klare configuratie om het Promptwatch-project mee te vullen. Alle
prompts komen uit de zoekintentie-tabel in `seo-strategy.md` en uit de
werkelijke productgroepen, sectoren en kennisbankartikelen van de site —
niets is erbij verzonnen.

---

## 0. Waarom dit een document is en niet al ingesteld staat

Het Vision2Watch-project is via de Promptwatch-koppeling in deze omgeving
niet zichtbaar: `listProjects` geeft alleen HEREweHOLO terug. Er is dus
geen project-id om tegen te schrijven, en een tweede project aanmaken zou
een duplicaat opleveren.

Waarschijnlijke oorzaken, in volgorde van kans:

1. Het project staat in een andere Promptwatch-werkruimte of organisatie
   dan waarvoor deze koppeling is geautoriseerd.
2. De koppeling is nog niet vernieuwd sinds het project is aangemaakt —
   opnieuw verbinden in de connectorinstellingen lost dat op.
3. De koppeling is toegangstechnisch beperkt tot het HEREweHOLO-project.

Zodra `listProjects` het project wel teruggeeft, is onderstaande in een
kwartier ingeladen.

---

## 1. Waarschuwing vooraf: wat Promptwatch straks crawlt

Promptwatch crawlt `vision2watch.nl`. Dat is **de huidige live site**, niet
de rebuild. De rebuild staat op een preview met een noindex-kop en is voor
crawlers afgeschermd.

Gevolg: site health, thin content en paginascores gaan over de oude site.
Dat is niet erg — het is juist een nulmeting — maar lees ze niet als een
oordeel over het nieuwe werk. Pas na livegang meet Promptwatch de rebuild.

De prompt- en citatiegegevens zijn wél meteen bruikbaar: die gaan over wat
AI-modellen antwoorden op vragen uit deze markt, ongeacht welke versie van
de site draait.

---

## 2. Merk

| Veld | Waarde |
|---|---|
| Naam | Vision2Watch |
| Website | https://www.vision2watch.nl |
| Taal | nl-NL |
| Land | NL |
| Schrijfwijzen om als variant mee te nemen | Vision2Watch, Vision 2 Watch, Vision2watch, V2W |

Voor de omschrijving: neem de tekst uit `public/llms.txt`. Die is al door
de eigenaar vastgesteld, noemt de KvK en het volledige aanbod, en voorkomt
dat er een tweede, afwijkende bedrijfsomschrijving ontstaat.

Let op de eigen productnamen die géén categorieterm zijn en dus apart
herkend moeten worden: **iFloor**, **Sketchwall**, **Virtual Chef**,
**Virtual Host**, **iWindow**. De strategie zet bewust in op de
categorietermen, maar de merknamen moeten wel als merk worden geteld.

---

## 3. Onderwerpen

Gebruik deze indeling om prompts te groeperen; het volgt de indeling van
de site, zodat een score direct naar een pagina te herleiden is.

```
interactieve-projectie      vloer, muur, tafel, sketchwall, virtual chef
hologram                    hologram-projectie, holografische molen, holobox
schermen                    touchscreens, transparant scherm, led-displays,
                            interactieve etalage
grootbeeldprojectie         gebouwprojectie, panoramisch/360, logo-animatie,
                            mixed reality
toepassing-beurs            beurzen en events
toepassing-retail           winkels en etalages
toepassing-cultuur          musea, attracties, dierentuinen
toepassing-horeca           restaurants en hotels
toepassing-onderwijs        scholen
toepassing-kantoor          showrooms en kantoren
koop-huur-prijs             prijzen, huren versus kopen, kosten
leverancierskeuze           wie levert dit, welke partij kies je
merk                        Vision2Watch zelf
```

---

## 4. Tracked prompts

Nederlandstalig, want de markt is Nederlandstalig. Geformuleerd zoals een
inkoper, marketeer of eventorganisator het werkelijk aan een AI vraagt —
dus als vraag, niet als zoekwoord.

### interactieve-projectie
1. Wat is een interactieve vloer en hoe werkt het?
2. Interactieve vloer huren voor een evenement, wat kost dat?
3. Interactieve vloer kopen of huren, wat is verstandiger?
4. Welke leveranciers van interactieve vloeren zijn er in Nederland?
5. Interactieve vloerprojectie voor een kinderafdeling, wat zijn de opties?
6. Wat is een interactieve muur en waar wordt die voor gebruikt?
7. Interactieve tafel of touchtafel voor een showroom, wat is er mogelijk?
8. Wat is een Sketchwall en hoe werkt een interactieve tekenwand?
9. Interactieve bar voor een event, bestaat dat?
10. Wat is Virtual Chef en hoe werkt tafelprojectie in een restaurant?

### hologram
11. Wat is hologramprojectie en hoe werkt het?
12. Hoe werkt Pepper's ghost en wordt dat nog gebruikt?
13. Hologram huren voor een productpresentatie, welke aanbieders zijn er?
14. Wat is een holografische molen of 3D-hologramventilator?
15. Wat is een holobox en waarvoor gebruik je die?
16. Hologram op een beurs inzetten, wat kost dat ongeveer?

### schermen
17. Transparant LCD-scherm voor een productvitrine, wie levert dat?
18. Touchscreen informatiezuil kopen voor een ontvangstruimte, waar let je op?
19. LED-videowall binnen of buiten, wat is het verschil?
20. Wat is een interactieve etalage en hoe werkt touch foil op glas?
21. Digitale etalage voor een winkel, wat zijn de mogelijkheden?

### grootbeeldprojectie
22. Wat is projection mapping op een gebouw en wat kost het?
23. Gebouwprojectie voor een opening of jubileum, hoe pak je dat aan?
24. Wat is 360 graden projectie of een immersive room?
25. Panoramische projectie voor een museumzaal, wat is daarvoor nodig?
26. Logo projecteren op een gevel of vloer, hoe doe je dat?
27. Augmented reality op een groot scherm voor marketing, wat kan er?

### toepassing-beurs
28. Hoe val ik op met mijn beursstand tussen alle andere standhouders?
29. Interactieve beursstand, welke technologie werkt echt?
30. Blikvanger huren voor een vakbeurs, wat zijn de opties?
31. Wat trekt bezoekers naar een beursstand?

### toepassing-retail
32. Winkelbeleving verbeteren met technologie, wat werkt in retail?
33. Interactieve etalage voor een winkelstraat, is dat rendabel?

### toepassing-cultuur
34. Interactieve installatie voor een museum, welke mogelijkheden zijn er?
35. Beleving toevoegen aan een dierentuin of attractiepark, hoe doe je dat?

### toepassing-horeca
36. Interactieve projectie in een restaurant of hotel, wat kan er?
37. Tafelprojectie voor een diner, hoe werkt dat?

### toepassing-onderwijs
38. Interactieve vloer voor een school, wat levert het op?
39. Bewegend leren op school met technologie, wat is er beschikbaar?

### toepassing-kantoor
40. Interactieve showroom inrichten, welke technologie past daarbij?
41. Ontvangstruimte van een kantoor opvallender maken, wat zijn de opties?

### koop-huur-prijs
42. Wat kost een interactieve vloer?
43. Wat kost hologramprojectie voor een evenement?
44. Audiovisuele installatie huren of kopen, hoe reken je dat door?
45. Prijsindicatie interactieve technologie voor een beurs, waar begin je?

### leverancierskeuze
46. Welk bedrijf levert interactieve audiovisuele oplossingen in Nederland?
47. AV-specialist in Den Haag of omgeving, wie zijn dat?
48. Wie maakt interactieve installaties inclusief content en installatie?
49. Waar let je op bij het kiezen van een leverancier voor interactieve
    projectie?
50. Welke partij levert zowel de hardware als de content en de installatie?

### merk
51. Wat doet Vision2Watch?
52. Vision2Watch ervaringen en projecten, wat hebben ze gedaan?

---

## 5. Persona's

Drie kopersrollen, elk met een andere vraag. Ze bepalen hoe een model de
prompt interpreteert.

| Persona | Rol | Waar het om draait |
|---|---|---|
| Marketeer of merkmanager | Wil opvallen op een beurs of in de winkelstraat | Effect, beleving, wat blijft hangen |
| Facilitair of technisch inkoper | Koopt voor een pand, showroom of school | Specificaties, installatie, onderhoud, garantie |
| Eventorganisator of standbouwer | Werkt per project, korte doorlooptijd | Huur, levertijd, opbouw, wat er ter plekke nodig is |

---

## 6. Paginatrackers

Zet trackers op de pagina's die het geld verdienen, zodat je per pagina
ziet of hij geciteerd wordt:

```
/
/producten/interactieve-vloer
/producten/hologram-projectie
/producten/interactieve-etalage
/producten/touchscreens
/toepassingen/beurzen-en-events
/toepassingen/retail
/diensten
/prijslijst
/kennisbank/wat-is-een-interactieve-vloer
/kennisbank/interactieve-vloer-kopen-of-huren
/kennisbank/opvallen-op-een-beurs
```

De drie kennisbankartikelen staan er bewust bij: die zijn geschreven met
een citeerbaar antwoordblok bovenaan, dus daar is het effect van die
schrijfwijze het beste te meten.

---

## 7. Monitors

Eén Nederlandse monitor is genoeg om te beginnen. Voeg pas een tweede
markt toe als de site daadwerkelijk een tweede taal krijgt — de
architectuur is erop voorbereid, maar er staat nog geen vertaalde content.

Neem in de modellenmix zowel zoekgebonden als gesloten modellen mee. Dat
onderscheid deed er bij HEREweHOLO toe: zoekgebonden modellen belonen wat
er op je eigen site staat, gesloten modellen citeren vooral wat elders
over je geschreven is. Zonder dat onderscheid trek je verkeerde conclusies
uit een lage score.

---

## 8. Wat ik van jou nodig heb

**Concurrenten.** Nergens in het project staat een vastgelegde
concurrentielijst, en die verzin ik niet. Voor een zinnige
concurrentievergelijking heb ik van jou drie tot zes namen nodig van
partijen waar je in offertetrajecten tegenaan loopt. Let op: dat zijn
waarschijnlijk andere partijen per productgroep — wie je tegenkomt bij een
interactieve vloer is niet wie je tegenkomt bij een LED-gevel.

**Toegang.** Zie punt 0: zolang `listProjects` het project niet teruggeeft,
kan ik niets instellen.

---

## 9. Volgorde van inrichten

1. Merk plus schrijfwijzen.
2. Onderwerpen aanmaken (§3).
3. Prompts inladen en aan onderwerpen koppelen (§4).
4. Concurrenten toevoegen zodra de namen er zijn.
5. Persona's (§5).
6. Paginatrackers (§6).
7. Eerste crawl draaien en de uitkomst noteren als nulmeting — mét de
   aantekening dat die over de oude site gaat.
8. Na livegang van de rebuild opnieuw crawlen en de twee naast elkaar
   leggen.

De koppelingen die bij HEREweHOLO nog openstaan — Search Console,
bezoekerslogs, crawlerlogs — zijn hier vanaf het begin de moeite waard.
Zonder die drie zie je wel wat modellen antwoorden, maar niet of er iemand
doorklikt.
