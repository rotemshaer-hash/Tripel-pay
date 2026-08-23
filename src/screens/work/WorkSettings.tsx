import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";

/**
 * Account settings for the business build.
 *
 * Deliberately a fraction of the family app's settings screen: allowances, savings
 * permissions, transfers from relatives and balance resets are family-finance
 * concerns with no counterpart at work. What's left is what a manager actually
 * needs — who's on the account, adding a hire, and signing out.
 */
export function WorkSettings() {
  const { state, dispatch, logout } = useStore();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const [name, setName] = useState("");
  const workers = childrenList(state.family);

  function addWorker() {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: "ADD_WORKER", name: trimmed });
    showToast(`${trimmed} נוסף/ה לצוות`);
    setName("");
  }

  return (
    <div className="screen">
      <Header title="הגדרות" subtitle="החשבון והצוות" tint="pro" />

      <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <section style={card}>
          <div style={cardTitle}>פרטי החשבון</div>
          <Row label="שם העסק" value={state.family.companyName ?? ""} />
          <Row label={V.admin} value={state.family.parentName} />
          <Row label="אימייל" value={state.family.parentEmail} ltr />
          <Row label={V.workerPlural} value={String(workers.length)} />
        </section>

        <section style={card}>
          <div style={cardTitle}>הוספת {V.worker}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 10 }}>
            {V.worker} חדש מקבל קוד הצטרפות אישי (מופיע במסך הצוות) ונכנס איתו עם שם משתמש וסיסמה משלו.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWorker()}
              placeholder="שם מלא"
              style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13.5 }}
            />
            <button
              onClick={addWorker}
              disabled={!name.trim()}
              style={{ background: work.ink, color: "#ffffff", border: "none", borderRadius: 9, padding: "0 16px", fontSize: 13, fontWeight: 800, opacity: name.trim() ? 1 : 0.5 }}
            >
              הוספה
            </button>
          </div>
        </section>

        <button
          onClick={async () => {
            await logout();
            navigate("/onboarding/splash");
          }}
          style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px", fontSize: 13.5, fontWeight: 700, color: work.alert }}
        >
          התנתקות
        </button>
      </div>

      <Toast message={toastMessage} />
      <WorkBottomNav />
    </div>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{label}</span>
      <span dir={ltr ? "ltr" : undefined} style={{ fontSize: 13.5, fontWeight: 700 }}>{value || "—"}</span>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "14px 15px",
};

const cardTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 10,
};
