import { useParams } from "react-router-dom";
import { vindSector } from "../content/nl/sectoren";
import { PRODUCTEN } from "../content/nl/producten";
import { PROJECTEN } from "../content/nl/projecten";
import { Beeld } from "../components/ui/Beeld";
import { Reveal } from "../components/ui/Reveal";
import { Sectie } from "../components/ui/Sectie";
import { CtaSectie } from "../components/site/CtaSectie";
import { FaqLijst } from "../components/site/FaqLijst";
import { ProductKaart, ProjectKaart } from "../components/site/Kaarten";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { NietGevonden } from "./NietGevonden";

export function SectorDetail() {
  const { slug } = useParams();
  const sector = slug ? vindSector(slug as never) : undefined;
  if (!sector) return <NietGevonden />;

  const producten = sector.producten.map((s) => PRODUCTEN.find((p) => p.slug === s)).filter(Boolean);
  const projecten = sector.projecten.map((s) => PROJECTEN.find((p) => p.slug === s)).filter(Boolean);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Toepassingen", pad: "/toepassingen" }, { naam: sector.naam }]} />
        <div className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
          <div>
            <p className="kicker mb-3">{sector.naam}</p>
            <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">{sector.naam}</h1>
            <p className="mt-5 text-lg leading-relaxed text-zacht">{sector.intro}</p>
          </div>
          <Reveal vertraging={80} className="overflow-hidden rounded-kaart border border-lijn">
            <Beeld src={sector.beeld.src} alt={sector.beeld.alt} prioriteit className="aspect-[16/10] w-full object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </Reveal>
        </div>
      </div>

      <section className="border-t border-lijn bg-nacht/40">
        <Sectie kicker="Situaties" kop={`Zo zetten we technologie in voor ${sector.naam.toLowerCase()}`}>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {sector.situaties.map((s, i) => (
              <Reveal key={s.kop} vertraging={i * 60} className="border-t border-lijn pt-5">
                <h3 className="font-display text-lg font-medium">{s.kop}</h3>
                <p className="mt-2 leading-relaxed text-zacht">{s.tekst}</p>
              </Reveal>
            ))}
          </div>
        </Sectie>
      </section>

      {projecten.length > 0 && (
        <Sectie kicker="Bewijs" kop={`Projecten in ${sector.naam.toLowerCase()}`}>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projecten.map((p, i) => (
              <Reveal key={p!.slug} vertraging={i * 50}>
                <ProjectKaart project={p!} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              </Reveal>
            ))}
          </div>
        </Sectie>
      )}

      <section className="border-t border-lijn bg-nacht/40">
        <Sectie kicker="Passende producten" kop={`Veelgekozen voor ${sector.naam.toLowerCase()}`} className="!py-16 md:!py-20">
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {producten.slice(0, 6).map((p) => (
              <ProductKaart key={p!.slug} product={p!} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
            ))}
          </div>
        </Sectie>
      </section>

      {sector.faq.length > 0 && (
        <Sectie kicker="Veelgestelde vragen" kop={`Vragen uit ${sector.naam.toLowerCase()}`}>
          <div className="mt-10 max-w-3xl">
            <FaqLijst items={sector.faq} />
          </div>
        </Sectie>
      )}

      <CtaSectie
        kop={`Een project in ${sector.naam.toLowerCase()}?`}
        tekst="Bespreek uw locatie of event met ons team; we adviseren wat werkt en wat het kost."
      />
    </>
  );
}
