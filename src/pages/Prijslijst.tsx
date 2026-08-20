import { Reveal } from "../components/ui/Reveal";
import { Formulier } from "../components/site/Formulier";
import { Kruimelpad } from "../components/site/Kruimelpad";

const PUNTEN = [
  "Actuele prijzen voor koop én huur",
  "Alle productcategorieën in één overzicht",
  "Inclusief mogelijkheden voor content op maat",
];

export function Prijslijst() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
      <Kruimelpad items={[{ naam: "Prijslijst" }]} />
      <div className="grid gap-14 pb-20 pt-10 md:grid-cols-[1fr_1.2fr] md:pt-14">
        <div>
          <p className="kicker mb-3">Prijslijst</p>
          <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">Vraag de prijslijst aan</h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Laat uw gegevens achter en ontvang de actuele prijslijst van ons assortiment. Liever direct een indicatie voor een specifiek project? Bel of mail ons; dat gaat vaak sneller.
          </p>
          <ul className="mt-8 space-y-3">
            {PUNTEN.map((p) => (
              <li key={p} className="flex items-start gap-3 text-zacht">
                <span aria-hidden="true" className="mt-0.5 text-accent">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <Reveal vertraging={80}>
          <div className="rounded-kaart border border-lijn bg-nacht p-6 md:p-8">
            <h2 className="text-xl font-medium">Uw gegevens</h2>
            <p className="mb-6 mt-2 text-[0.95rem] text-zacht">U ontvangt de prijslijst per e-mail.</p>
            <Formulier naam="prijslijst" knoptekst="Prijslijst ontvangen" toonInteresse />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
