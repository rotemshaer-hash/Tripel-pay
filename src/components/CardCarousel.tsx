import { useEffect, useRef, useState, type ReactNode } from "react";

export function CardCarousel({ items }: { items: ReactNode[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActive(idx);
          }
        }
      },
      { root: track, threshold: 0.6 }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length]);

  return (
    <div style={{ margin: "20px 0 0" }}>
      <div ref={trackRef} className="card-carousel-track" style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", padding: "0 20px" }}>
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            style={{ flex: "0 0 auto", width: 220, scrollSnapAlign: "center" }}
          >
            {item}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 10 }}>
          {items.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === active ? 16 : 6,
                height: 6,
                borderRadius: 999,
                background: i === active ? "var(--violet-700)" : "var(--line)",
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
