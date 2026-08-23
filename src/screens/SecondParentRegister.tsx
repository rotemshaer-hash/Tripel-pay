import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../data/store";
import { MODE, V } from "../data/vocabulary";
import { BrandDecor } from "../components/BrandDecor";
import { PrimaryButton } from "../components/UI";

export function SecondParentRegister() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { registerSecondParentSession } = useStore();

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await registerSecondParentSession(code, email.trim(), password, name);
      navigate("/parent");
    } catch (err) {
      console.error("Second-parent registration failed:", err);
      const message = err instanceof Error ? err.message : "";
      setError(message === "invalid-code" ? "קוד ההזמנה לא נכון או לא בתוקף" : "משהו השתבש. בדקו את החיבור ונסו שוב.");
      setLoading(false);
    }
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = code.trim().length >= 4 && name.trim().length >= 2 && emailValid && password.length >= 6;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 24px 28px", position: "relative", overflow: "hidden" }}>
      <BrandDecor />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{`הצטרפות כ${V.admin} נוסף`}</div>
        <div style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 32 }}>{`הוזמנת להצטרף לחשבון ${MODE === "work" ? "החברה" : "Triple Pay המשפחתי"}. תיצור/י את הכניסה האישית שלך.`}</div>

        <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>קוד ההזמנה</label>
        <input
          dir="ltr"
          placeholder="ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 18, textAlign: "center", marginBottom: 14, letterSpacing: "0.1em" }}
        />
        <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>שם מלא</label>
        <input
          placeholder="פלוני אלמוני"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, textAlign: "center", marginBottom: 14 }}
        />
        <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>אימייל</label>
        <input
          type="email"
          dir="ltr"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, textAlign: "center", marginBottom: 14 }}
        />
        <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>סיסמה</label>
        <input
          type="password"
          placeholder="לפחות 6 תווים"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, textAlign: "center", marginBottom: 14 }}
        />
        {error && <div style={{ fontSize: 13, color: "var(--coral-600)", textAlign: "center", marginBottom: 14 }}>{error}</div>}
        <PrimaryButton onClick={submit} disabled={loading || !canSubmit}>
          {loading ? "רגע, יוצרים לך חשבון…" : "יצירת חשבון"}
        </PrimaryButton>
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
