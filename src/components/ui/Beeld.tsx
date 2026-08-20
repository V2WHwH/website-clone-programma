import { BEELDMATEN } from "../../data/beeldmaten";

type Props = {
  src: string;
  alt: string;
  /** eager alleen voor het LCP-beeld boven de vouw */
  prioriteit?: boolean;
  className?: string;
  sizes?: string;
};

// Elk beeld krijgt width/height (geen layoutverschuiving) en lazy loading,
// behalve het LCP-beeld dat eager + fetchpriority=high laadt.
export function Beeld({ src, alt, prioriteit = false, className, sizes }: Props) {
  const maat = BEELDMATEN[src];
  const varianten = [
    [src.replace(/\.webp$/, "-640.webp"), 640],
    [src.replace(/\.webp$/, "-1024.webp"), 1024],
  ].filter(([v]) => BEELDMATEN[v as string]) as [string, number][];
  const srcSet = varianten.length
    ? [...varianten.map(([v, w]) => `${v} ${w}w`), `${src} ${maat?.[0] ?? 1200}w`].join(", ")
    : undefined;
  return (
    <img
      src={src}
      srcSet={srcSet}
      alt={alt}
      width={maat?.[0]}
      height={maat?.[1]}
      loading={prioriteit ? "eager" : "lazy"}
      fetchPriority={prioriteit ? "high" : undefined}
      decoding={prioriteit ? undefined : "async"}
      sizes={sizes}
      className={className}
    />
  );
}
