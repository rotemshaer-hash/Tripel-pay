import { useNavigate } from "react-router-dom";
import { BrandDecor } from "../../components/BrandDecor";
import { MODE, V, work } from "../../data/vocabulary";
import { HeroBanner } from "../../components/Illustrations";
import { Logo } from "../../components/Logo";

/**
 * The first screen anyone sees, and the one that sets expectations for everything
 * behind it. The family build opens with a mascot and candy colours because it is
 * talking to a child; the business build cannot — a cartoon egg and "free! ✨" on the
 * way into a work journal reads as a toy, so the work mode is sober by design rather
 * than the same screen with different words.
 */
export function Splash() {
  const navigate = useNavigate();
  const [firstWord, ...restOfName] = V.appName.split(" ");

  // The business build gets its own layout rather than the family one restyled: a dark
  // panel that is sized by the text inside it, over a white footer holding the two
  // ways in. An absolutely-positioned band of fixed height would clip the wording the
  // moment it wrapped to another line or the viewport got shorter.
  if (MODE === "work") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff", overflow: "hidden" }}>
        <div
          style={{
            // The first thing anyone sees, still in the navy the rest of the app
            // moved off of — this screen sat outside the design pass because it
            // never appears in the app itself, only before signing in.
            background: work.ink,
            padding: "0 26px 34px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Same tile as the login screen's hero, and for the same reason: the mark's
              dark teal needs a light ground under it or it disappears into this
              screen's near-black one. */}
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Logo size={30} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff" }}>
            {firstWord} <span style={{ color: work.onDark }}>{restOfName.join(" ")}</span>
          </div>
          <div style={{ fontSize: 14.5, color: work.onDark, marginTop: 10, lineHeight: 1.65 }}>
            יומן עבודה לצוותים קטנים — משימות עם אחראי ותאריך יעד, אסמכתאות לכל ביצוע, ותיעוד של מי עשה מה ומתי.
          </div>
        </div>

        <div style={{ padding: "22px 26px calc(28px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => navigate("/onboarding/welcome")}
            style={{ width: "100%", padding: "15px", borderRadius: 11, border: "none", background: work.ink, color: "#ffffff", fontSize: 15, fontWeight: 800 }}
          >
            פתיחת חשבון לעסק
          </button>
          <button
            onClick={() => navigate("/login")}
            style={{ width: "100%", padding: "15px", borderRadius: 11, border: "1px solid var(--line)", background: "#ffffff", color: "var(--ink)", fontSize: 14, fontWeight: 700 }}
          >
            כניסה לחשבון קיים
          </button>
        </div>
      </div>
    );
  }

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
        {firstWord}
        <span style={{ color: "var(--violet-700)" }}>{restOfName.join(" ")}</span>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--ink-soft)", position: "relative", zIndex: 1, marginBottom: 12 }}>דמי כיס · מטלות · חיסכון</div>
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
