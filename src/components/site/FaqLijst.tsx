import type { Faq } from "../../content/types";

// Toegankelijke FAQ met native details/summary: werkt zonder JavaScript,
// met toetsenbord en screenreader.
export function FaqLijst({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-lijn border-y border-lijn">
      {items.map((f) => (
        <details key={f.vraag} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[1.05rem] font-medium [&::-webkit-details-marker]:hidden">
            {f.vraag}
            <span
              aria-hidden="true"
              className="shrink-0 text-accent transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="max-w-3xl pb-5 leading-relaxed text-zacht">{f.antwoord}</p>
        </details>
      ))}
    </div>
  );
}
