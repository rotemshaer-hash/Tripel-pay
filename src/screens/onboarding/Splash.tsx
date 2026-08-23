import { useNavigate } from "react-router-dom";
import { BrandDecor } from "../../components/BrandDecor";
import { MODE } from "../../data/vocabulary";
import { HeroBanner } from "../../components/Illustrations";

export function Splash() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        overflow: "hidden",
        padding: "24px 24px 40px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          height: "38%",
          background: "var(--header-gradient)",
          clipPath: "polygon(0 0, 100% 0, 100% 62%, 0 100%)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          height: "30%",
          background: "var(--violet-700)",
          opacity: 0.85,
          clipPath: "polygon(0 0, 62% 0, 38% 100%, 0 78%)",
        }}
      />
      <BrandDecor />
      <div style={{ flex: 1 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <HeroBanner width={300} height={150} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em", position: "relative", zIndex: 1, color: "var(--ink)" }}>
        Triple<span style={{ color: "var(--violet-700)" }}>Pay</span>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--ink-soft)", position: "relative", zIndex: 1, marginBottom: 12 }}>{MODE === "work" ? "משימות · אסמכתאות · יומן עבודה" : "דמי כיס · מטלות · חיסכון"}</div>
      <div style={{ flex: 1 }} />

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
        <button
          onClick={() => navigate("/onboarding/welcome")}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 999,
            border: "none",
            background: "var(--teal-700)",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 800,
            boxShadow: "var(--glow-teal)",
          }}
        >
          ✨ הצטרפות עכשיו – בחינם!
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 999,
            border: "none",
            background: "var(--violet-200)",
            color: "var(--violet-700)",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          🔑 כבר רשומים? התחברות
        </button>
      </div>
    </div>
  );
}
