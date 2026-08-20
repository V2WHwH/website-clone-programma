import { SECTOREN } from "../content/nl/sectoren";
import { Reveal } from "../components/ui/Reveal";
import { SectorKaart } from "../components/site/Kaarten";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { CtaSectie } from "../components/site/CtaSectie";

export function Toepassingen() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Toepassingen" }]} />
        <div className="max-w-3xl pb-10 pt-10 md:pt-14">
          <p className="kicker mb-3">Toepassingen</p>
          <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">Wat werkt waar?</h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Elke omgeving heeft zijn eigen dynamiek: een beursbezoeker beslist in seconden, een museumbezoeker neemt de tijd. Bekijk per sector welke technologie werkt, onderbouwd met projecten die we er echt bouwden.
          </p>
        </div>
        <div className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {SECTOREN.map((s, i) => (
            <Reveal key={s.slug} vertraging={i * 60}>
              <SectorKaart sector={s} />
            </Reveal>
          ))}
        </div>
      </div>
      <CtaSectie
        kop="Staat uw sector er niet tussen?"
        tekst="De techniek is breder inzetbaar dan deze zes sectoren. Vertel ons uw situatie; wij denken mee over wat werkt."
      />
    </>
  );
}
