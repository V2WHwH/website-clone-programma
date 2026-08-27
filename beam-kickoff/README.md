# HEREweHOLO Beam — Claude Code kickoff

Deze map is de start van het project. Zet hem in een lege git-repo en start Claude Code in de
root.

## Inhoud

```
CLAUDE.md                              projectgrondwet, wordt elke sessie gelezen
MILESTONES.md                          negen slices met poorten ertussen
README.md                              dit bestand

docs/
  00-REFERENCE.md                      wat het referentiemateriaal wél en niet toont
  01-BUILD-SPEC.md                     ← ZELF TOEVOEGEN: jouw 75-secties specificatie
  ACCEPTANCE.md                        het enige scenario dat bepaalt of het af is

prompts/
  00-bootstrap.md                      M0 — onderzoek en ontwerp, geen code
  01-slice-camera-to-glass.md          M1 — eerste verticale slice
```

## Voor je begint

1. Zet je build-spec in `docs/01-BUILD-SPEC.md`. `CLAUDE.md` verwijst ernaar; zonder dat bestand
   mist Claude Code de helft van de context.
2. Corrigeer §22 in die spec: het referentiemateriaal toont AR-gezichtslenzen, geen
   stemvervorming. Zie `docs/00-REFERENCE.md` §5.
3. Overweeg de productnaam. "Beam" is de naam van het referentieproduct. Voor de repo prima,
   voor commercieel materiaal een merkrisico.
4. `git init && git add . && git commit -m "chore: project bootstrap"`

## Werkwijze

Eén prompt per milestone. Niet de hele spec in één keer — dat is de snelste route naar een
codebase die er af uitziet en niets doet.

```
sessie 1   →  prompts/00-bootstrap.md      →  ADR's + ontwerpdocumenten  →  jij keurt goed
sessie 2   →  prompts/01-slice-...md       →  werkende stream            →  jij verifieert de poort
sessie 3+  →  schrijf de volgende prompt op basis van MILESTONES.md
```

De prompts voor M2 t/m M8 schrijf je zelf, in hetzelfde patroon: doel, expliciete
scope-uitsluitingen, wat te bouwen, wat te meten, welke faalgevallen nu al af moeten, en de
poortconditie. Dat patroon is belangrijker dan de exacte tekst.

## Wat je zelf moet blijven doen

De poorten. Claude Code stopt bij elke poort en vraagt om goedkeuring — dat staat in `CLAUDE.md`
als harde regel. Die goedkeuring is geen formaliteit: bij M1 en M6 moet je zelf naar de
diagnostische resolutieketen kijken, en bij M5 zelf de stekker eruit trekken. Dat zijn precies de
punten waarop een systeem er werkend uitziet zonder het te zijn.

En de ADR's in M0. Dat is het enige moment waarop de zware technische keuzes nog goedkoop zijn.
