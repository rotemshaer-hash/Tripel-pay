import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../data/store";
import { homePath } from "../data/routes";
import { MODE, V, work } from "../data/vocabulary";
import { USERNAME_HINT, isUsernameUsable, normalizeUsername } from "../data/username";
import { BrandDecor } from "../components/BrandDecor";
import { PrimaryButton } from "../components/UI";

export function ChildRegister() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { registerChildSession } = useStore();
  const isWork = MODE === "work";
  // Arriving from an invite link means the code is already known; showing it as an
  // empty field to fill in is how a working invite still fails.
  const fromLink = !!searchParams.get("code");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await registerChildSession(code, username, password);
      navigate(homePath("child"));
    } catch (err) {
      console.error("Child registration failed:", err);
      const message = err instanceof Error ? err.message : "";
      const code = (err as { code?: string })?.code;
      // The most common real failure is a username already taken, which the generic
      // "something went wrong" hides — leaving the person retrying the same name.
      setError(
        message === "invalid-code"
          ? "קוד ההצטרפות לא נכון או לא בתוקף — בקש/י מהמנהל קוד חדש ממסך הצוות"
          : code === "auth/wrong-password" || code === "auth/invalid-credential"
            ? "שם המשתמש הזה כבר קיים. אם הוא שלך — הזן/י את הסיסמה שבחרת בפעם הקודמת; אחרת בחר/י שם אחר."
            : code === "auth/weak-password"
              ? "הסיסמה קצרה מדי — לפחות 6 תווים"
              : "משהו השתבש. בדקו את החיבור ונסו שוב."
      );
      setLoading(false);
    }
  }

  // A name typed in Hebrew survives normalisation as an empty string, which used to
  // hand two different people the same account. Say so before the account is made.
  const usernameOk = isUsernameUsable(username);
  const normalized = normalizeUsername(username);
  const canSubmit = code.trim().length >= 4 && usernameOk && password.length >= 6;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 24px 28px", position: "relative", overflow: "hidden" }}>
      {!isWork && <BrandDecor />}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: isWork ? 26 : 28, fontWeight: 800, marginBottom: 6 }}>
          {isWork ? `הצטרפות ל-${V.appName}` : `ברוך הבא ל-${V.appName}`}
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: isWork ? 26 : 32, lineHeight: 1.6 }}>
          {isWork
            ? "צורפת לצוות. בחר/י שם משתמש וסיסמה — זה החשבון האישי שלך, ובו תראה/י את המשימות שלך ותצרף/י אסמכתאות."
            : `ה${V.admin} הזמין אותך! בחר/י שם משתמש וסיסמה כדי ליצור את החשבון האישי שלך.`}
        </div>

        <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6, fontWeight: isWork ? 700 : 400 }}>
          קוד ההצטרפות
        </label>
        <input
          dir="ltr"
          placeholder="ABC123"
          value={code}
          readOnly={fromLink}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={
            isWork
              ? { width: "100%", padding: "13px 14px", borderRadius: 10, border: "1px solid var(--line)", background: fromLink ? "var(--paper)" : "#ffffff", fontSize: 16, textAlign: "center", marginBottom: 14, letterSpacing: "0.1em", fontWeight: 800 }
              : { width: "100%", padding: "16px", borderRadius: 16, fontSize: 18, textAlign: "center", marginBottom: 14, letterSpacing: "0.1em" }
          }
        />
        <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6, fontWeight: isWork ? 700 : 400 }}>שם משתמש</label>
        <input
          dir="ltr"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle(isWork)}
        />
        <div style={{ fontSize: 11.5, color: username && !usernameOk ? work.alert : "var(--ink-faint)", marginTop: -8, marginBottom: 12, lineHeight: 1.5 }}>
          {!username
            ? USERNAME_HINT
            : !usernameOk
              ? USERNAME_HINT
              : `הכניסה תהיה עם השם: ${normalized}`}
        </div>
        <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6, fontWeight: isWork ? 700 : 400 }}>סיסמה</label>
        <input
          type="password"
          placeholder="לפחות 6 תווים"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle(isWork)}
        />
        {error && <div style={{ fontSize: 13, color: isWork ? work.alert : "var(--coral-600)", textAlign: "center", marginBottom: 14 }}>{error}</div>}
        {isWork ? (
          <button
            onClick={submit}
            disabled={loading || !canSubmit}
            style={{ width: "100%", padding: "15px", borderRadius: 11, border: "none", background: work.ink, color: "#ffffff", fontSize: 15, fontWeight: 800, opacity: loading || !canSubmit ? 0.45 : 1 }}
          >
            {loading ? "רגע, פותחים לך חשבון…" : "יצירת החשבון"}
          </button>
        ) : (
          <PrimaryButton onClick={submit} disabled={loading || !canSubmit}>
            {loading ? "רגע, יוצרים לך חשבון…" : "יצירת חשבון"}
          </PrimaryButton>
        )}
        <button
          onClick={() => navigate("/login")}
          style={{ width: "100%", background: "none", border: "none", marginTop: 18, fontSize: 13, color: "var(--ink-soft)", textDecoration: "underline" }}
        >
          כבר יש לך חשבון? כניסה
        </button>
      </div>
    </div>
  );
}

const inputStyle = (isWork: boolean): React.CSSProperties =>
  isWork
    ? { width: "100%", padding: "13px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14.5, marginBottom: 14 }
    : { width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, textAlign: "center", marginBottom: 14 };
