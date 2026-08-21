import { useEffect, useRef, useState } from "react";
import { Beeld } from "../ui/Beeld";
import { BEELDMATEN } from "../../data/beeldmaten";

type Props = {
  src: string;
  poster: string;
  label: string;
  className?: string;
};

// Een opname op ware verhouding, bedoeld voor beeld dat níet schermvullend
// hoort: veel opnames op locatie zijn met een telefoon gemaakt en staan
// rechtop. Die bijsnijden tot een breed vlak snijdt precies weg waar het om
// gaat. Dit blok toont ze dus staand, in een kader.
//
// De video laadt pas als hij in beeld komt en speelt alleen dan. Zo kost een
// pagina met zo'n blok niets extra's zolang de bezoeker er niet is.
export function Demovideo({ src, poster, label, className = "" }: Props) {
  const houder = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [bron, setBron] = useState<string | null>(null);
  const [speelt, setSpeelt] = useState(false);
  const [rustig, setRustig] = useState(false);
  const maat = BEELDMATEN[poster];

  useEffect(() => {
    setRustig(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const verbinding = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const zuinig = verbinding?.saveData === true || /^(slow-)?2g$/.test(verbinding?.effectiveType ?? "");
    if (zuinig || !houder.current) return;

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
      },
      { rootMargin: "200px 0px", threshold: 0.25 },
    );
    waarnemer.observe(houder.current);
    return () => waarnemer.disconnect();
  }, [src]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !bron) return;
    video.load();
    if (!rustig) void video.play().catch(() => {});
    const bij = () => setSpeelt(!video.paused);
    video.addEventListener("play", bij);
    video.addEventListener("pause", bij);
    return () => {
      video.removeEventListener("play", bij);
      video.removeEventListener("pause", bij);
    };
  }, [bron, rustig]);

  const wissel = () => {
    const video = ref.current;
    if (!video) return;
    if (!bron) {
      setBron(window.matchMedia("(max-width: 767px)").matches ? src.replace(/\.mp4$/, "-mobiel.mp4") : src);
      return;
    }
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  };

  return (
    <div
      ref={houder}
      className={`relative overflow-hidden rounded-kaart border border-lijn bg-nacht ${className}`}
      style={maat ? { aspectRatio: `${maat[0]} / ${maat[1]}` } : undefined}
    >
      <Beeld src={poster} alt="" sizes="(min-width: 768px) 40vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
      <video
        ref={ref}
        muted
        playsInline
        loop
        preload="none"
        aria-label={label}
        className={`relative h-full w-full object-cover transition-opacity duration-700 ${speelt ? "opacity-100" : "opacity-0"}`}
      >
        {bron && <source src={bron} type="video/mp4" />}
      </video>
      <button
        type="button"
        onClick={wissel}
        className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-inkt/60 text-tekst backdrop-blur-sm transition-colors hover:border-accent"
      >
        <span className="sr-only">{speelt ? "Video pauzeren" : "Video afspelen"}</span>
        {speelt ? (
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true" fill="currentColor"><path d="M2.5 1h3v12h-3zM8.5 1h3v12h-3z" /></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true" fill="currentColor"><path d="M3 1.5l9 5.5-9 5.5z" /></svg>
        )}
      </button>
    </div>
  );
}
