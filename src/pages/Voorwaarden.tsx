import { VOORWAARDEN } from "../content/nl/voorwaarden";
import { Kruimelpad } from "../components/site/Kruimelpad";

export function Voorwaarden() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8">
      <Kruimelpad items={[{ naam: "Algemene voorwaarden" }]} />
      <article className="max-w-3xl pb-20 pt-10 md:pt-14">
        <h1 className="text-4xl leading-[1.1] md:text-5xl">Algemene voorwaarden</h1>
        <div className="mt-10 space-y-4 text-[0.95rem] leading-relaxed text-zacht">
          {VOORWAARDEN.map((alinea, i) => (
            <p key={i}>{alinea}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
