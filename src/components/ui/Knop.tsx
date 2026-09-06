import { useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";

type Props = {
  naar: string;
  children: ReactNode;
  variant?: "primair" | "secundair";
  className?: string;
};

const stijlen = {
  primair:
    "bg-accent text-inkt hover:bg-accent-fel active:bg-accent-diep font-medium",
  secundair:
    "border border-lijn text-tekst hover:border-accent hover:text-accent",
};

// Magnetisch effect: de knop schuift een paar pixels mee richting de
// aanwijzer en veert terug bij vertrek. Alleen op apparaten met een echte
// muis en zonder reduced motion; verder verandert er niets aan de knop.
function magnetisch() {
  const mag =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!mag) return {};
  return {
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const vak = el.getBoundingClientRect();
      const dx = (e.clientX - vak.left - vak.width / 2) / (vak.width / 2);
      const dy = (e.clientY - vak.top - vak.height / 2) / (vak.height / 2);
      el.style.transition = "";
      el.style.transform = `translate(${dx * 3}px, ${dy * 2.5}px)`;
    },
    onPointerLeave: (e: ReactPointerEvent<HTMLElement>) => {
      const el = e.currentTarget;
      el.style.transition = "transform 0.4s var(--ease-uit)";
      el.style.transform = "translate(0, 0)";
    },
  };
}

export function Knop({ naar, children, variant = "primair", className = "" }: Props) {
  const basis =
    "inline-flex items-center gap-2 rounded-klein px-6 py-3 font-display text-[0.95rem] transition-colors duration-200";
  const handlers = useRef(magnetisch());
  const inhoud = (
    <>
      {children}
      <span aria-hidden="true" className="translate-y-[0.5px] transition-transform duration-200 group-hover/knop:translate-x-0.5">→</span>
    </>
  );
  if (naar.startsWith("http") || naar.startsWith("tel:") || naar.startsWith("mailto:")) {
    return (
      <a href={naar} className={`group/knop ${basis} ${stijlen[variant]} ${className}`} {...handlers.current}>
        {inhoud}
      </a>
    );
  }
  return (
    <Link to={naar} className={`group/knop ${basis} ${stijlen[variant]} ${className}`} {...handlers.current}>
      {inhoud}
    </Link>
  );
}
