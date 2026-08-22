import { Link } from "react-router-dom";
import { CATEGORIEEN } from "../content/nl/categorieen";
import { PRODUCTEN } from "../content/nl/producten";
import { PROJECTEN } from "../content/nl/projecten";
import { SECTOREN } from "../content/nl/sectoren";
import { SITE } from "../data/site";
import { Knop } from "../components/ui/Knop";
import { Reveal } from "../components/ui/Reveal";
import { Sectie } from "../components/ui/Sectie";
import { LogoBalk } from "../components/site/LogoBalk";
import { ProjectKaart } from "../components/site/Kaarten";
import { CtaSectie } from "../components/site/CtaSectie";
import { Hoofdstukken } from "../components/site/Hoofdstukken";
import { ProductKaart } from "../components/site/Kaarten";
import { Beeld } from "../components/ui/Beeld";

// De opening van de site. Geen kop met een plaatje ernaast, maar meteen een
// schermvullende opname van werk dat draait, met de productgroepen als balk
// erboven. Wie hier binnenkomt ziet in vijf seconden wát we maken en kan er
// direct heen; wie doorscrolt krijgt ze een voor een te zien.
const HOOFDSTUKKEN = [
  {
    tab: "Intro",
    kicker: "Vision2Watch · Den Haag",
    kop: "De kers op de taart",
    tekst:
      "Een interactieve vloer, wand, tafel of bar is het moment waar mensen over napraten. Wij bedenken de content, bouwen de techniek en installeren hem op locatie — zodat u niet met vier partijen hoeft te schakelen voor één effect.",
    beeld: "/media/video/dreamhack-interactieve-vloer-poster.webp",
    video: "/media/video/dreamhack-interactieve-vloer.mp4",
    alt: "Bezoekers spelen op een interactieve vloer van Vision2Watch op DreamHack in Rotterdam Ahoy",
    merken: ["eigen contentstudio", "eigen software", "installatie & service"],
    naar: { pad: "/producten", label: "Bekijk alle productgroepen" },
  },
  {
    tab: "Vloer",
    kicker: "Interactieve vloer",
    kop: "Een vloer waar mensen blijven staan",
    tekst:
      "Elke stap laat iets gebeuren: water dat rimpelt, bloemen die opzij gaan, een spel dat begint. In de winkelstraat van Designer Outlet Roermond loopt hij door tot na sluitingstijd.",
    beeld: "/media/video/outlet-roermond-vloer-poster.webp",
    video: "/media/video/outlet-roermond-vloer.mp4",
    alt: "Vloerprojectie in de winkelstraat van Designer Outlet Roermond bij avond",
    merken: ["te koop en te huur", "eigen iFloor-software", "mobiel of vast"],
    naar: { pad: "/producten/interactieve-vloer", label: "Bekijk de interactieve vloer" },
  },
  {
    tab: "Wand",
    kicker: "Interactieve muur",
    kop: "Een muur die terugkijkt",
    tekst:
      "Een blinde wand wordt beeld over de volle lengte, en reageert op wie ervoor langsloopt. Van een lounge tot een beursstand: het formaat bepaalt u, wij rekenen de projectoren aan elkaar.",
    beeld: "/media/video/muurprojectie-lounge-poster.webp",
    video: "/media/video/muurprojectie-lounge.mp4",
    alt: "Langgerekte muurprojectie in een lounge, opgenomen in het interieur",
    merken: ["reageert op beweging", "te koop en te huur", "content in uw huisstijl"],
    naar: { pad: "/producten/interactieve-muur", label: "Bekijk de interactieve muur" },
  },
  {
    tab: "Tafel & bar",
    kicker: "Interactieve tafel en bar",
    kop: "Een tafel waar het gesprek begint",
    tekst:
      "Bezoekers tikken op het tafelblad en de informatie verschijnt naast het product dat er echt op staat. Ideaal waar u iets uit te leggen heeft en niemand een folder wil lezen.",
    beeld: "/media/video/interactieve-bar-bloemen-poster.webp",
    video: "/media/video/interactieve-bar-bloemen.mp4",
    alt: "Bezoekers bedienen een projectietafel met informatie naast de planten die erop staan",
    merken: ["aanraking", "meerdere personen tegelijk", "eigen content"],
    naar: { pad: "/producten/interactieve-tafel", label: "Bekijk de interactieve tafel" },
  },
  {
    tab: "Hologram",
    kicker: "Holografie",
    kop: "Uw product levensgroot in de lucht",
    tekst:
      "Te groot, te kostbaar of nog niet gebouwd: als hologram staat het er toch. Op ware grootte, zwevend, zonder bril. Meerdere boxen naast elkaar vormen samen een hele wand.",
    beeld: "/media/video/hologramwand-showwindow-poster.webp",
    video: "/media/video/hologramwand-showwindow.mp4",
    alt: "Hologramwand van vier panelen waarin mensen levensgroot verschijnen",
    merken: ["geen bril nodig", "koppelbaar tot een wand", "met HEREweHOLO"],
    naar: { pad: "/producten/hereweholo", label: "Bekijk de holobox" },
  },
];

const UITGELICHT_PROJECT = ["werken-bij-defensie", "escher-museum", "clinique", "outlet-store-roermond"];

