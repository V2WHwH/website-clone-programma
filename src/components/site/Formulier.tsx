import { useState } from "react";
import { Link } from "react-router-dom";
import { PRODUCTEN } from "../../content/nl/producten";

type Props = {
  naam: "contact" | "prijslijst";
  knoptekst: string;
  toonInteresse?: boolean;
};

// Formulier met browservalidatie en duidelijke foutmeldingen. Verstuurt
// naar Netlify Forms wanneer de site daar draait; voor andere hosting is
// een endpoint nodig (zie docs/deployment.md). Vraagt niet meer dan nodig.
export function Formulier({ naam, knoptekst, toonInteresse = false }: Props) {
  const [fout, setFout] = useState<string | null>(null);

  return (
    <form
      name={naam}
      method="POST"
      action="/bedankt"
      data-netlify="true"
      netlify-honeypot="bedrijfsnaam-2"
      className="max-w-xl space-y-5"
      onInvalid={() => setFout("Controleer de rood gemarkeerde velden en probeer opnieuw.")}
      onSubmit={() => setFout(null)}
    >
      <input type="hidden" name="form-name" value={naam} />
      <p className="hidden">
        <label>Laat dit veld leeg: <input name="bedrijfsnaam-2" /></label>
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${naam}-naam`} className="mb-1.5 block text-[0.9rem] text-zacht">
            Naam <span aria-hidden="true" className="text-accent">*</span>
          </label>
          <input
            id={`${naam}-naam`}
            name="naam"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst placeholder:text-dof invalid:[&:user-invalid]:border-red-400"
          />
        </div>
        <div>
          <label htmlFor={`${naam}-bedrijf`} className="mb-1.5 block text-[0.9rem] text-zacht">
            Bedrijf
          </label>
          <input
            id={`${naam}-bedrijf`}
            name="bedrijf"
            type="text"
            autoComplete="organization"
            className="w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${naam}-email`} className="mb-1.5 block text-[0.9rem] text-zacht">
            E-mailadres <span aria-hidden="true" className="text-accent">*</span>
          </label>
          <input
            id={`${naam}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst invalid:[&:user-invalid]:border-red-400"
          />
        </div>
        <div>
          <label htmlFor={`${naam}-telefoon`} className="mb-1.5 block text-[0.9rem] text-zacht">
            Telefoon
          </label>
          <input
            id={`${naam}-telefoon`}
            name="telefoon"
            type="tel"
            autoComplete="tel"
            className="w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst"
          />
        </div>
      </div>

      {toonInteresse && (
        <div>
          <label htmlFor={`${naam}-interesse`} className="mb-1.5 block text-[0.9rem] text-zacht">
            Waarin bent u geïnteresseerd?
          </label>
          <select
            id={`${naam}-interesse`}
            name="interesse"
            className="w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst"
            defaultValue=""
          >
            <option value="">Maak een keuze (optioneel)</option>
            {PRODUCTEN.map((p) => (
              <option key={p.slug} value={p.naam}>{p.kaartLabel ?? p.naam}</option>
            ))}
            <option value="Anders / advies">Anders / advies</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor={`${naam}-bericht`} className="mb-1.5 block text-[0.9rem] text-zacht">
          {naam === "prijslijst" ? "Toelichting (optioneel)" : "Waarmee kunnen we helpen?"}
          {naam === "contact" && <span aria-hidden="true" className="text-accent"> *</span>}
        </label>
        <textarea
          id={`${naam}-bericht`}
          name="bericht"
          rows={5}
          required={naam === "contact"}
          className="w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst invalid:[&:user-invalid]:border-red-400"
        />
      </div>

      {fout && (
        <p role="alert" className="rounded-klein border border-red-400/40 bg-red-400/10 px-4 py-3 text-[0.9rem] text-red-200">
          {fout}
        </p>
      )}

      <button
        type="submit"
        className="rounded-klein bg-accent px-7 py-3.5 font-display font-medium text-inkt transition-colors hover:bg-accent-fel"
      >
        {knoptekst}
      </button>
      <p className="text-[0.85rem] leading-relaxed text-dof">
        Uw gegevens gebruiken we alleen om uw aanvraag te beantwoorden. Meer hierover staat in de{" "}
        <Link to="/privacy" className="text-zacht underline underline-offset-2 transition-colors hover:text-accent">
          privacyverklaring
        </Link>
        .
      </p>
    </form>
  );
}
