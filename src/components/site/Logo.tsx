// Het Vision2Watch-woordmerk: strak gezet in de display-letter met de
// kenmerkende oranje "2" uit het bestaande merk.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-[0.08em] ${className}`} translate="no">
      VISION<span className="text-accent">2</span>WATCH
    </span>
  );
}