const WERKWIJZE = [
  { stap: "01", kop: "Concept & advies", tekst: "We beginnen bij uw doel, niet bij een apparaat. Samen bepalen we welke technologie uw verhaal het best vertelt." },
  { stap: "02", kop: "Content & studio", tekst: "Onze eigen studio ontwerpt de animaties, spellen en presentaties, volledig in uw huisstijl." },
  { stap: "03", kop: "Installatie & integratie", tekst: "Ons installatieteam bouwt op, stelt af en integreert de oplossing in uw ruimte of stand." },
  { stap: "04", kop: "Service & onderhoud", tekst: "Van preventief onderhoud tot een volledige SLA: we houden uw installatie draaiend." },
];

export function Home() {
  return (
    <>
      <Hoofdstukken hoofdstukken={HOOFDSTUKKEN} />

      <LogoBalk />

      {/* Alle productgroepen, hoog op de pagina. Wie hier komt met een
          concrete vraag ("hebben jullie ook een transparant scherm?") moet
          dat antwoord zien zonder eerst een verhaal door te lezen. */}
      <Sectie
        kicker="Wat we maken"
        kop="Zeventien productgroepen, uit één hand"
        lead="Van interactieve vloer tot hologramwand. Wij bedenken de content, leveren en installeren de techniek en houden hem draaiend — te koop en te huur."
      >
        {CATEGORIEEN.map((cat, ci) => {
          const groep = PRODUCTEN.filter((p) => p.categorie === cat.slug);
          return (
            <div key={cat.slug} id={cat.slug} className="mt-12 scroll-mt-24 first:mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-lijn pb-3">
                <h3 className="font-display text-xl">{cat.naam}</h3>
                <p className="max-w-xl text-[0.95rem] leading-relaxed text-zacht">{cat.omschrijving}</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groep.map((product, i) => (
                  <Reveal key={product.slug} vertraging={Math.min(i, 3) * 60 + ci * 20}>
                    <ProductKaart product={product} sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                  </Reveal>
                ))}
              </div>
            </div>
          );
        })}
        <Reveal className="mt-12">
          <Knop naar="/producten">Alles op een rij, met techniek en prijsindicatie</Knop>
        </Reveal>
      </Sectie>



      {/* Toepassingen */}
      <section className="border-t border-lijn bg-nacht/40">
        <Sectie
          kicker="Voor wie"
          kop="Van beursvloer tot museumzaal"
          lead="Elke omgeving vraagt een eigen aanpak. Bekijk per sector wat werkt, met echte projecten als bewijs."
          className="!py-20 md:!py-24"
        >
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SECTOREN.map((s, i) => (
              <Reveal as="li" key={s.slug} vertraging={i * 50}>
                <Link
                  to={`/toepassingen/${s.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-kaart border border-lijn bg-inkt px-5 py-4 transition-colors hover:border-accent/60"
                >
                  <span className="font-display text-[1.05rem] font-medium">{s.naam}</span>
                  <span aria-hidden="true" className="text-accent transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Sectie>
      </section>

      {/* Uitgelichte projecten */}
      <Sectie
        kicker="Ons werk"
        kop="Projecten die bezoekers zich herinneren"
        lead="Van een gamevloer voor Defensie op DreamHack tot een interactieve bar voor Clinique: dit is hoe onze technologie in de praktijk werkt."
      >
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UITGELICHT_PROJECT.map((slug, i) => {
            const p = PROJECTEN.find((x) => x.slug === slug);
            if (!p) return null;
            return (
              <Reveal key={slug} vertraging={i * 70}>
                <ProjectKaart project={p} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
              </Reveal>
            );
          })}
        </div>
        <Reveal className="mt-8">
          <Knop naar="/projecten" variant="secundair">Alle projecten</Knop>
        </Reveal>
      </Sectie>

      {/* Werkwijze */}
      <section className="border-t border-lijn">
        <Sectie
          kicker="Hoe we werken"
          kop="Eén partner, het hele traject"
          lead="Geen doorverwijzingen tussen leveranciers: advies, content, installatie en service komen bij Vision2Watch uit hetzelfde team."
        >
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {WERKWIJZE.map((w, i) => (
              <Reveal as="li" key={w.stap} vertraging={i * 70} className="border-t border-lijn pt-5">
                <p className="font-display text-[0.85rem] font-medium text-accent">{w.stap}</p>
                <h3 className="mt-2 font-display text-lg">{w.kop}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-zacht">{w.tekst}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-10">
            <Knop naar="/diensten" variant="secundair">Meer over onze diensten</Knop>
          </Reveal>
        </Sectie>
      </section>

      {/* Showroom */}
      <section className="border-t border-lijn bg-nacht/40">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">
          <Reveal>
            <p className="kicker mb-3">Showroom Den Haag</p>
            <h2 className="text-3xl md:text-[2.6rem] md:leading-[1.1]">
              Zien is geloven: ervaar het zelf in onze showroom
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-zacht">
              In onze showroom demonstreren we vrijwel alle oplossingen, inclusief een holografisch scherm van 9 meter breed. Plan een bezoek en ontdek wat werkt voor uw ruimte.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Knop naar="/contact">Plan een bezoek</Knop>
              <Knop naar={`tel:${SITE.telefoon.algemeen.tel}`} variant="secundair">Bel {SITE.telefoon.algemeen.label}</Knop>
            </div>
          </Reveal>
          <Reveal vertraging={100} className="overflow-hidden rounded-kaart border border-lijn">
            <Beeld
              src="/media/hologram-groep-podium.webp"
              alt="Levensgrote hologram-projectie van personen"
              className="h-full w-full object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </Reveal>
        </div>
      </section>

      <CtaSectie />
    </>
  );
}
