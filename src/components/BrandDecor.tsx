export function BrandDecor() {
  return (
    <div className="brand-decor" aria-hidden="true">
      <div
        className="decor-blob"
        style={{ width: 220, height: 220, top: -60, insetInlineEnd: -70, background: "var(--violet-700)", opacity: 0.12, animationDelay: "-3s" }}
      />
      <div
        className="decor-blob"
        style={{ width: 180, height: 180, bottom: -50, insetInlineStart: -60, background: "var(--teal-700)", opacity: 0.14, animationDelay: "-1.5s" }}
      />
      <div className="decor-dots" style={{ top: 90, insetInlineEnd: 30, color: "var(--ink-faint)" }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="decor-chevrons" style={{ bottom: 60, insetInlineStart: 34, color: "var(--teal-900)", fontSize: 20 }}>
        <span>›</span>
        <span>›</span>
        <span>›</span>
      </div>
    </div>
  );
}
