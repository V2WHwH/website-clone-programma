import { useParams } from "react-router-dom";
import { vindArtikel } from "../content/nl/kennisbank";
import { PRODUCTEN } from "../content/nl/producten";
import { Reveal } from "../components/ui/Reveal";
import { Sectie } from "../components/ui/Sectie";
import { CtaSectie } from "../components/site/CtaSectie";
import { FaqLijst } from "../components/site/FaqLijst";
import { ProductKaart } from "../components/site/Kaarten";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { NietGevonden } from "./NietGevonden";

const datumTekst = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

export function ArtikelDetail() {
  const { slug } = useParams();
  const artikel = slug ? vindArtikel(slug) : undefined;
  if (!artikel) return <NietGevonden />;

  const producten = artikel.verwantProduct.map((s) => PRODUCTEN.find((p) => p.slug === s)).filter(Boolean);

  return (
    <>
      <article className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Kennisbank", pad: "/kennisbank" }, { naam: artikel.kop }]} />
        <div className="max-w-3xl pb-14 pt-10 md:pt-14">
          <p className="kicker mb-3">Kennisbank</p>
          <h1 className="text-3xl leading-[1.15] md:text-[2.75rem]">{artikel.kop}</h1>
          <p className="mt-4 text-[0.85rem] text-dof">
            Gepubliceerd {datumTekst(artikel.gepubliceerd)}
            {artikel.gewijzigd !== artikel.gepubliceerd && <> · bijgewerkt {datumTekst(artikel.gewijzigd)}</>}
          </p>

          {/* Het directe antwoord eerst: citeerbaar voor mens en machine */}
          <p className="mt-8 border-l-2 border-accent pl-5 text-lg leading-relaxed md:text-xl md:leading-relaxed">
            {artikel.antwoord}
          </p>

          {artikel.secties.map((s) => (
            <Reveal as="section" key={s.kop} className="mt-12">
              <h2 className="text-2xl">{s.kop}</h2>
              {s.alineas.map((al) => (
                <p key={al.slice(0, 40)} className="mt-4 leading-relaxed text-zacht">
                  {al}
                </p>
              ))}
            </Reveal>
          ))}

          {artikel.faq && artikel.faq.length > 0 && (
            <section className="mt-14">
              <h2 className="text-2xl">Veelgestelde vragen</h2>
              <div className="mt-6">
                <FaqLijst items={artikel.faq} />
              </div>
            </section>
          )}
        </div>
      </article>

      {producten.length > 0 && (
        <section className="border-t border-lijn bg-nacht/40">
          <Sectie kicker="Bijpassende oplossingen" kop="Verder kijken" className="!py-16 md:!py-20">
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {producten.map((p) => (
                <ProductKaart key={p!.slug} product={p!} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              ))}
            </div>
          </Sectie>
        </section>
      )}

      <CtaSectie />
    </>
  );
}
