import type { TransactionItem } from "../data/types";

/**
 * A single transaction as a floating pill with a glowing directional orb —
 * green rising orb for money in, violet falling orb for money out — instead of
 * a flat bank-statement row divided by hairlines.
 */
export function TransactionRow({ tx }: { tx: TransactionItem }) {
  const positive = tx.amount >= 0;
  const color = positive ? "var(--coral-600)" : "var(--violet-700)";
  return (
    <div
      className="glass"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: "54% 46% 50% 50% / 50% 50% 54% 46%",
          background: color,
          boxShadow: `0 8px 16px -6px ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: positive ? "none" : "rotate(180deg)" }}>
          <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.title}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
          {tx.date}
          {tx.location ? ` · ${tx.location}` : ""}
        </div>
      </div>
      <span className="money" style={{ color, fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
        {positive ? "+" : "-"}
        {Math.abs(tx.amount).toLocaleString("he-IL")}₪
      </span>
    </div>
  );
}
