// A vivid multi-layer organic color-splash backdrop for hero moments (award/celebration
// screens) — several overlapping blurred blobs instead of one flat color fill.
export function SplashBackdrop({ tone = "violet" }: { tone?: "violet" | "teal" }) {
  const a = tone === "violet" ? "var(--violet-700)" : "var(--teal-700)";
  const b = tone === "violet" ? "var(--teal-700)" : "var(--violet-700)";
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: a, opacity: 0.9, top: -110, insetInlineStart: -70, filter: "blur(2px)" }} />
      <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: b, opacity: 0.55, top: -40, insetInlineEnd: -50, filter: "blur(6px)" }} />
      <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", background: "var(--amber-600)", opacity: 0.35, bottom: -60, insetInlineStart: "30%", filter: "blur(10px)" }} />
    </div>
  );
}
