import type { ReactNode } from "react";
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

export function Knop({ naar, children, variant = "primair", className = "" }: Props) {
  const basis =
    "inline-flex items-center gap-2 rounded-klein px-6 py-3 font-display text-[0.95rem] transition-colors duration-200";
  const inhoud = (
    <>
      {children}
      <span aria-hidden="true" className="translate-y-[0.5px] transition-transform duration-200 group-hover/knop:translate-x-0.5">→</span>
    </>
  );
  if (naar.startsWith("http") || naar.startsWith("tel:") || naar.startsWith("mailto:")) {
    return (
      <a href={naar} className={`group/knop ${basis} ${stijlen[variant]} ${className}`}>
        {inhoud}
      </a>
    );
  }
  return (
    <Link to={naar} className={`group/knop ${basis} ${stijlen[variant]} ${className}`}>
      {inhoud}
    </Link>
  );
}
