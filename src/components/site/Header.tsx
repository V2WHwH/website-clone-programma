import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { HOOFDNAV } from "../../data/site";
import { CATEGORIEEN } from "../../content/nl/categorieen";
import { PRODUCTEN } from "../../content/nl/producten";
import { SECTOREN } from "../../content/nl/sectoren";
import { leveringLabel } from "../../content/levering";
import { Logo } from "./Logo";

// Menu-onderdelen die een paneel opengeklapt krijgen. De rest is een gewone
// link. Zo staat het hele aanbod één beweging van de bezoeker af, in plaats
// van achter een overzichtspagina.
const PANELEN: Record<string, "producten" | "toepassingen"> = {
  "/producten": "producten",
  "/toepassingen": "toepassingen",
};

export function Header() {
  const [open, setOpen] = useState(false);
  const [paneel, setPaneel] = useState<string | null>(null);
  const sluitTimer = useRef<number | null>(null);
  const locatie = useLocation();

  useEffect(() => { setOpen(false); setPaneel(null); }, [locatie.pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  // Escape sluit het paneel, waar de aandacht ook staat.
  useEffect(() => {
    const bij = (e: KeyboardEvent) => { if (e.key === "Escape") { setPaneel(null); setOpen(false); } };
    window.addEventListener("keydown", bij);
    return () => window.removeEventListener("keydown", bij);
  }, []);

  // Kleine vertraging bij het verlaten: anders klapt het paneel dicht terwijl
  // de muis er schuin naartoe beweegt.
  const houdOpen = (pad: string) => {
    if (sluitTimer.current) window.clearTimeout(sluitTimer.current);
    setPaneel(pad);
  };
  const laatLos = () => {
    if (sluitTimer.current) window.clearTimeout(sluitTimer.current);
    sluitTimer.current = window.setTimeout(() => setPaneel(null), 180);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-lijn bg-inkt/85 backdrop-blur-md">
      <a href="#inhoud" className="skiplink">Naar inhoud</a>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 md:px-8">
        <Link to="/" aria-label="Vision2Watch home" className="shrink-0">
          <Logo className="text-[1.05rem]" />
        </Link>

        <nav aria-label="Hoofdmenu" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {HOOFDNAV.map((item) => {
              const soort = PANELEN[item.pad];
              return (
                <li
                  key={item.pad}
                  onMouseEnter={() => soort && houdOpen(item.pad)}
                  onMouseLeave={() => soort && laatLos()}
                  onFocus={() => soort && houdOpen(item.pad)}
                  onBlur={(e) => {
                    if (soort && !e.currentTarget.contains(e.relatedTarget as Node)) setPaneel(null);
                  }}
                >
                  <NavLink
                    to={item.pad}
                    aria-expanded={soort ? paneel === item.pad : undefined}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1.5 py-5 text-[0.92rem] transition-colors duration-200 hover:text-tekst ${isActive ? "text-tekst" : "text-zacht"}`
                    }
                  >
                    {item.label}
                    {soort && (
                      <svg width="9" height="6" viewBox="0 0 9 6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4"
                        className={`transition-transform duration-200 ${paneel === item.pad ? "rotate-180" : ""}`}>
                        <path d="M1 1.5L4.5 4.5L8 1.5" />
                      </svg>
                    )}
                  </NavLink>

                  {soort && paneel === item.pad && (
                    <div className="absolute inset-x-0 top-16 border-b border-lijn bg-inkt shadow-2xl shadow-black/50">
                      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
                        {soort === "producten" ? (
                          <div className="grid gap-8 md:grid-cols-4">
                            {CATEGORIEEN.map((cat) => (
                              <div key={cat.slug}>
                                <p className="kicker mb-3">{cat.naam}</p>
                                <ul className="space-y-0.5">
                                  {PRODUCTEN.filter((p) => p.categorie === cat.slug).map((p) => (
                                    <li key={p.slug}>
                                      <Link
                                        to={`/producten/${p.slug}`}
                                        className="group/l flex items-baseline justify-between gap-2 rounded-klein py-1.5 text-[0.92rem] text-zacht transition-colors hover:text-tekst"
                                      >
                                        <span>{p.kaartLabel ?? p.naam}</span>
                                        <span className="shrink-0 font-mono text-[0.66rem] uppercase tracking-wide text-dof opacity-0 transition-opacity group-hover/l:opacity-100">
                                          {leveringLabel(p.levering) === "Te koop en te huur" ? "koop · huur" : leveringLabel(p.levering)?.toLowerCase()}
                                        </span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ul className="grid gap-2 md:grid-cols-3">
                            {SECTOREN.map((s) => (
                              <li key={s.slug}>
                                <Link
                                  to={`/toepassingen/${s.slug}`}
                                  className="block rounded-kaart border border-lijn px-4 py-3 transition-colors hover:border-accent/60"
                                >
                                  <span className="font-display text-[1rem] font-medium">{s.naam}</span>
                                  <span className="mt-1 line-clamp-2 block text-[0.88rem] leading-relaxed text-zacht">{s.intro}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/contact"
            className="rounded-klein border border-lijn px-4 py-2 text-[0.9rem] text-tekst transition-colors hover:border-accent hover:text-accent"
          >
            Contact
          </Link>
          <Link
            to="/prijslijst"
            className="rounded-klein bg-accent px-4 py-2 font-display text-[0.9rem] font-medium text-inkt transition-colors hover:bg-accent-fel"
          >
            Prijslijst aanvragen
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-klein border border-lijn lg:hidden"
          aria-expanded={open}
          aria-controls="mobiel-menu"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">{open ? "Menu sluiten" : "Menu openen"}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
            {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M2.5 5.5h15M2.5 10h15M2.5 14.5h15" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobiel-menu" aria-label="Mobiel menu" className="max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-lijn bg-inkt lg:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-2">
            {/* Uitklapbaar met details/summary: dat werkt ook zonder
                JavaScript en wordt door schermlezers als zodanig gemeld. */}
            <li className="border-b border-lijn">
              <details>
                <summary className="flex cursor-pointer items-center justify-between py-3.5 text-lg marker:content-['']">
                  Producten
                  <span aria-hidden="true" className="text-accent">+</span>
                </summary>
                <div className="pb-3">
                  {CATEGORIEEN.map((cat) => (
                    <div key={cat.slug} className="mt-3">
                      <p className="kicker mb-1.5">{cat.naam}</p>
                      <ul>
                        {PRODUCTEN.filter((p) => p.categorie === cat.slug).map((p) => (
                          <li key={p.slug}>
                            <Link to={`/producten/${p.slug}`} className="block py-2 text-[0.98rem] text-zacht">
                              {p.kaartLabel ?? p.naam}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            </li>
            <li className="border-b border-lijn">
              <details>
                <summary className="flex cursor-pointer items-center justify-between py-3.5 text-lg marker:content-['']">
                  Toepassingen
                  <span aria-hidden="true" className="text-accent">+</span>
                </summary>
                <ul className="pb-3">
                  {SECTOREN.map((s) => (
                    <li key={s.slug}>
                      <Link to={`/toepassingen/${s.slug}`} className="block py-2 text-[0.98rem] text-zacht">{s.naam}</Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
            {HOOFDNAV.filter((i) => !PANELEN[i.pad]).map((item) => (
              <li key={item.pad} className="border-b border-lijn">
                <NavLink
                  to={item.pad}
                  className={({ isActive }) => `block py-3.5 text-lg ${isActive ? "text-accent" : "text-tekst"}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="flex gap-3 py-4">
              <Link to="/contact" className="flex-1 rounded-klein border border-lijn px-4 py-3 text-center">
                Contact
              </Link>
              <Link to="/prijslijst" className="flex-1 rounded-klein bg-accent px-4 py-3 text-center font-medium text-inkt">
                Prijslijst
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
