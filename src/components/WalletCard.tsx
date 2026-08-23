import { Mascot } from "./Mascot";
import { IconPiggyBank } from "./Icons";
import { V } from "../data/vocabulary";

export function WalletCard({ holderName, onClick }: { holderName: string; onClick?: () => void }) {
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
        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--ink)", letterSpacing: "0.03em" }}>{V.appName}</span>
        <div style={{ color: "var(--ink)", opacity: 0.75 }}>
          <IconPiggyBank size={20} />
        </div>
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--ink)",
          opacity: 0.75,
          margin: "16px 0 14px",
        }}
      >
        ארנק אישי לחיסכון ודמי כיס
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)" }}>{holderName}</span>
      </div>
      </div>
    </div>
  );
}
