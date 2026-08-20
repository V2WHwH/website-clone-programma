import { SITE } from "../data/site";
import { Reveal } from "../components/ui/Reveal";
import { Formulier } from "../components/site/Formulier";
import { Kruimelpad } from "../components/site/Kruimelpad";

export function Contact() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
      <Kruimelpad items={[{ naam: "Contact" }]} />
      <div className="grid gap-14 pb-20 pt-10 md:grid-cols-[1fr_1.2fr] md:pt-14">
        <div>
          <p className="kicker mb-3">Contact</p>
          <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">Bespreek uw project</h1>
          <p className="mt-5 text-lg leading-relaxed text-zacht">
            Bel, mail of kom langs in de showroom: we denken graag mee, van eerste idee tot concreet plan.
          </p>

          <dl className="mt-10 space-y-6">
            <div>
              <dt className="font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof">Telefoon</dt>
              <dd className="mt-2 space-y-1">
                <p>
                  <a href={`tel:${SITE.telefoon.algemeen.tel}`} className="text-lg transition-colors hover:text-accent">
                    {SITE.telefoon.algemeen.label}
                  </a>
                  <span className="ml-2 text-[0.9rem] text-dof">algemeen</span>
                </p>
                <p className="text-[0.95rem] text-zacht">
                  {SITE.telefoon.desmond.naam}: <a href={`tel:${SITE.telefoon.desmond.tel}`} className="transition-colors hover:text-accent">{SITE.telefoon.desmond.label}</a>
                </p>
                <p className="text-[0.95rem] text-zacht">
                  {SITE.telefoon.ronald.naam}: <a href={`tel:${SITE.telefoon.ronald.tel}`} className="transition-colors hover:text-accent">{SITE.telefoon.ronald.label}</a>
                </p>
              </dd>
            </div>
            <div>
              <dt className="font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof">E-mail</dt>
              <dd className="mt-2">
                <a href={`mailto:${SITE.email}`} className="text-lg transition-colors hover:text-accent">{SITE.email}</a>
              </dd>
            </div>
            <div>
              <dt className="font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof">Showroom & bezoekadres</dt>
              <dd className="mt-2 text-zacht">
                <address className="not-italic leading-relaxed">
                  {SITE.adres.straat}
                  <br />
                  {SITE.adres.postcode} {SITE.adres.plaats}
                </address>
                <p className="mt-2 text-[0.9rem]">
                  Bezoek op afspraak. In de showroom demonstreren we vrijwel alle oplossingen, inclusief het 9 meter lange holografische scherm.
                </p>
              </dd>
            </div>
            <div>
              <dt className="font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof">Gegevens</dt>
              <dd className="mt-2 text-[0.9rem] text-zacht">
                {SITE.juridischeNaam} · KvK {SITE.kvk}
              </dd>
            </div>
          </dl>
        </div>

        <Reveal vertraging={80}>
          <div className="rounded-kaart border border-lijn bg-nacht p-6 md:p-8">
            <h2 className="text-xl font-medium">Stuur een bericht</h2>
            <p className="mb-6 mt-2 text-[0.95rem] text-zacht">We reageren doorgaans binnen één werkdag.</p>
            <Formulier naam="contact" knoptekst="Verstuur bericht" />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
