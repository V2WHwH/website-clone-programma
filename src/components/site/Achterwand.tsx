import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BEELDMATEN } from "../../data/beeldmaten";

type Paneel = {
  /** beeld dat achter dit paneel hoort */
  beeld: string;
  alt: string;
  kicker: string;
  kop: string;
  tekst: string;
  naar?: { pad: string; label: string };
};

type Props = { panelen: Paneel[] };

// Een achterwand die blijft staan terwijl je eroverheen scrolt: het beeld
// vult het scherm en wisselt mee met het paneel dat in beeld is. Dat geeft
// de diepte die past bij een bedrijf dat ruimtes visueel vult, zonder de
// scroll over te nemen: je scrolt gewoon door, het beeld reageert.
//
// Zonder JavaScript blijft het eerste beeld staan en zijn alle teksten
// gewoon leesbaar; er gaat dus niets verloren voor zoekmachines.
export function Achterwand({ panelen }: Props) {
  const [actief, setActief] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const waarnemer = new IntersectionObserver(
      (regels) => {
        for (const regel of regels) {
          if (!regel.isIntersecting) continue;
          const i = refs.current.findIndex((el) => el === regel.target);
          if (i >= 0) setActief(i);
        }
      },
      // het midden van het scherm bepaalt welk paneel telt
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const el of refs.current) if (el) waarnemer.observe(el);
    return () => waarnemer.disconnect();
  }, []);

  return (
    <section className="relative bg-inkt" aria-label="Wat interactieve techniek met een ruimte doet">
      {/* het vaste beeld */}
      <div className="sticky top-0 h-svh overflow-hidden">
        {panelen.map((p, i) => {
          const maat = BEELDMATEN[p.beeld];
          const klein = p.beeld.replace(/\.webp$/, "-640.webp");
          const middel = p.beeld.replace(/\.webp$/, "-1024.webp");
          return (
            <img
              key={p.beeld}
              src={p.beeld}
              srcSet={[
                BEELDMATEN[klein] ? `${klein} 640w` : "",
                BEELDMATEN[middel] ? `${middel} 1024w` : "",
                `${p.beeld} ${maat?.[0] ?? 1600}w`,
              ].filter(Boolean).join(", ")}
              sizes="100vw"
              alt={i === 0 ? p.alt : ""}
              aria-hidden={i === 0 ? undefined : true}
              width={maat?.[0]}
              height={maat?.[1]}
              loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-uit ${
                i === actief ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
        {/* Alleen de leeskant verdonkeren. Rechts blijft het beeld op volle
            sterkte: dat is waar de techniek te zien is en daar gaat het om. */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-inkt from-5% via-inkt/70 via-42% to-transparent to-72%"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-inkt/90 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-inkt/90 to-transparent" aria-hidden="true" />
      </div>

      {/* de panelen die eroverheen schuiven */}
      <div className="relative -mt-svh">
        {panelen.map((p, i) => (
          <div
            key={p.kop}
            ref={(el) => { refs.current[i] = el; }}
            className="flex min-h-svh items-center py-24"
          >
            <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
              <div className="max-w-xl">
                <p className="kicker mb-3">{p.kicker}</p>
                <h2 className="text-3xl font-medium leading-[1.1] md:text-[2.75rem]">{p.kop}</h2>
                <p className="mt-5 text-lg leading-relaxed text-zacht md:text-xl">{p.tekst}</p>
                {p.naar && (
                  <Link
                    to={p.naar.pad}
                    className="group/knop mt-7 inline-flex items-center gap-2 border-b border-accent/40 pb-1 font-display text-[1.05rem] text-tekst transition-colors hover:border-accent hover:text-accent"
                  >
                    {p.naar.label}
                    <span aria-hidden="true" className="transition-transform group-hover/knop:translate-x-0.5">→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
