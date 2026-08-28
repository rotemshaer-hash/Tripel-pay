import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore, useWorkView } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";
import { formatDateTime } from "../../utils/datetime";
import { adminInviteLink, entryPath } from "../../data/routes";
import { InstallButton } from "../../components/InstallButton";

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
  const { state, connection, dispatch, retrySync, logout, deleteAccount } = useStore();
  const { isManager } = useWorkView();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const [name, setName] = useState("");
  const [closing, setClosing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [adminInviteOpen, setAdminInviteOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
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
          <Row label="סוג חשבון" value={state.role === "child" ? V.worker : V.admin} />
          <Row label="מחובר כ" value={connection.signedInAs ?? "לא מחובר"} ltr />
          <Row label="מקור הנתונים" value={connection.unsaved ? "המכשיר — יש שינויים שלא נשמרו" : connection.live ? "השרת (מעודכן)" : "המכשיר בלבד"} />
          <Row label="גרסה" value={__BUILD_ID__} ltr />
        </section>

        {/* Sync is either working or it is not, and the person holding the phone is the
            one who needs to know which. Silent failure is what cost this product days. */}
        {(connection.error || connection.unsaved) && (
          <section style={{ ...card, borderColor: "#f3c0c9" }}>
            <div style={{ ...cardTitle, color: work.alert }}>יש שינויים שלא נשמרו לשרת</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 10 }}>
              {connection.error ?? "השמירה האחרונה לא הושלמה."}
              {connection.failedAt ? ` (${formatDateTime(connection.failedAt)})` : ""}
              {" "}
              הכל שמור במכשיר ולא הלך לאיבוד — כשהחיבור יחזור זה יישלח לבד, ואפשר גם לנסות עכשיו.
            </div>
            <button
              onClick={async () => {
                setRetrying(true);
                await retrySync();
                setRetrying(false);
                showToast("ניסיון סנכרון בוצע");
              }}
              disabled={retrying}
              style={{ width: "100%", background: work.ink, color: "#ffffff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 800, opacity: retrying ? 0.5 : 1 }}
            >
              {retrying ? "מסנכרן…" : "ניסיון סנכרון עכשיו"}
            </button>
          </section>
        )}

        <section style={card}>
          <div style={cardTitle}>האפליקציה על המסך</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 10 }}>
            {`ה${V.workerPlural} לא מתקינים כלום — הם עובדים מהקישור. למנהל דווקא כדאי אייקון במסך הבית.`}
          </div>
          <InstallButton />
        </section>

        {isManager && (
          <section style={card}>
            <div style={cardTitle}>אסמכתאות</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 10 }}>
              {`כשזה דלוק, ${V.worker} לא יכול לסמן "סיימתי" בלי לצרף תמונה או הערה. זה מה ששומר על התיעוד שווה משהו.`}
            </div>
            <button
              onClick={() => {
                const value = state.family.requireProof === false;
                dispatch({ type: "SET_REQUIRE_PROOF", value });
                showToast(value ? "נדרשת אסמכתא לסגירת משימה" : "אפשר לסגור משימה בלי אסמכתא");
              }}
              style={{
                width: "100%",
                background: state.family.requireProof === false ? "#ffffff" : work.ink,
                color: state.family.requireProof === false ? "var(--ink)" : "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "12px",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {state.family.requireProof === false ? "כבוי — אפשר לסגור בלי אסמכתא" : "דלוק — חובה אסמכתא לפני סגירה"}
            </button>
          </section>
        )}

        {isManager && (
          <section style={card}>
            <div style={cardTitle}>אסמכתאות</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 10 }}>
              {`כשזה דלוק, ${V.worker} לא יכול לסמן "סיימתי" בלי לצרף תמונה או הערה. זה מה ששומר על התיעוד שווה משהו.`}
            </div>
            <button
              onClick={() => {
                const value = state.family.requireProof === false;
                dispatch({ type: "SET_REQUIRE_PROOF", value });
                showToast(value ? "נדרשת אסמכתא לסגירת משימה" : "אפשר לסגור משימה בלי אסמכתא");
              }}
              style={{
                width: "100%",
                background: state.family.requireProof === false ? "#ffffff" : work.ink,
                color: state.family.requireProof === false ? "var(--ink)" : "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "12px",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {state.family.requireProof === false ? "כבוי — אפשר לסגור בלי אסמכתא" : "דלוק — חובה אסמכתא לפני סגירה"}
            </button>
          </section>
        )}

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

        {/* One phone holding the entire company record is a single point of failure —
            for the business, not just for the app. A second admin is the backup. */}
        {isManager && isOwner && (
          <section style={card}>
            <div style={cardTitle}>{`${V.admin} נוסף`}</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 10 }}>
              {`שותף, מזכיר/ה או מנהל/ת עבודה — עם גישה מלאה לאותו חשבון. אם הטלפון שלך הולך לאיבוד, העסק לא נעצר.`}
            </div>
            {!adminInviteOpen ? (
              <button
                onClick={() => setAdminInviteOpen(true)}
                style={{ width: "100%", background: "#ffffff", border: "1px solid var(--line)", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 800 }}
              >
                {`הזמנת ${V.admin} נוסף`}
              </button>
            ) : (
              <>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 8 }}>
                  {`קוד ההזמנה: ${state.family.parentInviteCode}`}
                </div>
                <button
                  onClick={async () => {
                    const link = adminInviteLink(state.family.parentInviteCode);
                    try {
                      await navigator.clipboard.writeText(link);
                      showToast("הקישור הועתק");
                    } catch {
                      showToast("לא ניתן להעתיק — יש להעתיק ידנית");
                    }
                  }}
                  style={{ width: "100%", background: work.ink, color: "#ffffff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 800 }}
                >
                  העתקת קישור ההזמנה
                </button>
              </>
            )}
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
