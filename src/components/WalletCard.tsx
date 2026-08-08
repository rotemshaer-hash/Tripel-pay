import { Mascot } from "./Mascot";

export function WalletCard({ holderName, last4 = "5332", onClick }: { holderName: string; last4?: string; onClick?: () => void }) {
  return (
    <div style={{ position: "relative", minWidth: 200 }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "var(--violet-700)",
          opacity: 0.14,
          filter: "blur(24px)",
          top: -30,
          insetInlineStart: -20,
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -16,
          insetInlineEnd: 6,
          zIndex: 2,
          background: "#ffffff",
          borderRadius: "50%",
          padding: 3,
          boxShadow: "var(--shadow-card)",
          transform: "rotate(12deg)",
        }}
      >
        <Mascot size={40} pose="plain" />
      </div>
      <div
        className="shine-sweep"
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
        style={{
          borderRadius: 18,
          padding: "16px 18px",
          background: "var(--amber-600)",
          border: "none",
          boxShadow: "var(--shadow-card-solid)",
          position: "relative",
          zIndex: 1,
          cursor: onClick ? "pointer" : undefined,
        }}
      >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--ink)", letterSpacing: "0.03em" }}>Triple Pay</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.85 }}>
          <path d="M4 14a11 11 0 0 1 16 0" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          <path d="M7.5 17.2a6.5 6.5 0 0 1 9 0" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="20.5" r="1.4" fill="var(--ink)" />
        </svg>
      </div>
      <div
        dir="ltr"
        style={{
          fontFamily: "var(--mono)",
          fontSize: 14,
          letterSpacing: "0.08em",
          color: "var(--ink)",
          opacity: 0.75,
          margin: "16px 0 14px",
        }}
      >
        **** **** **** {last4}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)" }}>{holderName}</span>
      </div>
      </div>
    </div>
  );
}
