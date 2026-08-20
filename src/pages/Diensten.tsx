import { Reveal } from "../components/ui/Reveal";
import { Sectie } from "../components/ui/Sectie";
import { Beeld } from "../components/ui/Beeld";
import { Knop } from "../components/ui/Knop";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { CtaSectie } from "../components/site/CtaSectie";
import { FaqLijst } from "../components/site/FaqLijst";

const FASEN = [
  {
    nummer: "01",
    kop: "Concept & advies",
    tekst:
      "Elk project begint met uw doelstellingen, niet met een apparaat. We denken mee over wat u wilt bereiken, bij welke bezoekers, op welke plek, en selecteren samen de technologie die daarin voorziet. In onze showroom in Den Haag demonstreren we vrijwel alle oplossingen, zodat u kiest op basis van wat u zelf heeft ervaren.",
  },
  {
    nummer: "02",
    kop: "Content & studio",
    tekst:
      "Techniek zonder goede content is een leeg scherm. Onze eigen studio ontwerpt de animaties, spellen en presentaties die uw systemen tonen: volledig in uw huisstijl, afgestemd op uw campagne en later eenvoudig te vernieuwen. Doordat Vision2Watch met zelfontwikkelde software werkt, passen we content snel aan, ook vlak voor een deadline.",
  },
  {
    nummer: "03",
    kop: "Installatie & integratie",
    tekst:
      "Ons installatieteam zorgt dat elke oplossing op de juiste manier wordt geïnstalleerd en afgesteld: projectoren onzichtbaar weggewerkt, camera's gekalibreerd op het omgevingslicht, alles getest vóór de opening of beursdag. Ook combinaties van technologieën, van vloer tot etalage tot LED, integreren we tot één werkend geheel.",
  },
  {
    nummer: "04",
    kop: "Service & onderhoud",
    tekst:
      "Na oplevering blijven we beschikbaar. Vision2Watch biedt diverse services, variërend van preventief onderhoud tot een complete Service Level Agreement (SLA). Vaste installaties zoals die bij Ouwehands Dierenpark houden we al jaren draaiend, inclusief periodieke updates van content en projectoren.",
  },
];

const HUUR_KOOP = [
  {
    kop: "Huren per event",
    tekst:
      "Voor beurzen, lanceringen en tijdelijke campagnes: wij leveren, bouwen op, stellen af en breken af. Inclusief content passend bij uw event.",
  },
  {
    kop: "Kopen voor vast gebruik",
    tekst:
      "Bij aankoop zet u het systeem onbeperkt opnieuw in, zonder extra kosten, met telkens nieuwe content. Voor permanente opstellingen adviseren we een onderhoudsafspraak.",
  },
  {
    kop: "Maatwerk & combinaties",
    tekst:
      "Van AR-ontwikkeling op onze eigen Augmented engine tot complete belevingsruimtes: we bouwen ook wat er nog niet is.",
  },
];

const FAQ = [
  {
    vraag: "Werken jullie ook voor bureaus en standbouwers?",
    antwoord:
      "Ja, veel projecten lopen via event- en marketingbureaus, zoals de interactieve vloer voor Euroveiling namens Jada Events en de interactieve bar voor Clinique in opdracht van Bolt Amsterdam. We werken onder uw regie of rechtstreeks met de eindklant.",
  },
  {
    vraag: "Wat kost een project?",
    antwoord:
      "Dat hangt af van techniek, formaat, content en huur of koop. Vraag de prijslijst aan voor het actuele overzicht; voor maatwerk maken we een offerte op basis van uw situatie.",
  },
  {
    vraag: "Hoe snel kan een project live?",
    antwoord:
      "Verhuur met bestaande content kan snel; maatwerkcontent en vaste installaties vragen productietijd. Neem contact op met uw datum en we plannen er concreet naartoe.",
  },
];

export function Diensten() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Diensten" }]} />
        <div className="max-w-3xl pb-10 pt-10 md:pt-14">
          <p className="kicker mb-3">Diensten</p>
          <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">
            Van eerste idee tot draaiende installatie
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Vision2Watch is geen doorgeefluik van hardware. We adviseren, ontwerpen content in eigen huis, installeren op locatie en blijven verantwoordelijk voor service en onderhoud. Eén partner, één aanspreekpunt, het hele traject.
          </p>
        </div>
      </div>

      <section className="border-t border-lijn">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <ol>
            {FASEN.map((f, i) => (
              <Reveal as="li" key={f.nummer} className={`grid gap-6 py-12 md:grid-cols-[8rem_1fr] md:gap-12 ${i > 0 ? "border-t border-lijn" : ""}`}>
                <p className="font-display text-4xl font-medium text-accent md:text-5xl">{f.nummer}</p>
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-medium md:text-3xl">{f.kop}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-zacht">{f.tekst}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-lijn bg-nacht/40">
        <Sectie kicker="Flexibel" kop="Huren, kopen of maatwerk">
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {HUUR_KOOP.map((h, i) => (
              <Reveal key={h.kop} vertraging={i * 70} className="border-t border-lijn pt-5">
                <h3 className="font-display text-lg font-medium">{h.kop}</h3>
                <p className="mt-2 leading-relaxed text-zacht">{h.tekst}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10">
            <Knop naar="/prijslijst">Prijslijst aanvragen</Knop>
          </Reveal>
        </Sectie>
      </section>

      <Sectie kicker="Eigen studio" kop="Content wordt hier gemaakt, niet uitbesteed">
        <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
          <Reveal className="overflow-hidden rounded-kaart border border-lijn">
            <Beeld src="/media/studio-content-werkplek.webp" alt="Animator werkt aan interactieve content in de studio van Vision2Watch" className="aspect-[4/3] w-full object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </Reveal>
          <Reveal vertraging={80}>
            <p className="text-lg leading-relaxed text-zacht">
              Animaties, spellen, virtuele presentatoren en panoramische producties ontstaan in onze eigen studio. Dat betekent korte lijnen, snelle aanpassingen en content die exact aansluit op de techniek waarop hij draait. Ook de interactieve software erachter ontwikkelen we zelf.
            </p>
            <div className="mt-8">
              <Knop naar="/projecten" variant="secundair">Bekijk het resultaat</Knop>
            </div>
          </Reveal>
        </div>
      </Sectie>

      <section className="border-t border-lijn">
        <Sectie kicker="Veelgestelde vragen" kop="Praktische vragen">
          <div className="mt-10 max-w-3xl">
            <FaqLijst items={FAQ} />
          </div>
        </Sectie>
      </section>

      <CtaSectie />
    </>
  );
}
