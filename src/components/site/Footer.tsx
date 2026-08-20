import { Link } from "react-router-dom";
import { HOOFDNAV, SITE } from "../../data/site";
import { PRODUCTEN } from "../../content/nl/producten";
import { Logo } from "./Logo";

const FOOTER_PRODUCTEN = ["interactieve-vloer", "hologram-projectie", "interactieve-etalage", "touchscreens", "led-displays", "virtual-host"];

export function Footer() {
  return (
    <footer className="border-t border-lijn bg-nacht">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
        {/* minmax(0,…): zonder die 0 krimpt een kolom niet onder de breedte van
            haar langste woord, waardoor een lang e-mailadres het raster op
            tabletbreedte breder maakt dan het scherm. */}
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <Logo className="text-lg" />
            <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-zacht">
              Interactieve audiovisuele oplossingen: van hologram tot interactieve vloer, van concept en content tot installatie en service.
            </p>
            <ul className="mt-6 flex gap-4">
              {SITE.socials.map((s) => (
                <li key={s.naam}>
                  <a href={s.url} rel="noopener" className="text-[0.9rem] text-zacht transition-colors hover:text-accent">
                    {s.naam}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer: menu">
            <h2 className="font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof">Menu</h2>
            <ul className="mt-4 space-y-2.5">
              {HOOFDNAV.map((i) => (
                <li key={i.pad}>
                  <Link to={i.pad} className="text-[0.95rem] text-zacht transition-colors hover:text-tekst">
                    {i.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/prijslijst" className="text-[0.95rem] text-zacht transition-colors hover:text-tekst">
                  Prijslijst aanvragen
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Footer: producten">
            <h2 className="font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof">Producten</h2>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_PRODUCTEN.map((slug) => {
                const p = PRODUCTEN.find((x) => x.slug === slug);
                if (!p) return null;
                return (
                  <li key={slug}>
                    <Link to={`/producten/${slug}`} className="text-[0.95rem] text-zacht transition-colors hover:text-tekst">
                      {p.kaartLabel ?? p.naam}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof">Contact</h2>
            <address className="mt-4 space-y-2.5 not-italic text-[0.95rem] text-zacht">
              <p>
                {SITE.adres.straat}
                <br />
                {SITE.adres.postcode} {SITE.adres.plaats}
              </p>
              <p>
                <a href={`tel:${SITE.telefoon.algemeen.tel}`} className="transition-colors hover:text-tekst">
                  {SITE.telefoon.algemeen.label}
                </a>
              </p>
              <p>
                <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-tekst">
                  {SITE.email}
                </a>
              </p>
              <p className="pt-2 text-[0.85rem] text-dof">
                KvK {SITE.kvk}
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-lijn pt-6 text-[0.85rem] text-dof md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.juridischeNaam}</p>
          <ul className="flex gap-5">
            <li><Link to="/privacy" className="transition-colors hover:text-zacht">Privacy</Link></li>
            <li><Link to="/algemene-voorwaarden" className="transition-colors hover:text-zacht">Algemene voorwaarden</Link></li>
            <li><a href="https://www.hereweholo.nl" rel="noopener" className="transition-colors hover:text-zacht">HEREweHOLO</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
