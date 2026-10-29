import { Knop } from "../components/ui/Knop";
import { SfeerShader } from "../components/site/SfeerShader";

export function NietGevonden() {
  return (
    <div className="relative overflow-hidden">
      <SfeerShader className="opacity-70" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start px-5 py-24 md:px-8 md:py-32">
        <p className="glitch-404 font-display text-[5.5rem] font-black leading-none text-accent md:text-[8rem]" aria-hidden="true">
          404
        </p>
        <p className="kicker mb-3 mt-6">Niet gevonden</p>
        <h1 className="text-4xl leading-[1.1] md:text-5xl">Deze pagina bestaat niet (meer)</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-zacht">
          Het adres klopt niet of de pagina is verplaatst. Zoek hieronder verder, of ga direct naar wat u zocht.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("snelzoeken:open"))}
            className="group/knop inline-flex items-center gap-2 rounded-klein bg-accent px-6 py-3 font-display text-[0.95rem] font-medium text-inkt transition-colors duration-200 hover:bg-accent-fel"
          >
            Zoek op de site
            <kbd className="rounded border border-inkt/30 bg-inkt/10 px-1.5 py-0.5 font-mono text-[0.7rem]">⌘K</kbd>
          </button>
          <Knop naar="/producten" variant="secundair">Bekijk producten</Knop>
          <Knop naar="/projecten" variant="secundair">Bekijk projecten</Knop>
          <Knop naar="/contact" variant="secundair">Contact</Knop>
        </div>
      </div>
    </div>
  );
}
