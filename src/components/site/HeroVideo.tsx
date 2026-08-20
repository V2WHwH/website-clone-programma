import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster: string;
  label: string;
  className?: string;
};

// Autoplay-video zonder geluid met poster, loop en een zichtbare
// pauzeknop. Respecteert prefers-reduced-motion: dan speelt er niets
// automatisch en blijft de poster staan.
export function HeroVideo({ src, poster, label, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [speelt, setSpeelt] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const video = ref.current;
    if (!video) return;
    if (mq.matches) {
      video.removeAttribute("autoplay");
      video.pause();
    } else {
      video.play().catch(() => undefined);
    }
    const bij = () => setSpeelt(!video.paused);
    video.addEventListener("play", bij);
    video.addEventListener("pause", bij);
    return () => {
      video.removeEventListener("play", bij);
      video.removeEventListener("pause", bij);
    };
  }, []);

  const wissel = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  };

  return (
    <div className={`relative ${className}`}>
      <video
        ref={ref}
        muted
        playsInline
        loop
        autoPlay={!reduced}
        preload="none"
        poster={poster}
        aria-label={label}
        className="h-full w-full object-cover"
      >
        <source src={src} type="video/mp4" />
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
