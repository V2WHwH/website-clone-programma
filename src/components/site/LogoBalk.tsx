import { KLANTLOGOS } from "../../data/site";
import { BEELDMATEN } from "../../data/beeldmaten";
import { Beeld } from "../ui/Beeld";

// Referentiebalk met klantlogo's. Alle logo's horen bij projecten die op
// deze site staan.
//
// Logo's op dezelfde hoogte zetten laat een staand logo (zoals het wapen van
// Escher in het Paleis) veel kleiner ogen dan een liggend woordmerk. Daarom
// krijgt elk logo een hoogte op basis van zijn verhouding, zodat ze optisch
// even zwaar wegen.
const hoogteVoor = (src: string) => {
  const [b, h] = BEELDMATEN[src] ?? [1, 1];
  const verhouding = b / h;
  if (verhouding < 0.9) return "h-14 md:h-16";
  if (verhouding < 1.8) return "h-11 md:h-12";
  return "h-9 md:h-10";
};

export function LogoBalk() {
  return (
    <div aria-label="Een selectie van onze opdrachtgevers" role="group" className="border-y border-lijn bg-nacht/60">
      <ul className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 py-7 md:justify-between md:px-8">
        {KLANTLOGOS.map((logo) => (
          <li key={logo.alt}>
            <Beeld src={logo.src} alt={logo.alt} className={`logo-klant w-auto max-w-[8rem] object-contain ${hoogteVoor(logo.src)}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
