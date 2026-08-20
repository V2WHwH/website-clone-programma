import { Link } from "react-router-dom";
import type { Product, Project, Sector } from "../../content/types";
import { Beeld } from "../ui/Beeld";

// Kaartcomponenten voor producten, projecten en sectoren: beeldgedreven,
// hairline-kaders, subtiele zoom bij hover.

export function ProductKaart({ product, sizes }: { product: Product; sizes?: string }) {
  return (
    <Link
      to={`/producten/${product.slug}`}
      className="kaart group block overflow-hidden rounded-kaart border border-lijn bg-nacht transition-colors duration-200 hover:border-accent/60"
    >
      <div className="kaart-beeld aspect-[4/3] overflow-hidden">
        <Beeld src={product.beeld.src} alt={product.beeld.alt} className="h-full w-full object-cover" sizes={sizes} />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <span className="font-display text-[1rem] font-medium">{product.kaartLabel ?? product.naam}</span>
        <span aria-hidden="true" className="text-accent transition-transform duration-200 group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}

export function ProjectKaart({ project, sizes }: { project: Project; sizes?: string }) {
  return (
    <Link
      to={`/projecten/${project.slug}`}
      className="kaart group block overflow-hidden rounded-kaart border border-lijn bg-nacht transition-colors duration-200 hover:border-accent/60"
    >
      <div className="kaart-beeld aspect-[3/2] overflow-hidden">
        <Beeld src={project.beeld.src} alt={project.beeld.alt} className="h-full w-full object-cover" sizes={sizes} />
      </div>
      <div className="px-4 py-4">
        <p className="kicker !text-[0.7rem]">{project.klant}</p>
        <p className="mt-1.5 font-display text-[1.05rem] font-medium leading-snug">{project.titel}</p>
      </div>
    </Link>
  );
}

export function SectorKaart({ sector }: { sector: Sector }) {
  return (
    <Link
      to={`/toepassingen/${sector.slug}`}
      className="kaart group block overflow-hidden rounded-kaart border border-lijn bg-nacht transition-colors duration-200 hover:border-accent/60"
    >
      <div className="kaart-beeld aspect-[16/9] overflow-hidden">
        <Beeld src={sector.beeld.src} alt={sector.beeld.alt} className="h-full w-full object-cover" />
      </div>
      <div className="px-4 py-4">
        <p className="font-display text-[1.1rem] font-medium">{sector.naam}</p>
        <p className="mt-1.5 line-clamp-2 text-[0.92rem] leading-relaxed text-zacht">{sector.intro}</p>
      </div>
    </Link>
  );
}
