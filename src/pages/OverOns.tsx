import { SITE, TEAM } from "../data/site";
import { Beeld } from "../components/ui/Beeld";
import { Knop } from "../components/ui/Knop";
import { Reveal } from "../components/ui/Reveal";
import { Sectie } from "../components/ui/Sectie";
import { CtaSectie } from "../components/site/CtaSectie";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { LogoBalk } from "../components/site/LogoBalk";

const PIJLERS = [
  {
    kop: "Eigen software",
    tekst: "We ontwikkelen onze interactieve software zelf. Content aanpassen aan een huisstijl of campagne doen we daardoor in eigen huis, zonder tussenkomst van een externe leverancier.",
  },
  {
    kop: "Eigen studio",
    tekst: "Animatoren, programmeurs en ontwerpers maken hier de content die onze systemen tonen, van vloerspel tot holografische productie.",
  },
  {
    kop: "Eigen installatieteam",
    tekst: "Wij bouwen zelf op, stellen af en onderhouden, van eenmalige beursopstelling tot permanente installaties die al jaren draaien.",
  },
];

export function OverOns() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Over ons" }]} />
        <div className="max-w-3xl pb-10 pt-10 md:pt-14">
          <p className="kicker mb-3">Over ons</p>
          <h1 className="text-4xl leading-[1.1] md:text-5xl">
            Wij laten ruimtes reageren op mensen
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Vision2Watch is gespecialiseerd in denken buiten de gebaande paden. Door kennis van marketing, audio en visuals te combineren zetten we interactieve projectie, holografie en mixed reality om in oplossingen die klanten telkens weer verbazen: inspirerende ideeën, kwalitatief hoogstaand werk en volledige toewijding.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 pb-4 md:px-8">
        <Reveal className="overflow-hidden rounded-kaart border border-lijn">
          <Beeld
            src="/media/euroveiling-bloemenvloer.webp"
            alt="Interactieve bloemenvloer van Vision2Watch tijdens het jubileum van Euroveiling"
            prioriteit
            className="max-h-[30rem] w-full object-cover"
            sizes="(min-width: 1152px) 1104px, 100vw"
          />
        </Reveal>
      </div>

      <Sectie kicker="Waarom Vision2Watch" kop="Alles onder één dak, letterlijk">
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {PIJLERS.map((p, i) => (
            <Reveal key={p.kop} vertraging={i * 70} className="border-t border-lijn pt-5">
              <h3 className="font-display text-lg">{p.kop}</h3>
              <p className="mt-2 leading-relaxed text-zacht">{p.tekst}</p>
            </Reveal>
          ))}
        </div>
      </Sectie>

      <section className="border-t border-lijn bg-nacht/40">
        <Sectie kicker="Team" kop="De mensen achter het werk" lead="Een compact team van specialisten: van concept en planning tot animatie, techniek en installatie.">
          <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {TEAM.map((lid, i) => (
              <Reveal as="li" key={lid.naam} vertraging={i * 40} className="border-t border-lijn pt-4">
                <p className="font-display text-[1.05rem] font-medium">{lid.naam}</p>
                <p className="mt-1 text-[0.9rem] text-zacht">{lid.rol}</p>
              </Reveal>
            ))}
          </ul>
        </Sectie>
      </section>

      {/* Partners en zusterbedrijf */}
      <Sectie kicker="Netwerk" kop="Partners en zusterbedrijf">
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <Reveal className="rounded-kaart border border-lijn bg-nacht p-7">
            <h3 className="font-display text-xl">HEREweHOLO</h3>
            <p className="mt-3 leading-relaxed text-zacht">
              Ons zusterbedrijf HEREweHOLO is volledig gespecialiseerd in holografische oplossingen: holoboxen, HEREweHOLO mini's en hologramwanden. Beide teams werken nauw samen; holografische projecten lopen vaak gezamenlijk.
            </p>
            <div className="mt-5">
              <Knop naar="https://www.hereweholo.nl" variant="secundair">Naar hereweholo.nl</Knop>
            </div>
          </Reveal>
          <Reveal vertraging={80} className="rounded-kaart border border-lijn bg-nacht p-7">
            <h3 className="font-display text-xl">Epson</h3>
            <p className="mt-3 leading-relaxed text-zacht">
              Met Epson ontwikkelden we de mobiele interactieve vloer en de Virtual Product Presenter, en namen we deel aan het Store of the Future-programma. Projectietechniek van topniveau, gecombineerd met onze interactieve software.
            </p>
          </Reveal>
        </div>
      </Sectie>

      <LogoBalk />

      {/* Showroom */}
      <Sectie kicker="Showroom" kop="Kom kijken in Den Haag" lead={`Vrijwel al onze oplossingen staan opgesteld in de showroom aan de ${SITE.adres.straat} in ${SITE.adres.plaats}, inclusief het holografische scherm van 9 meter breed.`}>
        <Reveal className="mt-8 flex flex-wrap gap-3">
          <Knop naar="/contact">Plan een bezoek</Knop>
          <Knop naar="/projecten" variant="secundair">Bekijk eerst ons werk</Knop>
        </Reveal>
      </Sectie>

      <CtaSectie />
    </>
  );
}
