import { Link } from "react-router-dom";
import { ARTIKELEN } from "../content/nl/kennisbank";
import { Reveal } from "../components/ui/Reveal";
import { Kruimelpad } from "../components/site/Kruimelpad";
import { CtaSectie } from "../components/site/CtaSectie";

export function Kennisbank() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
        <Kruimelpad items={[{ naam: "Kennisbank" }]} />
        <div className="max-w-3xl pb-10 pt-10 md:pt-14">
          <p className="kicker mb-3">Kennisbank</p>
          <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">Hoe werkt het eigenlijk?</h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Heldere antwoorden op de vragen die klanten ons echt stellen: over techniek, kosten en keuzes. Geen verkooppraat, wel uitleg.
          </p>
        </div>
        <ul className="grid gap-4 pb-20 md:grid-cols-2">
          {ARTIKELEN.map((a, i) => (
            <Reveal as="li" key={a.slug} vertraging={i * 50}>
              <Link
                to={`/kennisbank/${a.slug}`}
                className="group flex h-full flex-col rounded-kaart border border-lijn bg-nacht p-6 transition-colors hover:border-accent/60"
              >
                <h2 className="font-display text-xl font-medium leading-snug">{a.kop}</h2>
                <p className="mt-3 flex-1 leading-relaxed text-zacht">{a.antwoord.split(". ").slice(0, 2).join(". ")}.</p>
                <p className="mt-5 font-display text-[0.9rem] font-medium text-accent">
                  Lees het antwoord <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                </p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
      <CtaSectie
        kop="Vraag niet beantwoord?"
        tekst="Stel hem direct aan ons team; we antwoorden snel en eerlijk, ook als de conclusie is dat u iets niet nodig heeft."
      />
    </>
  );
}
