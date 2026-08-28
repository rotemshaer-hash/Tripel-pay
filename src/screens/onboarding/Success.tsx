import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../data/store";
import { Logo } from "../../components/Logo";
import { PrimaryButton } from "../../components/UI";
import { InviteShare } from "../../components/InviteShare";
import { Toast, useToast } from "../../components/Toast";
import { childrenList } from "../../data/family";
import { homePath } from "../../data/routes";
import { MODE, V, work } from "../../data/vocabulary";

/**
 * The last step, and in the business build the most useful one: the account is
 * created and then the manager is handed the invite for each person, ready to send.
 * Burying those links in a settings screen is how a team account ends up with one
 * member — the moment somebody has just typed their staff's names is the moment they
 * will actually send the invites.
 */
export function Success() {
  const navigate = useNavigate();
  const { state, completeOnboarding } = useStore();
  const { toastMessage, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const isWork = MODE === "work";

  async function finish() {
    const parentName = sessionStorage.getItem("tp-onboarding-name") || "";
    const parentEmail = sessionStorage.getItem("tp-onboarding-email") || "";
    const password = sessionStorage.getItem("tp-onboarding-password") || "";
    const companyName = sessionStorage.getItem("tp-onboarding-company") || "";
    let childNames: string[] = [];
    try {
      childNames = JSON.parse(sessionStorage.getItem("tp-onboarding-child-names") || "[]");
    } catch {
      /* fall back to the default seeded roster */
    }
    // The credentials live in sessionStorage between the steps, which is per-tab: a
    // person who reaches this screen in a new tab (a shared link, a restarted browser)
    // has nothing to register with, and the raw Firebase "invalid email" that follows
    // reads as a broken app rather than "start again".
    if (!parentEmail || !password) {
      setError("פרטי ההרשמה לא נמצאו — יש להתחיל את פתיחת החשבון מחדש.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await completeOnboarding(parentEmail, password, parentName, childNames, companyName);
      // The password is the one thing here that must not outlive the flow.
      for (const key of ["tp-onboarding-name", "tp-onboarding-email", "tp-onboarding-password", "tp-onboarding-company", "tp-onboarding-profession", "tp-onboarding-kids", "tp-onboarding-child-names"]) {
        sessionStorage.removeItem(key);
      }
      // The family build has nothing to hand over, so it goes straight in.
      if (!isWork) {
        navigate(homePath("parent"));
        return;
      }
      setCreated(true);
      setLoading(false);
    } catch (err) {
      console.error("Registration failed:", err);
      const code = (err as { code?: string })?.code;
      const detail = code || (err instanceof Error ? err.message : String(err));
      setError(`יצירת החשבון נכשלה. בדקו את החיבור ונסו שוב.\n(${detail})`);
      setLoading(false);
    }
  }

  if (created) {
    const workers = childrenList(state.family);
    return (
      <div className="screen">
        <div style={{ background: "linear-gradient(180deg, #232a3b 0%, #1b2130 100%)", padding: "28px 22px 22px", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ffffff" }}>החשבון נוצר</div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.72)", marginTop: 6, lineHeight: 1.6 }}>
            {workers.length > 0
              ? `נשאר לשלוח לכל ${V.worker} את הקישור שלו. אפשר לעשות את זה גם אחר כך ממסך הצוות.`
              : `אפשר להוסיף ${V.workerPlural} בכל שלב ממסך ההגדרות.`}
          </div>
        </div>

        <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {workers.map((w) => (
            <section key={w.id} style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 15px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 9 }}>{w.name}</div>
              <InviteShare workerName={w.name} code={w.inviteCode} onNotify={showToast} />
            </section>
          ))}

          <button
            onClick={() => navigate(homePath("parent"))}
            style={{ marginTop: 4, width: "100%", padding: "15px", borderRadius: 11, border: "none", background: work.ink, color: "#ffffff", fontSize: 15, fontWeight: 800 }}
          >
            {workers.length > 0 ? "סיימתי — למסך הראשי" : "התחלה"}
          </button>
        </div>
        <Toast message={toastMessage} />
      </div>
    );
  }

  if (isWork) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, textAlign: "center" }}>הכול מוכן</div>
        <div style={{ fontSize: 13.5, color: "var(--ink-soft)", textAlign: "center", lineHeight: 1.6 }}>
          לחיצה אחת ונפתח החשבון של {sessionStorage.getItem("tp-onboarding-company") || "העסק"}.
        </div>
        {error && <div style={{ fontSize: 13, color: work.alert, textAlign: "center", whiteSpace: "pre-line" }}>{error}</div>}
        <button
          onClick={finish}
          disabled={loading}
          style={{ width: "100%", marginTop: 8, padding: "15px", borderRadius: 11, border: "none", background: work.ink, color: "#ffffff", fontSize: 15, fontWeight: 800, opacity: loading ? 0.5 : 1 }}
        >
          {loading ? "רגע, פותחים את החשבון…" : "יצירת החשבון"}
        </button>
      </div>
    );
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
