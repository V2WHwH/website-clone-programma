import { SITE } from "../data/site";
import { Kruimelpad } from "../components/site/Kruimelpad";

// Beschrijft wat deze site nú doet (kennisbankregel 8): geen tracking,
// geen advertentiecookies, zelf-gehoste fonts, formulieren alleen voor
// het beantwoorden van aanvragen.
export function Privacy() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
      <Kruimelpad items={[{ naam: "Privacy" }]} />
      <article className="max-w-3xl pb-20 pt-10 md:pt-14">
        <h1 className="text-4xl font-medium leading-[1.1] md:text-5xl">Privacyverklaring</h1>
        <p className="mt-4 text-[0.9rem] text-dof">Van toepassing op www.vision2watch.nl · versie augustus 2026</p>

        <section className="mt-10 space-y-4 leading-relaxed text-zacht">
          <p>
            Deze verklaring beschrijft hoe {SITE.juridischeNaam} (KvK {SITE.kvk}, {SITE.adres.straat}, {SITE.adres.postcode} {SITE.adres.plaats}) omgaat met persoonsgegevens op deze website. Vragen hierover kunt u stellen via{" "}
            <a href={`mailto:${SITE.email}`} className="text-tekst underline decoration-lijn underline-offset-4 hover:decoration-accent">{SITE.email}</a> of {SITE.telefoon.algemeen.label}.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-medium">Welke gegevens we verwerken</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-zacht">
            <p>
              <strong className="text-tekst">Formulieren.</strong> Vult u het contact- of prijslijstformulier in, dan verwerken we de gegevens die u zelf opgeeft: naam, e-mailadres en eventueel bedrijfsnaam, telefoonnummer en uw bericht. We gebruiken deze gegevens uitsluitend om uw aanvraag te beantwoorden en bewaren ze niet langer dan daarvoor nodig is.
            </p>
            <p>
              <strong className="text-tekst">Servergegevens.</strong> Zoals bij vrijwel elke website registreert de server waarop deze site draait technische gegevens zoals IP-adres, browsertype en opgevraagde pagina's, ten behoeve van beveiliging en het functioneren van de site.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-medium">Wat we niet doen</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-zacht">
            <p>
              Deze website plaatst geen advertentie- of trackingcookies en gebruikt geen statistiekendiensten van derden. Lettertypen worden vanaf onze eigen server geladen; er worden bij het bekijken van pagina's geen gegevens met externe partijen gedeeld. Wordt dat in de toekomst anders, bijvoorbeeld door het toevoegen van een meetinstrument, dan wordt deze verklaring daarop aangepast en wordt waar nodig eerst om toestemming gevraagd.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-medium">Uw rechten</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-zacht">
            <p>
              U heeft het recht op inzage, correctie en verwijdering van uw persoonsgegevens, en het recht om bezwaar te maken tegen de verwerking of deze te beperken. Neem daarvoor contact op via {SITE.email}. Bent u niet tevreden over de afhandeling, dan kunt u een klacht indienen bij de Autoriteit Persoonsgegevens.
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
