import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { HOOFDNAV } from "../../data/site";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState(false);
  const locatie = useLocation();

  // menu sluiten bij navigatie
  useEffect(() => setOpen(false), [locatie.pathname]);

  // scroll vergrendelen wanneer het mobiele menu open is
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-lijn bg-inkt/85 backdrop-blur-md">
      <a href="#inhoud" className="skiplink">Naar inhoud</a>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 md:px-8">
        <Link to="/" aria-label="Vision2Watch home" className="shrink-0">
          <Logo className="text-[1.05rem]" />
        </Link>

        <nav aria-label="Hoofdmenu" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {HOOFDNAV.map((item) => (
              <li key={item.pad}>
                <NavLink
                  to={item.pad}
                  className={({ isActive }) =>
                    `text-[0.92rem] transition-colors duration-200 hover:text-tekst ${isActive ? "text-tekst" : "text-zacht"}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
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
        <nav id="mobiel-menu" aria-label="Mobiel menu" className="border-t border-lijn bg-inkt lg:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-4">
            {HOOFDNAV.map((item) => (
              <li key={item.pad} className="border-b border-lijn last:border-0">
                <NavLink
                  to={item.pad}
                  className={({ isActive }) =>
                    `block py-3.5 text-lg ${isActive ? "text-accent" : "text-tekst"}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="flex gap-3 pt-4">
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
