import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Beeld } from "../ui/Beeld";

export type Hoofdstuk = {
  /** korte naam in de balk bovenin; dit is wat een bezoeker als eerste ziet */
  tab: string;
  kicker: string;
  kop: string;
  tekst: string;
  /** stilstaand beeld: ook het beeld dat blijft staan zonder video */
  beeld: string;
  alt: string;
  video?: string;
  /** feiten in één woord, direct onder de tekst */
  merken?: string[];
  naar: { pad: string; label: string };
};

type Props = { hoofdstukken: Hoofdstuk[] };

// Het beeld staat vast en vult het scherm; de tekst schuift eroverheen. Boven
// in beeld loopt een balk mee met de namen van de productgroepen, zodat een
// bezoeker binnen een seconde ziet wát er te koop is en er meteen heen kan
// springen. Dat is de kern: eerst laten zien, dan pas uitleggen.
//
// Zonder JavaScript blijft alles werken: elk hoofdstuk is gewoon een blok
// tekst met een beeld erboven, en de balk is een rij ankerlinks.
export function Hoofdstukken({ hoofdstukken }: Props) {
  const [actief, setActief] = useState(0);
  const [geladen, setGeladen] = useState<number[]>([]);
  const [beweging, setBeweging] = useState(false);
  const [smal, setSmal] = useState(false);
  const panelen = useRef<(HTMLDivElement | null)[]>([]);
  const spelers = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const verbinding = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const zuinig = verbinding?.saveData === true || /^(slow-)?2g$/.test(verbinding?.effectiveType ?? "");
    setBeweging(!rustig && !zuinig);
    setSmal(window.matchMedia("(max-width: 767px)").matches);
  }, []);

  useEffect(() => {
    const waarnemer = new IntersectionObserver(
      (regels) => {
        for (const regel of regels) {
          if (!regel.isIntersecting) continue;
          const i = panelen.current.findIndex((el) => el === regel.target);
          if (i >= 0) setActief(i);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const el of panelen.current) if (el) waarnemer.observe(el);
    return () => waarnemer.disconnect();
  }, []);

  useEffect(() => {
    if (!beweging) return;
    setGeladen((eerder) => (eerder.includes(actief) ? eerder : [...eerder, actief]));
    spelers.current.forEach((speler, i) => {
      if (!speler) return;
      if (i === actief) void speler.play().catch(() => {});
      else speler.pause();
    });
  }, [actief, beweging]);

  const springNaar = useCallback((i: number) => {
    panelen.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="relative bg-inkt" aria-label="Wat wij maken">
      {/* het vaste beeld */}
      <div className="sticky top-0 h-svh overflow-hidden">
        {hoofdstukken.map((h, i) => (
          <div
            key={h.beeld}
            className={`absolute inset-0 transition-opacity duration-700 ease-uit ${i === actief ? "opacity-100" : "opacity-0"}`}
          >
            <Beeld
              src={h.beeld}
              alt={i === 0 ? h.alt : ""}
              prioriteit={i === 0}
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {h.video && beweging && geladen.includes(i) && (
              <video
                ref={(el) => { spelers.current[i] = el; }}
                src={smal ? h.video.replace(/\.mp4$/, "-mobiel.mp4") : h.video}
                poster={h.beeld}
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
        ))}
        {/* Verloop dat meedraait met de kant waar de tekst staat. */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${actief % 2 === 0 ? "opacity-100" : "opacity-0"} bg-gradient-to-r from-inkt from-5% via-inkt/82 via-46% to-transparent to-78%`}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${actief % 2 === 1 ? "opacity-100" : "opacity-0"} bg-gradient-to-l from-inkt from-5% via-inkt/82 via-46% to-transparent to-78%`}
          aria-hidden="true"
        />
        {/* Op een smal scherm loopt de tekst over de volle breedte; daar
            helpt een verloop opzij niet. Dan verdonkeren we van onder naar
            boven, precies waar de tekst staat. */}
        <div className="absolute inset-0 bg-gradient-to-t from-inkt via-inkt/75 via-55% to-inkt/25 md:hidden" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-inkt/90 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-inkt/90 to-transparent" aria-hidden="true" />
      </div>

      {/* de hoofdstukken die eroverheen schuiven */}
      <div className="relative -mt-[100svh]">
        {/* De productgroepbalk. Blijft onder de kop van de pagina staan,
            loopt mee met waar je bent en is tegelijk de snelste weg naar het
            onderwerp. De houder is nul pixels hoog, zodat de balk zweeft en
            de hoofdstukken eronder gewoon hun eigen hoogte houden. */}
        <div className="sticky top-16 z-20 h-0">
          <nav aria-label="Productgroepen" className="mx-auto w-full max-w-6xl px-5 pt-4 md:px-8 md:pt-6">
            <ul className="flex gap-1.5 overflow-x-auto pb-1 md:justify-end [&::-webkit-scrollbar]:hidden">
              {hoofdstukken.map((h, i) => (
                <li key={h.tab} className="shrink-0">
                  <a
                    href={`#hoofdstuk-${i}`}
                    onClick={(e) => { e.preventDefault(); springNaar(i); }}
                    aria-current={i === actief ? "true" : undefined}
                    className={`block rounded-klein border px-3.5 py-1.5 font-display text-[0.82rem] font-medium backdrop-blur-sm transition-colors ${
                      i === actief
                        ? "border-accent bg-accent text-inkt"
                        : "border-white/15 bg-inkt/55 text-zacht hover:border-accent/60 hover:text-tekst"
                    }`}
                  >
                    {h.tab}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {hoofdstukken.map((h, i) => (
          <div
            key={h.kop}
            id={`hoofdstuk-${i}`}
            ref={(el) => { panelen.current[i] = el; }}
            className={`flex min-h-svh items-center py-28 ${i % 2 === 1 ? "justify-end" : ""}`}
          >
            <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
              <div className={`max-w-xl ${i % 2 === 1 ? "ml-auto" : ""}`}>
                <p className="kicker mb-3">{h.kicker}</p>
                {i === 0 ? (
                  <h1 className="text-4xl leading-[1.05] md:text-6xl">{h.kop}</h1>
                ) : (
                  <h2 className="text-3xl leading-[1.08] md:text-5xl">{h.kop}</h2>
                )}
                <p className="mt-5 text-lg leading-relaxed text-zacht md:text-xl">{h.tekst}</p>
                {h.merken && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {h.merken.map((m) => (
                      <li key={m} className="rounded-klein border border-white/15 bg-inkt/50 px-3 py-1 font-mono text-[0.78rem] text-zacht backdrop-blur-sm">
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to={h.naar.pad}
                  className="group/knop mt-8 inline-flex items-center gap-2 rounded-klein bg-accent px-5 py-3 font-display text-[0.95rem] font-medium text-inkt transition-colors hover:bg-accent-fel"
                >
                  {h.naar.label}
                  <span aria-hidden="true" className="transition-transform group-hover/knop:translate-x-0.5">→</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
