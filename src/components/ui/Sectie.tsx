import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type Props = {
  kicker?: string;
  kop?: string;
  lead?: string;
  children?: ReactNode;
  className?: string;
  /** koppen op h2-niveau tenzij anders */
  kopNiveau?: "h2" | "h3";
  id?: string;
};

// Vaste sectie-opbouw: kicker, kop, lead, inhoud. Houdt ritme en
// koppenhiërarchie consistent over de hele site.
export function Sectie({ kicker, kop, lead, children, className = "", kopNiveau = "h2", id }: Props) {
  const Kop = kopNiveau;
  return (
    <section id={id} className={`py-20 md:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        {(kicker || kop) && (
          <Reveal className="max-w-3xl">
            {kicker && <p className="kicker mb-3">{kicker}</p>}
            {kop && <Kop className="text-3xl font-medium md:text-[2.6rem] md:leading-[1.1]">{kop}</Kop>}
            {lead && <p className="mt-5 text-lg leading-relaxed text-zacht">{lead}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
