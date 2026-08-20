import { Link } from "react-router-dom";

export function Kruimelpad({ items }: { items: { naam: string; pad?: string }[] }) {
  return (
    <nav aria-label="Kruimelpad" className="text-[0.85rem] text-dof">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="transition-colors hover:text-zacht">Home</Link>
        </li>
        {items.map((item) => (
          <li key={item.naam} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {item.pad ? (
              <Link to={item.pad} className="transition-colors hover:text-zacht">{item.naam}</Link>
            ) : (
              <span aria-current="page" className="text-zacht">{item.naam}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
