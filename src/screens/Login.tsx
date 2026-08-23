import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../data/store";
import { V } from "../data/vocabulary";
import { BrandDecor } from "../components/BrandDecor";
import { PrimaryButton } from "../components/UI";

export function Login() {
  const [role, setRole] = useState<"parent" | "child">("parent");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginChildSession, resetPassword } = useStore();

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
        await login(email.trim(), password);
        navigate("/parent");
      } else {
        await loginChildSession(username, password);
        navigate("/child");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(role === "parent" ? "אימייל או סיסמה שגויים" : "שם משתמש או סיסמה שגויים");
      setLoading(false);
    }
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = role === "parent" ? emailValid && password.length >= 6 : username.trim().length >= 2 && password.length >= 6;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 24px 28px", position: "relative", overflow: "hidden" }}>
      <BrandDecor />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Triple Pay</div>
        <div style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
          שלום אורח, טוב לראות אותך. בחרו איך להיכנס.
        </div>

        <div className="glass" style={{ display: "flex", borderRadius: 999, padding: 4, marginBottom: 20 }}>
          {(["parent", "child"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setError("");
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                padding: "10px 0",
                fontSize: 13.5,
                fontWeight: 700,
                background: role === r ? "var(--violet-700)" : "transparent",
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
            style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, textAlign: "center", marginBottom: 14 }}
          />
        ) : (
          <input
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, textAlign: "center", marginBottom: 14 }}
          />
        )}
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, textAlign: "center", marginBottom: 14 }}
        />
        {role === "parent" && (
          <button
            onClick={forgotPassword}
            disabled={resetLoading}
            style={{ display: "block", margin: "-4px auto 14px", background: "none", border: "none", color: "var(--violet-700)", fontSize: 13, fontWeight: 700 }}
          >
            {resetLoading ? "שולח מייל…" : "שכחתי סיסמה"}
          </button>
        )}
        {resetSent && (
          <div style={{ fontSize: 13, color: "var(--teal-900)", textAlign: "center", marginBottom: 14 }}>
            נשלח מייל לאיפוס סיסמה ל-{email.trim()} — בדקו את תיבת הדואר
          </div>
        )}
        {error && <div style={{ fontSize: 13, color: "var(--coral-600)", textAlign: "center", marginBottom: 14 }}>{error}</div>}
        <PrimaryButton onClick={submit} disabled={loading || !canSubmit}>
          {loading ? "נכנסים…" : "כניסה"}
        </PrimaryButton>
      </div>
    </div>
  );
}
