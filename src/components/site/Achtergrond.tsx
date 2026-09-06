import { useEffect, useRef } from "react";

// Eén vaste laag achter de hele site die met het scrollen meebeweegt:
// een fijn puntraster en twee lichtgloeden die elk met een eigen snelheid
// verschuiven, zodat er diepte ontstaat. Daarbovenop een dunne oranje
// voortgangslijn die toont hoe ver de pagina is gescrold.
//
// Alles is puur decoratief (aria-hidden, geen pointer events) en bewust
// goedkoop: alleen transform en opacity, bijgewerkt in één
// requestAnimationFrame per scrollstap, dus zonder layout of paint van de
// rest van de pagina. Bij reduced motion staat de laag stil en verdwijnt
// de spotlight; zonder JavaScript blijft de site exact zoals hij was.
export function Achtergrond() {
  const raster = useRef<HTMLDivElement>(null);
  const gloedA = useRef<HTMLDivElement>(null);
  const gloedB = useRef<HTMLDivElement>(null);
  const balk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let bezig = false;

    const teken = () => {
      bezig = false;
      const y = window.scrollY;
      const hoogte = document.documentElement.scrollHeight - window.innerHeight;
      if (balk.current) {
        const deel = hoogte > 0 ? Math.min(y / hoogte, 1) : 0;
        balk.current.style.transform = `scaleX(${deel})`;
        balk.current.style.opacity = y > 40 ? "1" : "0";
      }
      if (rustig) return;
      if (raster.current) raster.current.style.transform = `translate3d(0, ${y * -0.05}px, 0)`;
      if (gloedA.current) gloedA.current.style.transform = `translate3d(0, ${y * -0.12}px, 0)`;
      if (gloedB.current) gloedB.current.style.transform = `translate3d(0, ${y * -0.22}px, 0)`;
    };

    const bijScroll = () => {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(teken);
    };
    teken();
    window.addEventListener("scroll", bijScroll, { passive: true });
    window.addEventListener("resize", bijScroll, { passive: true });

    // Spotlight op kaarten: één gedelegeerde listener zet de muspositie als
    // custom property op de kaart; de CSS tekent daar een zachte lichtvlek.
    const bijBeweging = (e: PointerEvent) => {
      const kaart = (e.target as Element | null)?.closest?.(".kaart") as HTMLElement | null;
      if (!kaart) return;
      const vak = kaart.getBoundingClientRect();
      kaart.style.setProperty("--mx", `${e.clientX - vak.left}px`);
      kaart.style.setProperty("--my", `${e.clientY - vak.top}px`);
    };
    const metMuis = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!rustig && metMuis) document.addEventListener("pointermove", bijBeweging, { passive: true });

    return () => {
      window.removeEventListener("scroll", bijScroll);
      window.removeEventListener("resize", bijScroll);
      document.removeEventListener("pointermove", bijBeweging);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* puntraster over de volle hoogte, met overmaat zodat de
            verschuiving nooit een rand blootlegt */}
        <div ref={raster} className="achtergrond-raster absolute inset-x-0 -top-1/4 h-[150%]" />
        {/* warme gloed rechtsboven: het Vision2watch-oranje, heel zacht */}
        <div
          ref={gloedA}
          className="absolute -right-[15%] -top-[10%] h-[42rem] w-[42rem] rounded-full opacity-[0.1]"
          style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 62%)" }}
        />
        {/* koel wit licht linksonder, nog zachter, als tegenwicht */}
        <div
          ref={gloedB}
          className="absolute -left-[18%] top-[75%] h-[36rem] w-[36rem] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #f5f5f2 0%, transparent 60%)" }}
        />
      </div>
      {/* scrollvoortgang: dunne oranje lijn boven alles, groeit van links */}
      <div
        ref={balk}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left opacity-0 transition-opacity duration-300"
        style={{ transform: "scaleX(0)", background: "linear-gradient(to right, var(--color-accent-diep), var(--color-accent), var(--color-accent-fel))" }}
      />
    </>
  );
}
