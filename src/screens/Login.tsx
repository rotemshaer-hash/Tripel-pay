import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../data/store";
import { homePath } from "../data/routes";
import { MODE, V, work } from "../data/vocabulary";
import { USERNAME_HINT, isUsernameUsable } from "../data/username";
import { BrandDecor } from "../components/BrandDecor";
import { Logo } from "../components/Logo";
import { PrimaryButton } from "../components/UI";

const fieldStyle = (isWork: boolean): React.CSSProperties => ({
  width: "100%",
  padding: isWork ? "13px 14px" : "16px",
  borderRadius: isWork ? 10 : 16,
  border: isWork ? "1px solid var(--line)" : undefined,
  fontSize: isWork ? 14.5 : 16,
  textAlign: isWork ? "start" : "center",
  marginBottom: 14,
});

export function Login() {
  const isWork = MODE === "work";
  const [role, setRole] = useState<"parent" | "child">("parent");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  // Set when the sign-in itself succeeded but the account has no company record —
  // the one failure a person can actually fix from here.
  const [needsAccountRepair, setNeedsAccountRepair] = useState(false);
  const [repairCompany, setRepairCompany] = useState("");
  const [repairName, setRepairName] = useState("");
  const [repairLoading, setRepairLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Where this person was heading before they were asked to sign in.
  const next = searchParams.get("next");
  const { login, loginChildSession, resetPassword, completeMissingAccount } = useStore();

  async function forgotPassword() {
    setError("");
    setResetSent(false);
    if (!emailValid) {
      setError("קודם הזינו כתובת אימייל תקינה למעלה");
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      console.error("Password reset failed:", err);
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found") {
        setError(`לא נמצא חשבון ${V.admin} עם האימייל הזה — יש לוודא שנרשמתם קודם עם כתובת זו`);
        // Firebase hides whether an address is registered (so nobody can fish for
        // accounts), so on most projects this branch never runs and the send below
        // "succeeds" for an unknown address too. The message must not promise mail.
      } else if (code === "auth/too-many-requests") {
        setError("יותר מדי נסיונות — נסו שוב בעוד כמה דקות");
      } else {
        setError("שליחת מייל האיפוס נכשלה. בדקו את החיבור לאינטרנט ונסו שוב");
      }
    } finally {
      setResetLoading(false);
    }
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      if (role === "parent") {
        setNeedsAccountRepair(false);
        await login(email.trim(), password);
        navigate(next || homePath("parent"));
      } else {
        await loginChildSession(username, password);
        navigate(next || homePath("child"));
      }
    } catch (err) {
      console.error("Login failed:", err);
      const message = err instanceof Error ? err.message : "";
      // The password was right — the account is simply unfinished. That is repairable
      // from this screen, and nowhere else.
      if (role === "parent" && message === "family-not-found") setNeedsAccountRepair(true);
      setError(
        role === "parent"
          ? message === "family-not-found"
            ? ""
            : "אימייל או סיסמה שגויים. ייתכן גם שההרשמה לא הושלמה עד הסוף, או שהחשבון נפתח עם כתובת אחרת."
          : message === "child-link-missing"
            ? `החשבון קיים אבל לא מקושר לצוות. פתח/י את קישור ההזמנה מהמנהל והזן/י שם משתמש וסיסמה — אותם פרטים בדיוק — כדי להשלים את החיבור.`
            : "שם משתמש או סיסמה שגויים"
      );
      setLoading(false);
    }
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = role === "parent" ? emailValid && password.length >= 6 : isUsernameUsable(username) && password.length >= 6;

  return (
    <div className={isWork ? "work-ground" : undefined} style={{ flex: 1, display: "flex", flexDirection: "column", padding: isWork ? "0 0 20px" : "70px 24px 28px", position: "relative", overflow: "hidden" }}>
      {MODE !== "work" && <BrandDecor />}

      {isWork && (
        <div className="hero" style={{ padding: "40px 24px 30px", flexShrink: 0 }}>
          {/* A solid white tile behind the mark read as a box stuck on top of the
              header. A soft glow gives the same separation from the hero's own
              teal without one — the mark's silhouette, not a card holding it. */}
          <div style={{ marginBottom: 10, filter: "drop-shadow(0 0 14px rgba(255,255,255,0.5))" }}>
            <Logo size={90} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff" }}>
            {V.appName.split(" ")[0]} <span style={{ color: work.onDark }}>{V.appName.split(" ").slice(1).join(" ")}</span>
          </div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>יומן עבודה לצוותים קטנים</div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, padding: isWork ? "22px 24px 0" : undefined }}>
        {!isWork && <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{V.appName}</div>}
        <div style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
          {isWork ? "כניסה לחשבון" : "שלום אורח, טוב לראות אותך. בחרו איך להיכנס."}
        </div>

        <div
          className={isWork ? undefined : "glass"}
          style={{
            display: "flex",
            gap: isWork ? 6 : 0,
            borderRadius: isWork ? 0 : 999,
            padding: isWork ? 0 : 4,
            marginBottom: 20,
          }}
        >
          {(["parent", "child"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setError("");
              }}
              style={{
                flex: 1,
                borderRadius: isWork ? 10 : 999,
                padding: "10px 0",
                fontSize: 13.5,
                fontWeight: 700,
                border: isWork && role !== r ? "1px solid var(--line)" : "none",
                background: role === r ? (isWork ? work.ink : "var(--violet-700)") : isWork ? "#ffffff" : "transparent",
                color: role === r ? "#fff" : "var(--ink-soft)",
              }}
            >
              {r === "parent" ? V.admin : V.worker}
            </button>
          ))}
        </div>

        {role === "parent" ? (
          <input
            type="email"
            dir="ltr"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle(isWork)}
          />
        ) : (
          <input
            dir="ltr"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={fieldStyle(isWork)}
          />
        )}
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={fieldStyle(isWork)}
        />
        {role === "parent" && (
          <button
            onClick={forgotPassword}
            disabled={resetLoading}
            style={{ display: "block", margin: "-4px auto 14px", background: "none", border: "none", color: isWork ? work.waiting : "var(--violet-700)", fontSize: 13, fontWeight: 700 }}
          >
            {resetLoading ? "שולח מייל…" : "שכחתי סיסמה"}
          </button>
        )}
        {role === "child" && (
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.55, marginBottom: 14 }}>
            {username && !isUsernameUsable(username)
              ? USERNAME_HINT
              : `אין איפוס סיסמה במייל ל${V.worker} — החשבון נפתח עם שם משתמש, לא עם כתובת מייל. אם שכחת, בקש/י מהמנהל קוד הצטרפות חדש ממסך הצוות.`}
          </div>
        )}
        {resetSent && (
          <div style={{ fontSize: 13, color: "var(--teal-900)", textAlign: "center", marginBottom: 14 }}>
            {`אם קיים חשבון עם ${email.trim()} — נשלח אליו מייל לאיפוס (בדקו גם בספאם). לא הגיע כלום? כנראה שהחשבון נפתח עם כתובת אחרת, או שההרשמה מעולם לא הושלמה — במקרה כזה יש לפתוח חשבון חדש.`}
          </div>
        )}
        {needsAccountRepair && (
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 11, padding: "13px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.6, marginBottom: 10 }}>
              הסיסמה נכונה, אבל פתיחת החשבון לא הושלמה — לא נשמרו לו פרטי עסק. אפשר להשלים את זה עכשיו, בלי לפתוח חשבון חדש.
            </div>
            <input
              value={repairCompany}
              onChange={(e) => setRepairCompany(e.target.value)}
              placeholder="שם העסק"
              style={{ ...fieldStyle(isWork), marginBottom: 8 }}
            />
            <input
              value={repairName}
              onChange={(e) => setRepairName(e.target.value)}
              placeholder={`שם ה${V.admin}`}
              style={{ ...fieldStyle(isWork), marginBottom: 10 }}
            />
            <button
              onClick={async () => {
                setRepairLoading(true);
                setError("");
                try {
                  await completeMissingAccount(repairName.trim(), repairCompany.trim());
                  navigate(next || homePath("parent"));
                } catch (err) {
                  console.error("Completing the account failed:", err);
                  setError("השלמת החשבון נכשלה. בדקו את החיבור ונסו שוב.");
                  setRepairLoading(false);
                }
              }}
              disabled={repairLoading || !repairCompany.trim()}
              style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: work.ink, color: "#ffffff", fontSize: 14, fontWeight: 800, opacity: repairLoading || !repairCompany.trim() ? 0.45 : 1 }}
            >
              {repairLoading ? "משלימים…" : "השלמת פתיחת החשבון"}
            </button>
          </div>
        )}
        {error && <div style={{ fontSize: 13, color: "var(--coral-600)", textAlign: "center", marginBottom: 14 }}>{error}</div>}
        {isWork ? (
          <button
            onClick={submit}
            disabled={loading || !canSubmit}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 11,
              border: "none",
              background: work.ink,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 800,
              opacity: loading || !canSubmit ? 0.45 : 1,
            }}
          >
            {loading ? "רגע…" : "כניסה"}
          </button>
        ) : (
        <PrimaryButton onClick={submit} disabled={loading || !canSubmit}>
          {loading ? "נכנסים…" : "כניסה"}
        </PrimaryButton>
        )}

        {isWork && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 16px" }}>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>אין לך חשבון?</span>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
            <button
              onClick={() => navigate("/onboarding/welcome")}
              style={{ width: "100%", padding: "14px", borderRadius: 11, border: "1px solid var(--line)", background: "#ffffff", color: "var(--ink)", fontSize: 14, fontWeight: 700 }}
            >
              פתיחת חשבון לעסק
            </button>
          </>
        )}
      </div>

      {isWork && (
        <>
          <div style={{ flex: 1 }} />
          {/* The build, where anyone can read it without signing in first — which is
              the whole point, since "are you on the latest version?" is a question
              asked precisely of people who are stuck outside. */}
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-faint)", paddingTop: 18 }}>
            {V.appName} · גרסה <span dir="ltr">{__BUILD_ID__}</span>
          </div>
        </>
      )}
    </div>
  );
}
