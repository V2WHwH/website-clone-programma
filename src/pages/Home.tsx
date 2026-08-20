import { Link } from "react-router-dom";
import { CATEGORIEEN } from "../content/nl/categorieen";
import { PRODUCTEN } from "../content/nl/producten";
import { PROJECTEN } from "../content/nl/projecten";
import { SECTOREN } from "../content/nl/sectoren";
import { SITE } from "../data/site";
import { Knop } from "../components/ui/Knop";
import { Reveal } from "../components/ui/Reveal";
import { Sectie } from "../components/ui/Sectie";
import { HeroVideo } from "../components/site/HeroVideo";
import { LogoBalk } from "../components/site/LogoBalk";
import { ProjectKaart } from "../components/site/Kaarten";
import { CtaSectie } from "../components/site/CtaSectie";
import { Beeld } from "../components/ui/Beeld";

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
      {/* Hero: video van een echt project, boodschap in enkele seconden helder */}
      <section className="relative min-h-[82svh] overflow-hidden">
        <div className="absolute inset-0">
          <HeroVideo
            src="/media/video/dreamhack-interactieve-vloer.mp4"
            poster="/media/video/dreamhack-interactieve-vloer-poster.webp"
            label="Interactieve vloer van Vision2Watch in actie op DreamHack, Rotterdam Ahoy"
            className="h-full"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-inkt via-inkt/55 to-inkt/25" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[82svh] w-full max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-24">
          <h1 className="max-w-3xl text-4xl font-medium leading-[1.08] md:text-6xl">
            Wij maken ruimtes die <span className="text-accent">reageren</span> op mensen
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-tekst/90 md:text-xl">
            Vision2Watch levert en bouwt interactieve audiovisuele oplossingen: hologrammen, interactieve vloeren en etalages, projectie en LED. Van concept en content tot installatie en service, te koop en te huur.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Knop naar="/producten">Ontdek de mogelijkheden</Knop>
            <Knop naar="/projecten" variant="secundair">Bekijk projecten</Knop>
          </div>
        </div>
      </section>

      <LogoBalk />

      {/* Wat we doen: vier productclusters */}
      <Sectie
        kicker="Wat we doen"
        kop="Technologie, experience, content en integratie uit één hand"
        lead="We combineren kennis van marketing, audio en visuals tot oplossingen die opvallen én werken. Met eigen interactieve software, een eigen contentstudio en een team dat installeert en onderhoudt."
      >
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {CATEGORIEEN.map((cat, i) => {
            const eerste = PRODUCTEN.find((p) => p.categorie === cat.slug);
            return (
              <Reveal key={cat.slug} vertraging={i * 70}>
                <Link
                  to={`/producten#${cat.slug}`}
                  className="kaart group flex h-full flex-col overflow-hidden rounded-kaart border border-lijn bg-nacht transition-colors hover:border-accent/60"
                >
                  {eerste && (
                    <div className="kaart-beeld aspect-[16/8] overflow-hidden">
                      <Beeld src={eerste.beeld.src} alt={eerste.beeld.alt} className="h-full w-full object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-medium">{cat.naam}</h3>
                    <p className="mt-2 flex-1 leading-relaxed text-zacht">{cat.omschrijving}</p>
                    <p className="mt-4 font-display text-[0.9rem] font-medium text-accent">
                      Bekijk producten <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
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
                <h3 className="mt-2 font-display text-lg font-medium">{w.kop}</h3>
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
            <h2 className="text-3xl font-medium md:text-[2.6rem] md:leading-[1.1]">
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
