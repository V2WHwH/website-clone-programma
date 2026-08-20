import { CATEGORIEEN } from "../content/nl/categorieen";
import { PRODUCTEN } from "../content/nl/producten";
import { Reveal } from "../components/ui/Reveal";
import { ProductKaart } from "../components/site/Kaarten";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { CtaSectie } from "../components/site/CtaSectie";

export function Producten() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Producten" }]} />
        <div className="max-w-3xl pb-4 pt-10 md:pt-14">
          <p className="kicker mb-3">Producten</p>
          <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">
            Interactieve technologie, te koop en te huur
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Alle oplossingen leveren we compleet: hardware, eigen software, content in uw huisstijl, installatie en service. Kies een categorie of blader door het volledige aanbod.
          </p>
        </div>
        <nav aria-label="Categorieën" className="flex flex-wrap gap-2 pb-6 pt-2">
          {CATEGORIEEN.map((c) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              className="rounded-full border border-lijn px-4 py-2 text-[0.9rem] text-zacht transition-colors hover:border-accent hover:text-accent"
            >
              {c.naam}
            </a>
          ))}
        </nav>
      </div>

      {CATEGORIEEN.map((cat) => {
        const items = PRODUCTEN.filter((p) => p.categorie === cat.slug);
        return (
          <section key={cat.slug} id={cat.slug} className="scroll-mt-24 border-t border-lijn">
            <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
              <Reveal className="max-w-3xl">
                <h2 className="text-2xl font-medium md:text-3xl">{cat.naam}</h2>
                <p className="mt-3 leading-relaxed text-zacht">{cat.omschrijving}</p>
              </Reveal>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p, i) => (
                  <Reveal key={p.slug} vertraging={i * 50}>
                    <ProductKaart product={p} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <CtaSectie
        kop="Niet zeker welke oplossing past?"
        tekst="Vertel ons wat u wilt bereiken; wij adviseren welke technologie daarbij hoort. Of vraag de prijslijst aan voor het complete overzicht."
      />
    </>
  );
}
