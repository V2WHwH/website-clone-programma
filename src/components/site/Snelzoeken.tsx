import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zoek, ZOEK_SNELKOPPELINGEN, type ZoekResultaat } from "../../content/zoekindex";

// Sitebrede snelzoekfunctie: Cmd/Ctrl+K opent een overlay waarin producten,
// toepassingen, projecten en kennisbankartikelen in één keer doorzoekbaar
// zijn. Bij 18 producten, 6 toepassingen, 24 projecten en 10 artikelen is
// "waar staat dit ook alweer" een reëel probleem; dit lost het in één
// toetsaanslag op, naast de gewone menu's die intact blijven.
//
// Puur client-side en progressief: zonder JavaScript bestaat deze laag niet
// en werkt de site verder precies zoals zonder. Met JavaScript meldt een
// knop in de header 'm aan wie niet weet dat Cmd+K bestaat.
export function Snelzoeken() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [actief, setActief] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const beschrijvingId = useId();

  const groepen = useMemo(() => zoek(query), [query]);
  const platteLijst = useMemo(() => groepen.flatMap((g) => g.resultaten), [groepen]);

  const sluit = () => {
    setOpen(false);
    setQuery("");
    setActief(0);
    // Focus terug naar waar de bezoeker vandaan kwam, niet verweesd op body.
    triggerRef.current?.focus();
  };

  useEffect(() => {
    const bijToets = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          sluit();
        } else {
          triggerRef.current = document.activeElement as HTMLElement | null;
          setOpen(true);
        }
        return;
      }
      // Window-niveau, niet alleen op het invoerveld: anders sluit Escape
      // niet in het korte moment vlak na openen, voordat de focus er is
      // (en evenmin als een bezoeker per ongeluk ergens anders in de
      // dialoog focust).
      if (open && e.key === "Escape") {
        e.preventDefault();
        sluit();
      }
    };
    window.addEventListener("keydown", bijToets);
    const bijOpenEvent = () => {
      triggerRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener("snelzoeken:open", bijOpenEvent);
    return () => {
      window.removeEventListener("keydown", bijToets);
      window.removeEventListener("snelzoeken:open", bijOpenEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = "hidden";
      // wacht op de eerste paint van de dialoog voordat focus verplaatst
      const t = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(t);
    }
    document.documentElement.style.overflow = "";
  }, [open]);

  useEffect(() => setActief(0), [query]);

  const naarResultaat = (r: ZoekResultaat) => {
    sluit();
    navigate(r.pad);
  };

  const bijToetsIn = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      sluit();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActief((i) => Math.min(i + 1, Math.max(platteLijst.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActief((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = platteLijst[actief];
      if (r) naarResultaat(r);
    }
  };

  if (!open) return null;

  let doorlopendeIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-inkt/70 px-4 pt-[12vh] backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) sluit();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Snel zoeken"
        aria-describedby={beschrijvingId}
        className="shader-in w-full max-w-xl overflow-hidden rounded-kaart border border-lijn bg-nacht shadow-2xl shadow-black/60"
      >
        <div className="flex items-center gap-3 border-b border-lijn px-5 py-4">
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-dof">
            <circle cx="8.5" cy="8.5" r="6" />
            <path d="M17 17l-4-4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={bijToetsIn}
            placeholder="Zoek producten, toepassingen, projecten of kennisbank…"
            aria-label="Zoeken"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-[1rem] text-tekst placeholder:text-dof focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-lijn px-1.5 py-0.5 font-mono text-[0.7rem] text-dof sm:block">esc</kbd>
        </div>

        <p id={beschrijvingId} className="sr-only">
          Typ om te zoeken. Gebruik de pijltjestoetsen om een resultaat te selecteren en Enter om ernaartoe te gaan.
        </p>

        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          {query.trim().length < 2 ? (
            <div className="px-3 py-2">
              <p className="kicker mb-2 !text-[0.68rem]">Snel naartoe</p>
              <ul>
                {ZOEK_SNELKOPPELINGEN.map((s) => (
                  <li key={s.pad}>
                    <button
                      type="button"
                      onClick={() => naarResultaat({ type: "product", label: s.label, pad: s.pad, trefwoorden: "" })}
                      className="flex w-full items-center justify-between gap-3 rounded-klein px-3 py-2.5 text-left text-[0.95rem] text-zacht transition-colors hover:bg-nevel hover:text-tekst"
                    >
                      {s.label}
                      <span aria-hidden="true" className="text-dof">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : groepen.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-zacht">Geen resultaten voor “{query}”.</p>
              <button
                type="button"
                onClick={() => naarResultaat({ type: "product", label: "Contact", pad: "/contact", trefwoorden: "" })}
                className="navlink mt-3 inline-flex font-display text-[0.9rem] font-medium text-accent"
              >
                Stel uw vraag direct →
              </button>
            </div>
          ) : (
            groepen.map((groep) => (
              <div key={groep.type} className="px-3 py-2">
                <p className="kicker mb-1 !text-[0.68rem]">{groep.label}</p>
                <ul>
                  {groep.resultaten.map((r) => {
                    doorlopendeIndex += 1;
                    const index = doorlopendeIndex;
                    return (
                      <li key={r.pad}>
                        <button
                          type="button"
                          onMouseEnter={() => setActief(index)}
                          onClick={() => naarResultaat(r)}
                          className={`block w-full rounded-klein px-3 py-2.5 text-left transition-colors ${
                            index === actief ? "bg-nevel text-tekst" : "text-zacht hover:bg-nevel hover:text-tekst"
                          }`}
                        >
                          <span className="font-display text-[0.95rem] font-medium">{r.label}</span>
                          {r.sub && <span className="mt-0.5 line-clamp-1 block text-[0.82rem] text-dof">{r.sub}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** Trigger-knop voor header en mobiel menu: dispatcht alleen een event,
 *  zodat Snelzoeken zelf de enige plek met state blijft. */
export function SnelzoekenKnop({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("snelzoeken:open"))}
      className={className}
      aria-label="Zoeken (Cmd of Ctrl+K)"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8.5" cy="8.5" r="6" />
        <path d="M17 17l-4-4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
