import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore, useWorkView } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";
import { entryPath } from "../../data/routes";

/**
 * Account settings for the business build.
 *
 * Deliberately a fraction of the family app's settings screen: allowances, savings
 * permissions, transfers from relatives and balance resets are family-finance
 * concerns with no counterpart at work. What's left is what a manager actually
 * needs — who's on the account, adding a hire, and signing out.
 *
 * A worker opens the same screen and sees only what is theirs: who they're working
 * for, which version they're on, and the way out. Signing out is not a manager
 * privilege — without it a worker is locked into the app on a shared phone.
 */
export function WorkSettings() {
  const { state, dispatch, logout, deleteAccount } = useStore();
  const { isManager } = useWorkView();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const [name, setName] = useState("");
  const [closing, setClosing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const workers = childrenList(state.family);
  const me = workers.find((c) => c.id === state.activeChildId);

  function addWorker() {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: "ADD_WORKER", name: trimmed });
    showToast(`${trimmed} נוסף/ה לצוות`);
    setName("");
  }

  const CONFIRM_WORD = "מחיקה";
  const isOwner = state.uid === state.familyUid;

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(password);
      navigate(entryPath());
    } catch (err) {
      console.error("Account deletion failed:", err);
      const code = (err as { code?: string })?.code;
      setDeleteError(
        code === "auth/wrong-password" || code === "auth/invalid-credential"
          ? "הסיסמה שגויה"
          : code === "auth/too-many-requests"
            ? "יותר מדי ניסיונות — נסה שוב בעוד כמה דקות"
            : "המחיקה נכשלה. בדוק את החיבור ונסה שוב."
      );
      setDeleting(false);
    }
  }

  return (
    <div className="screen">
      <Header title="הגדרות" subtitle={isManager ? "החשבון והצוות" : "החשבון שלי"} tint="pro" />

      <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <section style={card}>
          <div style={cardTitle}>פרטי החשבון</div>
          <Row label="שם העסק" value={state.family.companyName ?? ""} />
          {isManager ? (
            <>
              <Row label={V.admin} value={state.family.parentName} />
              <Row label="אימייל" value={state.family.parentEmail} ltr />
              <Row label={V.workerPlural} value={String(workers.length)} />
            </>
          ) : (
            <>
              <Row label="שם" value={me?.name ?? ""} />
              <Row label={V.admin} value={state.family.parentName} />
            </>
          )}
          <Row label="גרסה" value={__BUILD_ID__} ltr />
        </section>

        {isManager && (
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
        )}

        <button
          onClick={async () => {
            await logout();
            navigate(entryPath());
          }}
          style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}
        >
          התנתקות
        </button>

        {isOwner && (
          <section style={{ ...card, borderColor: "#f3c0c9", marginTop: 8 }}>
            <div style={{ ...cardTitle, color: work.alert }}>מחיקת החשבון</div>
            {!closing ? (
              <>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 11 }}>
                  מוחק לצמיתות את החשבון ואת כל מה שבו — משימות, אסמכתאות ויומן העבודה. הפעולה לא ניתנת לביטול.
                </div>
                <button
                  onClick={() => setClosing(true)}
                  style={{ width: "100%", background: "#ffffff", border: `1px solid ${work.alert}`, borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, color: work.alert }}
                >
                  מחיקת החשבון
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.65, marginBottom: 10 }}>
                  יימחקו לצמיתות: {workers.length} {V.workerPlural}, כל המשימות והאסמכתאות, וכל יומן העבודה.
                  {" "}
                  <strong>כדאי לייצא את היומן ל-CSV לפני כן.</strong>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.6, marginBottom: 12, background: "var(--paper)", borderRadius: 8, padding: "8px 10px" }}>
                  {`${V.workerPlural} שכבר נרשמו נשארים עם חשבון משלהם שאי אפשר למחוק מכאן — הוא פשוט לא יוביל לשום מקום. כל אחד מהם יכול למחוק אותו בעצמו.`}
                </div>

                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", display: "block", marginBottom: 5 }}>הסיסמה שלך</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לאימות שזה באמת אתה"
                  style={{ width: "100%", padding: "11px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13.5, marginBottom: 10 }}
                />

                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", display: "block", marginBottom: 5 }}>
                  {`הקלד "${CONFIRM_WORD}" כדי לאשר`}
                </label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  style={{ width: "100%", padding: "11px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13.5, marginBottom: 10 }}
                />

                {deleteError && <div style={{ fontSize: 12.5, color: work.alert, marginBottom: 10 }}>{deleteError}</div>}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting || password.length < 6 || confirmText.trim() !== CONFIRM_WORD}
                    style={{
                      flex: 1,
                      background: work.alert,
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 10,
                      padding: "12px",
                      fontSize: 13.5,
                      fontWeight: 800,
                      opacity: deleting || password.length < 6 || confirmText.trim() !== CONFIRM_WORD ? 0.4 : 1,
                    }}
                  >
                    {deleting ? "מוחק…" : "מחיקה סופית"}
                  </button>
                  <button
                    onClick={() => {
                      setClosing(false);
                      setPassword("");
                      setConfirmText("");
                      setDeleteError("");
                    }}
                    disabled={deleting}
                    style={{ flex: 1, background: "#ffffff", border: "1px solid var(--line)", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}
                  >
                    ביטול
                  </button>
                </div>
              </>
            )}
          </section>
        )}
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
