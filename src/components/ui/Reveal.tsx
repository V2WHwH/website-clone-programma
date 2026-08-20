import { useEffect, useRef, type ReactNode } from "react";

// Voegt de reveal-animatie toe zodra het element in beeld komt. De CSS werkt
// alleen wanneer <html> de klasse "js" heeft en reduced motion uit staat;
// zonder JavaScript is alles direct zichtbaar.
export function Reveal({ children, vertraging = 0, as: Tag = "div", className = "" }: {
  children: ReactNode;
  vertraging?: number;
  as?: "div" | "li" | "section" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("zichtbaar");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} className={`reveal ${className}`} style={vertraging ? { transitionDelay: `${vertraging}ms` } : undefined}>
      {children}
    </Tag>
  );
}
