import { Link, useParams } from "react-router-dom";
import { PRODUCTEN, vindProduct } from "../content/nl/producten";
import { PROJECTEN } from "../content/nl/projecten";
import { ARTIKELEN } from "../content/nl/kennisbank";
import { Beeld } from "../components/ui/Beeld";
import { Knop } from "../components/ui/Knop";
import { Reveal } from "../components/ui/Reveal";
import { Sectie } from "../components/ui/Sectie";
import { CtaSectie } from "../components/site/CtaSectie";
import { FaqLijst } from "../components/site/FaqLijst";
import { HeroVideo } from "../components/site/HeroVideo";
import { ProductKaart, ProjectKaart } from "../components/site/Kaarten";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { NietGevonden } from "./NietGevonden";

export function ProductDetail() {
  const { slug } = useParams();
  const product = slug ? vindProduct(slug) : undefined;
  if (!product) return <NietGevonden />;

  const projecten = product.projecten.map((s) => PROJECTEN.find((p) => p.slug === s)).filter(Boolean);
  const verwant = product.verwant.map((s) => PRODUCTEN.find((p) => p.slug === s)).filter(Boolean);

  return (
    <>
      {/* Hero */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Producten", pad: "/producten" }, { naam: product.naam }]} />
        <div className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
          <div>
            <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">{product.naam}</h1>
            <p className="mt-5 text-lg leading-relaxed text-zacht">{product.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Knop naar="/prijslijst">Prijslijst aanvragen</Knop>
              <Knop naar="/contact" variant="secundair">Demonstratie aanvragen</Knop>
            </div>
          </div>
          <Reveal vertraging={80} className="overflow-hidden rounded-kaart border border-lijn">
            <Beeld src={product.beeld.src} alt={product.beeld.alt} prioriteit className="aspect-[4/3] w-full object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </Reveal>
        </div>
      </div>

      {/* Waarom / probleem */}
      <section className="border-t border-lijn bg-nacht/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <Reveal className="max-w-3xl">
            <p className="kicker mb-3">Waarom {product.kaartLabel?.toLowerCase() ?? product.naam.toLowerCase()}</p>
            <p className="text-xl leading-relaxed md:text-2xl md:leading-relaxed">{product.waarom}</p>
          </Reveal>
        </div>
      </section>

      {/* Video */}
      {product.video && (
        <div className="mx-auto w-full max-w-6xl px-5 pt-14 md:px-8">
          <Reveal className="overflow-hidden rounded-kaart border border-lijn">
            <HeroVideo src={product.video.src} poster={product.video.poster} label={product.video.label} className="aspect-video" />
          </Reveal>
          <p className="mt-3 text-[0.85rem] text-dof">{product.video.label}</p>
        </div>
      )}

      {/* Voordelen */}
      <Sectie kicker="Voordelen" kop={`Dit maakt de ${(product.kaartLabel ?? product.naam).toLowerCase()} sterk`}>
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {product.voordelen.map((v, i) => (
            <Reveal key={v.kop} vertraging={i * 60} className="border-t border-lijn pt-5">
              <h3 className="font-display text-lg font-medium">{v.kop}</h3>
              <p className="mt-2 leading-relaxed text-zacht">{v.tekst}</p>
            </Reveal>
          ))}
        </div>
      </Sectie>

      {/* Toepassingen + technisch */}
      <section className="border-t border-lijn bg-nacht/40">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1fr_1.4fr] md:px-8 md:py-24">
          <Reveal>
            <h2 className="text-2xl font-medium md:text-3xl">Toepassingen</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {product.toepassingen.map((t) => (
                <li key={t} className="rounded-full border border-lijn px-4 py-2 text-[0.9rem] text-zacht">{t}</li>
              ))}
            </ul>
            <div className="mt-8">
              <Knop naar="/toepassingen" variant="secundair">Bekijk toepassingen per sector</Knop>
            </div>
          </Reveal>
          <Reveal vertraging={80}>
            <h2 className="text-2xl font-medium md:text-3xl">Techniek & integratie</h2>
            <dl className="mt-6 divide-y divide-lijn border-y border-lijn">
              {product.technisch.map((t) => (
                <div key={t.kop} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="font-display text-[0.95rem] font-medium text-tekst">{t.kop}</dt>
                  <dd className="text-[0.95rem] leading-relaxed text-zacht">{t.tekst}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 leading-relaxed text-zacht">{product.levering}</p>
          </Reveal>
        </div>
      </section>

      {/* Galerij */}
      {product.galerij && product.galerij.length > 0 && (
        <Sectie kicker="In de praktijk" kop="Zo ziet het eruit">
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.galerij.map((b, i) => (
              <Reveal key={b.src} vertraging={i * 60} className="overflow-hidden rounded-kaart border border-lijn">
                <Beeld src={b.src} alt={b.alt} className="aspect-[4/3] w-full object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              </Reveal>
            ))}
          </div>
        </Sectie>
      )}

      {/* Projecten */}
      {projecten.length > 0 && (
        <section className="border-t border-lijn">
          <Sectie kicker="Bewijs" kop="Projecten met deze oplossing">
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projecten.slice(0, 3).map((p, i) => (
                <Reveal key={p!.slug} vertraging={i * 60}>
                  <ProjectKaart project={p!} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                </Reveal>
              ))}
            </div>
          </Sectie>
        </section>
      )}

      {/* FAQ */}
      <Sectie kicker="Veelgestelde vragen" kop={`Vragen over de ${(product.kaartLabel ?? product.naam).toLowerCase()}`}>
        <div className="mt-10 max-w-3xl">
          <FaqLijst items={product.faq} />
        </div>
        {(() => {
          const artikelen = ARTIKELEN.filter((a) => a.verwantProduct.includes(product.slug));
          if (!artikelen.length) return null;
          return (
            <div className="mt-10 max-w-3xl">
              <h3 className="font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof">Verder lezen in de kennisbank</h3>
              <ul className="mt-3 space-y-2">
                {artikelen.map((a) => (
                  <li key={a.slug}>
                    <Link to={`/kennisbank/${a.slug}`} className="text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent">
                      {a.kop}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </Sectie>

      {/* Verwant */}
      {verwant.length > 0 && (
        <section className="border-t border-lijn bg-nacht/40">
          <Sectie kicker="Verwante producten" kop="Ook interessant" className="!py-16 md:!py-20">
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {verwant.map((p) => (
                <ProductKaart key={p!.slug} product={p!} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              ))}
            </div>
          </Sectie>
        </section>
      )}

      <CtaSectie
        kop={`${product.kaartLabel ?? product.naam} inzetten voor uw ruimte of event?`}
        tekst="Vraag de prijslijst aan of plan een demonstratie in onze showroom in Den Haag."
        primair={{ label: "Prijslijst aanvragen", naar: "/prijslijst" }}
        secundair={{ label: "Demonstratie aanvragen", naar: "/contact" }}
      />
    </>
  );
}
