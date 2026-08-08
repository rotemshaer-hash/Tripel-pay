import type { ExtraCard } from "../data/types";
import { cardIcons, categoryLabels, categoryCardColor } from "../data/extraCardStyle";

export function ExtraCardVisual({ card, onClick }: { card: ExtraCard; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      style={{
        borderRadius: 18,
        padding: "16px 18px",
        background: categoryCardColor[card.category],
        boxShadow: "var(--shadow-card-solid)",
        minHeight: 96,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#ffffff", letterSpacing: "0.03em", opacity: 0.85 }}>
          {categoryLabels[card.category]}
        </span>
        <div style={{ color: "#ffffff", opacity: 0.9 }}>{cardIcons[card.category]}</div>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {card.name}
      </div>
    </div>
  );
}
