import type { Child } from "../data/types";
import avatarChild from "../assets/avatar-child.png";

export function ChildCarousel({ children, activeId, onSelect }: { children: Child[]; activeId: string; onSelect: (id: string) => void }) {
  const idx = children.findIndex((c) => c.id === activeId);
  const active = children[idx] ?? children[0];

  function step(dir: 1 | -1) {
    const next = (idx + dir + children.length) % children.length;
    onSelect(children[next].id);
  }

  return (
    <div
      className="glass"
      style={{
        margin: "18px 20px 0",
        borderRadius: "var(--radius-lg)",
        padding: "18px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <button onClick={() => step(-1)} disabled={children.length < 2} style={{ fontSize: 22, color: "var(--teal-900)", background: "none", border: "none", opacity: children.length < 2 ? 0.3 : 1 }}>
        ‹
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <img src={avatarChild} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} />
        <span style={{ fontSize: 16, fontWeight: 800 }}>{active.name}</span>
      </div>
      <button onClick={() => step(1)} disabled={children.length < 2} style={{ fontSize: 22, color: "var(--teal-900)", background: "none", border: "none", opacity: children.length < 2 ? 0.3 : 1 }}>
        ›
      </button>
    </div>
  );
}
