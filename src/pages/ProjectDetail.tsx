import { useParams } from "react-router-dom";
import { PROJECTEN, vindProject } from "../content/nl/projecten";
import { PRODUCTEN } from "../content/nl/producten";
import { vindSector } from "../content/nl/sectoren";
import { Beeld } from "../components/ui/Beeld";
import { Reveal } from "../components/ui/Reveal";
import { Sectie } from "../components/ui/Sectie";
import { CtaSectie } from "../components/site/CtaSectie";
import { HeroVideo } from "../components/site/HeroVideo";
import { ProductKaart, ProjectKaart } from "../components/site/Kaarten";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { NietGevonden } from "./NietGevonden";

export function ProjectDetail() {
  const { slug } = useParams();
  const project = slug ? vindProject(slug) : undefined;
  if (!project) return <NietGevonden />;

  const sector = vindSector(project.sector);
  const producten = project.producten.map((s) => PRODUCTEN.find((p) => p.slug === s)).filter(Boolean);
  const meer = PROJECTEN.filter((p) => p.slug !== project.slug && p.sector === project.sector).slice(0, 3);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Projecten", pad: "/projecten" }, { naam: project.klant }]} />
        <div className="max-w-3xl pb-8 pt-10 md:pt-14">
          <p className="kicker mb-3">{project.klant}</p>
          <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">{project.titel}</h1>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[0.9rem] text-zacht">
            {project.locatie && (
              <div className="flex gap-2">
                <dt className="text-dof">Locatie</dt>
                <dd>{project.locatie}</dd>
              </div>
            )}
            {sector && (
              <div className="flex gap-2">
                <dt className="text-dof">Sector</dt>
                <dd>{sector.naam}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-dof">Techniek</dt>
              <dd>{producten.map((p) => p!.kaartLabel ?? p!.naam).join(", ")}</dd>
            </div>
          </dl>
        </div>

        <Reveal>
          <figure className="overflow-hidden rounded-kaart border border-lijn">
            {project.video ? (
              <HeroVideo src={project.video.src} poster={project.video.poster} label={project.video.label} className="aspect-video" />
            ) : (
              <Beeld src={project.beeld.src} alt={project.beeld.alt} prioriteit className="max-h-[34rem] w-full object-cover" sizes="(min-width: 1152px) 1104px, 100vw" />
            )}
            {project.beeldIllustratief && (
              <figcaption className="border-t border-lijn px-4 py-2.5 text-[0.85rem] text-dof">
                Illustratiebeeld: dit toont de gebruikte techniek, niet dit project zelf.
              </figcaption>
            )}
          </figure>
        </Reveal>
      </div>

      <Sectie className="!pb-10 md:!pb-14">
        <div className="grid gap-12 md:grid-cols-[1fr_1.6fr]">
          {project.uitdaging && (
            <Reveal>
              <h2 className="text-xl font-medium md:text-2xl">De vraag</h2>
              <p className="mt-4 leading-relaxed text-zacht">{project.uitdaging}</p>
            </Reveal>
          )}
          <Reveal vertraging={60} className={project.uitdaging ? "" : "md:col-span-2 max-w-3xl"}>
            <h2 className="text-xl font-medium md:text-2xl">De oplossing</h2>
            <p className="mt-4 text-lg leading-relaxed text-zacht">{project.oplossing}</p>
          </Reveal>
        </div>

        {project.galerij && project.galerij.length > 0 && (
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {project.galerij.map((b, i) => (
              <Reveal key={b.src} vertraging={i * 60} className="overflow-hidden rounded-kaart border border-lijn">
                <Beeld src={b.src} alt={b.alt} className="aspect-[3/2] w-full object-cover" sizes="(min-width: 640px) 50vw, 100vw" />
              </Reveal>
            ))}
          </div>
        )}
      </Sectie>

      <section className="border-t border-lijn bg-nacht/40">
        <Sectie kicker="Gebruikte oplossingen" kop="De techniek achter dit project" className="!py-16 md:!py-20">
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {producten.map((p) => (
              <ProductKaart key={p!.slug} product={p!} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
            ))}
          </div>
        </Sectie>
      </section>

      {meer.length > 0 && (
        <Sectie kicker="Meer in deze sector" kop="Vergelijkbare projecten">
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meer.map((p) => (
              <ProjectKaart key={p.slug} project={p} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
            ))}
          </div>
        </Sectie>
      )}

      <CtaSectie
        kop="Een vergelijkbaar project voor uw merk of locatie?"
        tekst="Vertel ons uw situatie; we laten zien wat er kan, inclusief voorbeelden uit de praktijk."
      />
    </>
  );
}
