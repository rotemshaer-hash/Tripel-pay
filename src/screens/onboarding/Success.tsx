import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../data/store";
import { homePath } from "../../data/routes";
import { Logo } from "../../components/Logo";
import { PrimaryButton } from "../../components/UI";

export function Success() {
  const navigate = useNavigate();
  const { completeOnboarding } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finish() {
    const parentName = sessionStorage.getItem("tp-onboarding-name") || "";
    const parentEmail = sessionStorage.getItem("tp-onboarding-email") || "";
    const password = sessionStorage.getItem("tp-onboarding-password") || "";
    let childNames: string[] = [];
    try {
      childNames = JSON.parse(sessionStorage.getItem("tp-onboarding-child-names") || "[]");
    } catch {
      /* fall back to the default seeded children */
    }
    setLoading(true);
    setError("");
    try {
      await completeOnboarding(parentEmail, password, parentName, childNames);
      sessionStorage.removeItem("tp-onboarding-name");
      sessionStorage.removeItem("tp-onboarding-email");
      sessionStorage.removeItem("tp-onboarding-password");
      sessionStorage.removeItem("tp-onboarding-kids");
      sessionStorage.removeItem("tp-onboarding-child-names");
      navigate(homePath("parent"));
    } catch (err) {
      console.error("Registration failed:", err);
      const code = (err as { code?: string })?.code;
      const detail = code || (err instanceof Error ? err.message : String(err));
      setError(`יצירת החשבון נכשלה. בדקו את החיבור ונסו שוב.\n(${detail})`);
      setLoading(false);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", gap: 20 }}>
      <Logo size={100} />
      <div style={{ fontSize: 22, fontWeight: 800, textAlign: "center" }}>תהליך הרישום הושלם בהצלחה!</div>
      <div style={{ fontSize: 14, color: "var(--ink-soft)", textAlign: "center" }}>לחצו על סיימתי להגעה למסך הראשי</div>
      {error && <div style={{ fontSize: 13, color: "var(--coral-600)", textAlign: "center", whiteSpace: "pre-line" }}>{error}</div>}
      <div style={{ width: "100%", marginTop: 12 }}>
        <PrimaryButton onClick={finish} disabled={loading}>
          {loading ? "רגע, יוצרים לך חשבון…" : "סיימתי"}
        </PrimaryButton>
      </div>
    </div>
  );
}
