import { useEffect, useRef } from "react";
import { ShaderBackground } from "../ui/MeshDriftShader";
import { useShaderKlaar } from "./SfeerShader";

// Eén vaste laag achter de hele site die met het scrollen meebeweegt:
// een fijn puntraster en twee lichtgloeden die elk met een eigen snelheid
// verschuiven, zodat er diepte ontstaat. Daarbovenop een dunne oranje
// voortgangslijn die toont hoe ver de pagina is gescrold.
//
// Het accent-effect is de "vloerspot": rond de muisaanwijzer lichten de
// punten van het raster oranje op, met een lichte na-ijl — zoals de
// interactieve vloeren van Vision2Watch zelf op een voetstap reageren.
// De spot is een klein element (dus een kleine repaint) dat met transforms
// wordt verplaatst; zijn puntpatroon wordt per frame uitgelijnd op het
// grote raster zodat beide patronen één geheel vormen.
//
// Alles is puur decoratief (aria-hidden, geen pointer events) en bewust
// goedkoop: transforms en een kleine background-position, bijgewerkt in
// één requestAnimationFrame-lus die stopt zodra alles stilstaat. Bij
// reduced motion staat de laag stil en is er geen spot; zonder JavaScript
// blijft de site exact zoals hij was.
const SPOT = 440; // diameter van de vloerspot in px
const RASTER = 26; // moet gelijk zijn aan background-size in global.css

export function Achtergrond() {
  const raster = useRef<HTMLDivElement>(null);
  const gloedA = useRef<HTMLDivElement>(null);
  const gloedB = useRef<HTMLDivElement>(null);
  const balk = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  // De mesh-shader komt pas na window load en alleen zonder reduced motion
  // en zonder databesparing (zie useShaderKlaar): de statische HTML — en dus
  // de prerender — blijft identiek.
  const metShader = useShaderKlaar();

  useEffect(() => {
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const metMuis = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // doel- en huidige positie van de vloerspot (lerp geeft de na-ijl)
    let doelX = -SPOT, doelY = -SPOT, spotX = -SPOT, spotY = -SPOT;
    let spotAan = false;
    let bezig = false;

    const teken = () => {
      const y = window.scrollY;
      const hoogte = document.documentElement.scrollHeight - window.innerHeight;
      if (balk.current) {
        const deel = hoogte > 0 ? Math.min(y / hoogte, 1) : 0;
        balk.current.style.transform = `scaleX(${deel})`;
        balk.current.style.opacity = y > 40 ? "1" : "0";
      }

      let nogBezig = false;
      if (!rustig) {
        if (raster.current) raster.current.style.transform = `translate3d(0, ${y * -0.05}px, 0)`;
        if (gloedA.current) gloedA.current.style.transform = `translate3d(0, ${y * -0.12}px, 0)`;
        if (gloedB.current) gloedB.current.style.transform = `translate3d(0, ${y * -0.22}px, 0)`;

        // vloerspot: soepel richting de aanwijzer, patroon gelijk aan raster
        if (spot.current && metMuis) {
          spotX += (doelX - spotX) * 0.14;
          spotY += (doelY - spotY) * 0.14;
          const el = spot.current;
          el.style.transform = `translate3d(${spotX - SPOT / 2}px, ${spotY - SPOT / 2}px, 0)`;
          el.style.opacity = spotAan ? "1" : "0";
          // uitlijnen op het grote raster: dat begint op -25% van de
          // viewporthoogte en is zelf met de scroll verschoven
          const rasterTop = -0.25 * window.innerHeight + y * -0.05;
          const mod = (a: number, b: number) => ((a % b) + b) % b;
          el.style.backgroundPosition = `${mod(-(spotX - SPOT / 2), RASTER)}px ${mod(rasterTop - (spotY - SPOT / 2), RASTER)}px`;
          if (Math.abs(doelX - spotX) + Math.abs(doelY - spotY) > 0.3) nogBezig = true;
        }
      }

      if (nogBezig) {
        requestAnimationFrame(teken);
      } else {
        bezig = false;
      }
    };

    const plan = () => {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(teken);
    };

    const bijScroll = () => plan();
    teken();
    bezig = true; // eerste frame draait al
    requestAnimationFrame(() => { bezig = false; });
    window.addEventListener("scroll", bijScroll, { passive: true });
    window.addEventListener("resize", bijScroll, { passive: true });

    // Aanwijzer volgen: doelpositie van de vloerspot en, voor de kaarten,
    // de muspositie als custom property voor de spotlight in CSS.
    const bijBeweging = (e: PointerEvent) => {
      doelX = e.clientX;
      doelY = e.clientY;
      spotAan = true;
      plan();
      const kaart = (e.target as Element | null)?.closest?.(".kaart") as HTMLElement | null;
      if (!kaart) return;
      const vak = kaart.getBoundingClientRect();
      kaart.style.setProperty("--mx", `${e.clientX - vak.left}px`);
      kaart.style.setProperty("--my", `${e.clientY - vak.top}px`);
    };
    const bijVertrek = () => {
      spotAan = false;
      plan();
    };
    if (!rustig && metMuis) {
      document.addEventListener("pointermove", bijBeweging, { passive: true });
      document.documentElement.addEventListener("pointerleave", bijVertrek);
    }

    return () => {
      window.removeEventListener("scroll", bijScroll);
      window.removeEventListener("resize", bijScroll);
      document.removeEventListener("pointermove", bijBeweging);
      document.documentElement.removeEventListener("pointerleave", bijVertrek);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* onderste laag: de mesh-drift-shader als doorschijnende gloed.
            Screen-blending laat zwart wegvallen, zodat alleen op donkere
            plekken een zacht licht doorschemert. */}
        {metShader && (
          <div className="shader-in absolute inset-0 mix-blend-screen">
            <ShaderBackground className="h-full w-full" />
          </div>
        )}
        {/* puntraster over de volle hoogte, met overmaat zodat de
            verschuiving nooit een rand blootlegt */}
        <div ref={raster} className="achtergrond-raster absolute inset-x-0 -top-1/4 h-[150%]" />
        {/* vloerspot: oranje punten die rond de aanwijzer oplichten */}
        <div
          ref={spot}
          className="achtergrond-spot absolute left-0 top-0 opacity-0"
          style={{ width: SPOT, height: SPOT }}
        />
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
