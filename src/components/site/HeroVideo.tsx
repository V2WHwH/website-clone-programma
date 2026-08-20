import { useEffect, useRef, useState } from "react";
import { Beeld } from "../ui/Beeld";

type Props = {
  src: string;
  poster: string;
  label: string;
  className?: string;
};

// Autoplay-video zonder geluid met poster, loop en een zichtbare
// pauzeknop. Respecteert prefers-reduced-motion: dan speelt er niets
// automatisch en blijft de poster staan.
//
// De bron staat bewust NIET in de voorgebouwde HTML: die bevat alleen de
// poster, zodat het grootste beeld (LCP) een beeld van enkele tientallen
// kB's is in plaats van een videobestand van megabytes. Pas na hydratie
// kiest de client een bron, en op een smal scherm of met databesparing
// aan is dat de lichtere mobiele versie (of helemaal geen video).
export function HeroVideo({ src, poster, label, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [speelt, setSpeelt] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [bron, setBron] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    // databesparing of een trage verbinding: poster laten staan
    const verbinding = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const zuinig = verbinding?.saveData === true || /^(slow-)?2g$/.test(verbinding?.effectiveType ?? "");
    if (!zuinig) {
      const mobiel = window.matchMedia("(max-width: 767px)").matches;
      setBron(mobiel ? src.replace(/\.mp4$/, "-mobiel.mp4") : src);
    }

    const video = ref.current;
    if (!video) return;
    const bij = () => setSpeelt(!video.paused);
    video.addEventListener("play", bij);
    video.addEventListener("pause", bij);
    return () => {
      video.removeEventListener("play", bij);
      video.removeEventListener("pause", bij);
    };
  }, [src]);

  // zodra de bron bekend is: afspelen, tenzij de bezoeker minder beweging wil
  useEffect(() => {
    const video = ref.current;
    if (!video || !bron) return;
    video.load();
    if (!reduced) video.play().catch(() => undefined);
  }, [bron, reduced]);

  const wissel = () => {
    const video = ref.current;
    if (!video) return;
    // nog geen bron gekozen (databesparing): alsnog laden op verzoek
    if (!bron) {
      setBron(window.matchMedia("(max-width: 767px)").matches ? src.replace(/\.mp4$/, "-mobiel.mp4") : src);
      return;
    }
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  };

  return (
    <div className={`relative ${className}`}>
      {/* De poster staat als gewoon beeld onder de video, niet als
          poster-attribuut: alleen zo kan hij een srcset krijgen en haalt een
          telefoon een variant van tientallen kB's in plaats van de volle
          1280 px. Dit beeld is het grootste element boven de vouw. */}
      <Beeld
        src={poster}
        alt=""
        prioriteit
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover"
      />
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
        className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-inkt/60 text-tekst backdrop-blur-sm transition-colors hover:border-accent"
      >
        <span className="sr-only">{speelt ? "Video pauzeren" : "Video afspelen"}</span>
        {speelt ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="currentColor"><path d="M2.5 1h3v12h-3zM8.5 1h3v12h-3z" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="currentColor"><path d="M3 1.5l9 5.5-9 5.5z" /></svg>
        )}
      </button>
    </div>
  );
}
