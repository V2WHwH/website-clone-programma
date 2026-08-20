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
  return (
    <img
      src={src}
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
