import { useEffect, useRef, useState } from "react";
import { Beeld } from "../ui/Beeld";

type Props = { src: string; poster: string; className?: string };

// Een rustige laag beweging achter een tekstblok: geen inhoud, geen
// boodschap, alleen licht dat langzaam door de duisternis trekt. Dat geeft
// de afsluiting van een pagina hetzelfde gevoel als de rest van de site
// zonder te doen alsof er een installatie te zien is.
//
// Dit beeld is niet gefilmd maar gegenereerd; het toont dan ook geen product
// en geen project (zie docs/ontbrekende-assets.md). Het laadt pas als het in
// beeld komt, staat stil bij databesparing of minder beweging, en de poster
// blijft altijd staan.
export function Sfeerlaag({ src, poster, className = "" }: Props) {
  const houder = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [bron, setBron] = useState<string | null>(null);

  useEffect(() => {
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const verbinding = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const zuinig = verbinding?.saveData === true || /^(slow-)?2g$/.test(verbinding?.effectiveType ?? "");
    if (rustig || zuinig || !houder.current) return;

    const waarnemer = new IntersectionObserver(
      ([regel]) => {
        if (!regel?.isIntersecting) {
          ref.current?.pause();
          return;
        }
        setBron((eerder) =>
          eerder ??
          (window.matchMedia("(max-width: 767px)").matches ? src.replace(/\.mp4$/, "-mobiel.mp4") : src),
        );
        void ref.current?.play().catch(() => {});
      },
      { rootMargin: "150px 0px", threshold: 0.1 },
    );
    waarnemer.observe(houder.current);
    return () => waarnemer.disconnect();
  }, [src]);

  useEffect(() => {
    if (!bron) return;
    const video = ref.current;
    if (!video) return;
    video.load();
    void video.play().catch(() => {});
  }, [bron]);

  return (
    <div ref={houder} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <Beeld src={poster} alt="" sizes="100vw" className="absolute inset-0 h-full w-full scale-x-[-1] object-cover opacity-80" />
      <video ref={ref} muted loop playsInline preload="none" tabIndex={-1} className="absolute inset-0 h-full w-full scale-x-[-1] object-cover opacity-80">
        {bron && <source src={bron} type="video/mp4" />}
      </video>
      {/* De lichtbundels vallen in de bron linksboven; gespiegeld komen ze
          rechts uit, weg van de tekst. Links dooft het verloop ze helemaal,
          zodat de kop en de knoppen op een rustige grond staan. */}
      <div className="absolute inset-0 bg-gradient-to-r from-nacht from-20% via-nacht/80 via-55% to-nacht/10" />
    </div>
  );
}
