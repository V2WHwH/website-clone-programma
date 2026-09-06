import { useEffect, useState } from "react";
import { ShaderBackground } from "../ui/MeshDriftShader";

// Dezelfde spelregels als de vaste achtergrondlaag: de shader is sfeer en
// mag het laden niets kosten. Pas na window load (plus een korte adempauze)
// en alleen zonder reduced motion of databesparing.
export function useShaderKlaar() {
  const [klaar, setKlaar] = useState(false);
  useEffect(() => {
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const verbinding = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (rustig || verbinding?.saveData === true) return;
    let timer: number | undefined;
    const start = () => {
      timer = window.setTimeout(() => setKlaar(true), 300);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (timer) window.clearTimeout(timer);
    };
  }, []);
  return klaar;
}

// Lokale mesh-shaderlaag voor secties waarvan de eigen media of vlakken de
// vaste achtergrond afdekken: hero's met schermvullend beeld en de
// afsluitende cta. Screen-blending voegt alleen licht toe, dus over video
// of foto valt hij weg en op donkere vlakken schemert hij door — de plekken
// die anders vlak grijs blijven. De canvas pauzeert zelf zodra de sectie
// buiten beeld scrollt.
export function SfeerShader({ className = "" }: { className?: string }) {
  const klaar = useShaderKlaar();
  if (!klaar) return null;
  return (
    <div
      aria-hidden="true"
      className={`shader-in pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen ${className}`}
    >
      <ShaderBackground className="h-full w-full" />
    </div>
  );
}
