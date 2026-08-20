import { Knop } from "../components/ui/Knop";

export function Bedankt() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-5 py-24 md:px-8 md:py-32">
      <p className="kicker mb-3">Ontvangen</p>
      <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">Bedankt voor uw aanvraag</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-zacht">
        Uw bericht is binnen. We reageren doorgaans binnen één werkdag. Kijk in de tussentijd gerust verder bij onze projecten of de kennisbank.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Knop naar="/projecten">Bekijk projecten</Knop>
        <Knop naar="/" variant="secundair">Terug naar home</Knop>
      </div>
    </div>
  );
}
