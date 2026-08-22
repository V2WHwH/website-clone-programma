import { Knop } from "../components/ui/Knop";

export function NietGevonden() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-5 py-24 md:px-8 md:py-32">
      <p className="kicker mb-3">404</p>
      <h1 className="text-4xl leading-[1.1] md:text-5xl">Deze pagina bestaat niet (meer)</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-zacht">
        Het adres klopt niet of de pagina is verplaatst. Via onderstaande knoppen vindt u snel wat u zoekt.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Knop naar="/producten">Bekijk producten</Knop>
        <Knop naar="/projecten" variant="secundair">Bekijk projecten</Knop>
        <Knop naar="/contact" variant="secundair">Contact</Knop>
      </div>
    </div>
  );
}
