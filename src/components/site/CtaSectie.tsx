import { Knop } from "../ui/Knop";
import { Reveal } from "../ui/Reveal";
import { SITE } from "../../data/site";
import { Sfeerlaag } from "./Sfeerlaag";

type Props = {
  kop?: string;
  tekst?: string;
  primair?: { label: string; naar: string };
  secundair?: { label: string; naar: string };
};

// Afsluitende conversiesectie, per pagina in te vullen met de logische
// vervolgstap. Standaard: project bespreken of prijslijst aanvragen.
export function CtaSectie({
  kop = "Klaar om uw ruimte te laten reageren?",
  tekst = `Bespreek uw idee met ons team of vraag de actuele prijslijst aan. Bellen kan direct: ${SITE.telefoon.algemeen.label}.`,
  primair = { label: "Bespreek uw project", naar: "/contact" },
  secundair = { label: "Prijslijst aanvragen", naar: "/prijslijst" },
}: Props) {
  return (
    <section className="relative overflow-hidden border-t border-lijn bg-nacht">
      <Sfeerlaag src="/media/video/sfeer-lichtbundels.mp4" poster="/media/video/sfeer-lichtbundels-poster.webp" />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-24">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl">{kop}</h2>
          <p className="mt-4 text-lg leading-relaxed text-zacht">{tekst}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Knop naar={primair.naar}>{primair.label}</Knop>
            <Knop naar={secundair.naar} variant="secundair">{secundair.label}</Knop>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
