const colors = ["var(--teal-700)", "var(--violet-500)", "var(--amber-600)", "var(--coral-600)"];

export function Confetti({ count = 26 }: { count?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = Math.round((i / count) * 100 + (Math.random() * 6 - 3));
    const delay = Math.random() * 0.6;
    const size = 5 + Math.round(Math.random() * 4);
    const color = colors[i % colors.length];
    const rotate = Math.round(Math.random() * 360);
    return { left, delay, size, color, rotate, id: i };
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            insetInlineStart: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
