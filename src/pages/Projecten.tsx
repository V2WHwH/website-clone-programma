import { Link } from "react-router-dom";
import { useState } from "react";
import { PROJECTEN } from "../content/nl/projecten";
import { SECTOREN } from "../content/nl/sectoren";
import type { SectorSlug } from "../content/types";
import { SITE } from "../data/site";
import { Reveal } from "../components/ui/Reveal";
import { ProjectKaart } from "../components/site/Kaarten";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { CtaSectie } from "../components/site/CtaSectie";

export function Projecten() {
  const [filter, setFilter] = useState<SectorSlug | "alles">("alles");
  const zichtbaar = filter === "alles" ? PROJECTEN : PROJECTEN.filter((p) => p.sector === filter);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Projecten" }]} />
        <div className="max-w-3xl pb-6 pt-10 md:pt-14">
          <p className="kicker mb-3">Projecten</p>
          <h1 className="text-4xl leading-[1.1] md:text-5xl">Ons werk in de praktijk</h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Van gamevloer op DreamHack tot Sketchwall bij Sea Life: {PROJECTEN.length} projecten voor musea, merken, hotels, scholen en events. Bedacht, gebouwd en geïnstalleerd door 
            <Link to="/over-ons" className="text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent">
              ons eigen studio- en installatieteam
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pb-8" role="group" aria-label="Filter projecten op sector">
          <button
            type="button"
            onClick={() => setFilter("alles")}
            aria-pressed={filter === "alles"}
            className={`rounded-full border px-4 py-2 text-[0.9rem] transition-colors ${filter === "alles" ? "border-accent text-accent" : "border-lijn text-zacht hover:border-accent/50"}`}
          >
            Alles
          </button>
          {SECTOREN.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setFilter(s.slug)}
              aria-pressed={filter === s.slug}
              className={`rounded-full border px-4 py-2 text-[0.9rem] transition-colors ${filter === s.slug ? "border-accent text-accent" : "border-lijn text-zacht hover:border-accent/50"}`}
            >
              {s.naam}
            </button>
          ))}
        </div>

        <div className="grid gap-4 pb-14 sm:grid-cols-2 lg:grid-cols-3">
          {zichtbaar.map((p, i) => (
            <Reveal key={p.slug} vertraging={(i % 6) * 40}>
              <ProjectKaart project={p} prioriteit={i < 2} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
            </Reveal>
          ))}
        </div>

        <Reveal className="mb-20 flex flex-col items-start gap-5 rounded-kaart border border-accent/30 bg-nacht/60 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-lijn text-accent" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <div>
              <p className="kicker mb-1">Volg ons op Instagram</p>
              <p className="max-w-md text-[0.98rem] leading-relaxed text-zacht">
                Nieuwe projecten, opbouw achter de schermen en video&rsquo;s van installaties op locatie.
              </p>
            </div>
          </div>
          <a
            href={SITE.socials.find((s) => s.naam === "Instagram")?.url}
            rel="noopener"
            className="navlink inline-flex shrink-0 items-center gap-1.5 rounded-klein border border-lijn px-5 py-2.5 font-display text-[0.95rem] font-medium text-tekst transition-colors hover:border-accent hover:text-accent"
          >
            Bekijk @vision2watch
            <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </div>
      <CtaSectie
        kop="Uw project als volgende referentie?"
        tekst="Elk project begint met één gesprek over uw doel, locatie en planning."
      />
    </>
  );
}
