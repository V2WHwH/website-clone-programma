import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BEELDMATEN } from "../../data/beeldmaten";

type Paneel = {
  /** beeld dat achter dit paneel hoort; ook het stilstaande beeld van de video */
  beeld: string;
  alt: string;
  /** optioneel: echte opname van dit werk, die speelt zolang het paneel in beeld is */
  video?: string;
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
  // Welke video's mogen laden. Een video komt er pas bij als zijn paneel in
  // beeld is geweest: zo kost een bezoeker die halverwege stopt ook maar de
  // helft van de megabytes. Wat geladen is blijft geladen, dus terugscrollen
  // haalt niets opnieuw op.
  const [geladen, setGeladen] = useState<number[]>([]);
  const [beweging, setBeweging] = useState(false);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const spelers = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    // Wie liever geen beweging ziet of op databesparing staat, houdt de
    // stilstaande beelden. Dat is hier geen verarming: elk paneel heeft er een.
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const verbinding = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const zuinig = verbinding?.saveData === true || /^(slow-)?2g$/.test(verbinding?.effectiveType ?? "");
    setBeweging(!rustig && !zuinig);
  }, []);

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

  useEffect(() => {
    if (!beweging) return;
    setGeladen((eerder) => (eerder.includes(actief) ? eerder : [...eerder, actief]));
    // Alleen het beeld dat je ziet speelt. De rest staat stil, anders draaien
    // er vier video's tegelijk voor niets.
    spelers.current.forEach((speler, i) => {
      if (!speler) return;
      if (i === actief) void speler.play().catch(() => {});
      else speler.pause();
    });
  }, [actief, beweging]);

  return (
    <section className="relative bg-inkt" aria-label="Wat interactieve techniek met een ruimte doet">
      {/* het vaste beeld */}
      <div className="sticky top-0 h-svh overflow-hidden">
        {panelen.map((p, i) => {
          const maat = BEELDMATEN[p.beeld];
          const klein = p.beeld.replace(/\.webp$/, "-640.webp");
          const middel = p.beeld.replace(/\.webp$/, "-1024.webp");
          const zichtbaar = i === actief ? "opacity-100" : "opacity-0";
          return (
            <div key={p.beeld} className={`absolute inset-0 transition-opacity duration-700 ease-uit ${zichtbaar}`}>
              <img
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
                className="absolute inset-0 h-full w-full object-cover"
              />
              {p.video && beweging && geladen.includes(i) && (
                <video
                  ref={(el) => { spelers.current[i] = el; }}
                  src={p.video}
                  poster={p.beeld}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
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
