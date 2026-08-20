import { KLANTLOGOS } from "../../data/site";
import { Beeld } from "../ui/Beeld";

// Referentiebalk met klantlogo's. Alle logo's horen bij projecten die op
// deze site staan.
export function LogoBalk() {
  return (
    <div aria-label="Een selectie van onze opdrachtgevers" role="group" className="border-y border-lijn bg-nacht/60">
      <ul className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-7 md:justify-between md:px-8">
        {KLANTLOGOS.map((logo) => (
          <li key={logo.alt}>
            <Beeld src={logo.src} alt={logo.alt} className="logo-klant h-9 w-auto max-w-[7.5rem] object-contain md:h-10" />
          </li>
        ))}
      </ul>
    </div>
  );
}
