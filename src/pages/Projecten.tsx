import { useState } from "react";
import { PROJECTEN } from "../content/nl/projecten";
import { SECTOREN } from "../content/nl/sectoren";
import type { SectorSlug } from "../content/types";
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
          <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">Ons werk in de praktijk</h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Van gamevloer op DreamHack tot Sketchwall bij Sea Life: {PROJECTEN.length} projecten voor musea, merken, hotels, scholen en events.
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

        <div className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {zichtbaar.map((p, i) => (
            <Reveal key={p.slug} vertraging={(i % 6) * 40}>
              <ProjectKaart project={p} prioriteit={i < 2} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
            </Reveal>
          ))}
        </div>
      </div>
      <CtaSectie
        kop="Uw project als volgende referentie?"
        tekst="Elk project begint met één gesprek over uw doel, locatie en planning."
      />
    </>
  );
}
