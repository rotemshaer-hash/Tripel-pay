import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { SectionTitle, Card, Toggle } from "../../components/UI";
import { Toast, useToast } from "../../components/Toast";
import { useActiveChild, useStore } from "../../data/store";
import type { Family } from "../../data/types";

function Row({ label, hint, important, children }: { label: string; hint?: string; important?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 10px",
        margin: "0 -10px",
        borderRadius: 10,
        borderBottom: "1px solid var(--line-soft)",
        background: important ? "var(--violet-200)" : "transparent",
      }}
    >
      <div>
        <div style={{ fontSize: 13.5, fontWeight: important ? 700 : 400 }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function ShareAppCard({ showToast }: { showToast: (msg: string) => void }) {
  const link = `${window.location.origin}${window.location.pathname}`;
  const shareText = "מכירים את Triple Pay? אפליקציה לדמי כיס, מטלות וחיסכון למשפחה. שווה הצצה:";
  const mailBody = `${shareText}\n${link}`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent("Triple Pay – אפליקציה למשפחה")}&body=${encodeURIComponent(mailBody)}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Triple Pay", text: shareText, url: link });
      } catch {
        /* user cancelled the native share sheet — not an error, nothing to show */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      showToast("הקישור הועתק");
    } catch {
      showToast("לא ניתן להעתיק — נסו להעתיק ידנית");
    }
  }

  return (
    <Card>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>שתפו את Triple Pay</div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 10 }}>
        מכירים משפחה שתאהב את זה? שלחו להם קישור ישיר לאפליקציה.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={share}
          style={{ flex: 1, background: "var(--teal-700)", color: "#ffffff", border: "none", borderRadius: 999, padding: "10px 12px", fontSize: 12.5, fontWeight: 700 }}
        >
          📤 שיתוף
        </button>
        <a
          href={mailtoHref}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--violet-700)", color: "#fff", borderRadius: 999, padding: "10px 12px", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}
        >
          שליחה במייל
        </a>
      </div>
    </Card>
  );
}

function SecondParentInvite({ family, showToast }: { family: Family; showToast: (msg: string) => void }) {
  if (family.secondParentAuthUid) {
    return (
      <Card>
        <Row label="בן/בת זוג מחובר/ת" hint={family.secondParentName}>
          <span style={{ fontSize: 18 }}>✓</span>
        </Row>
      </Card>
    );
  }

  const link = `${window.location.origin}${window.location.pathname}#/parent-register?code=${family.parentInviteCode}`;
  const mailBody = `היי! ${family.parentName} מזמין/ה אותך להצטרף כהורה נוסף לחשבון Triple Pay שלנו:\n${link}\n\nקוד ההזמנה: ${family.parentInviteCode}`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent("הזמנה ל-Triple Pay")}&body=${encodeURIComponent(mailBody)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      showToast("הקישור הועתק");
    } catch {
      showToast("לא ניתן להעתיק — נסו להעתיק ידנית");
    }
  }

  return (
    <Card>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>הזמנת בן/בת זוג לחשבון</div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 10 }}>
        שלחו קישור להורה נוסף — הוא/היא ייכנס/תיכנס עם אימייל וסיסמה משלו/ה, ויקבל/תקבל גישה מלאה לאותו חשבון משפחתי.
      </div>
      <div
        dir="ltr"
        style={{ fontSize: 12, background: "var(--violet-200)", color: "var(--violet-700)", borderRadius: 10, padding: "8px 10px", fontWeight: 700, textAlign: "center", letterSpacing: "0.05em", marginBottom: 10 }}
      >
        {family.parentInviteCode}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={copyLink}
          style={{ flex: 1, background: "var(--teal-700)", color: "#ffffff", border: "none", borderRadius: 999, padding: "10px 12px", fontSize: 12.5, fontWeight: 700 }}
        >
          העתקת קישור
        </button>
        <a
          href={mailtoHref}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--violet-700)", color: "#fff", borderRadius: 999, padding: "10px 12px", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}
        >
          שליחה במייל
        </a>
      </div>
    </Card>
  );
}

export function ParentSettings() {
  const { state, dispatch, logout } = useStore();
  const child = useActiveChild();
  const s = child.settings;
  const [newPerson, setNewPerson] = useState("");
  const { toastMessage, showToast } = useToast();
  const navigate = useNavigate();

  function patch(p: Partial<typeof s>) {
    dispatch({ type: "UPDATE_SETTINGS", childId: child.id, patch: p });
  }

  return (
    <div className="screen">
      <Header title={`ההגדרות של ${child.name}`} back />

      <SectionTitle>שיתוף</SectionTitle>
      <div style={{ padding: "0 20px" }}>
        <ShareAppCard showToast={showToast} />
      </div>

      <SectionTitle>פרטים מזהים</SectionTitle>
      <div style={{ padding: "0 20px" }}>
        <Card>
          <Row label="שם">
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>{child.name}</span>
          </Row>
          <Row label="אימייל">
            <span dir="ltr" style={{ fontWeight: 700, fontSize: 13.5 }}>{state.family.parentEmail}</span>
          </Row>
        </Card>
      </div>

      <SectionTitle>הורה נוסף</SectionTitle>
      <div style={{ padding: "0 20px" }}>
        <SecondParentInvite family={state.family} showToast={showToast} />
      </div>

      <SectionTitle>העברות מבני משפחה</SectionTitle>
      <div style={{ padding: "0 20px" }}>
        <Card>
          <Row label="לאפשר העברות מקרובים" hint="קרובים ברשימת המורשים יוכלו להעביר כסף ישירות לילד" important>
            <Toggle checked={s.thirdPartyTransfersEnabled} onChange={(v) => patch({ thirdPartyTransfersEnabled: v })} />
          </Row>
          <Row label="התראות על העברה">
            <Toggle checked={s.transferNotifications} onChange={(v) => patch({ transferNotifications: v })} />
          </Row>
          <div style={{ padding: "10px 0" }}>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>רשימת מורשים</div>
            {s.authorizedPeople.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5 }}>
                <span>{p.name}</span>
                <span style={{ color: "var(--ink-faint)" }}>{p.relation}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                placeholder="שם (למשל: דוד)"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13 }}
              />
              <button
                onClick={() => {
                  if (!newPerson) return;
                  dispatch({ type: "ADD_AUTHORIZED_PERSON", childId: child.id, name: newPerson, relation: "קרוב משפחה" });
                  showToast(`${newPerson} נוסף/ה לרשימת המורשים`);
                  setNewPerson("");
                }}
                style={{
                  background: "var(--teal-700)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  padding: "0 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  boxShadow: "var(--glow-teal)",
                }}
              >
                + הוספה
              </button>
            </div>
          </div>
        </Card>
      </div>

      <SectionTitle>הרשאות חיסכון</SectionTitle>
      <div style={{ padding: "0 20px" }}>
        <Card>
          <Row label="התראה על שבירת חיסכון">
            <Toggle checked={s.savingsBreakNotify} onChange={(v) => patch({ savingsBreakNotify: v })} />
          </Row>
          <Row label="שבירת חיסכון מותנית באישור" hint="הילד יוכל לבקש למשוך מחיסכון, ותצטרכו לאשר" important>
            <Toggle checked={s.savingsBreakRequiresApproval} onChange={(v) => patch({ savingsBreakRequiresApproval: v })} />
          </Row>
        </Card>
      </div>

      <SectionTitle>דמי כיס</SectionTitle>
      <div style={{ padding: "0 20px 24px" }}>
        <Card>
          <Row label="כמות שבועית (₪)">
            <input
              type="number"
              value={s.weeklyAllowance}
              onChange={(e) => patch({ weeklyAllowance: Number(e.target.value) })}
              style={{ width: 70, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--line)", textAlign: "center" }}
            />
          </Row>
        </Card>
      </div>

      <SectionTitle>איפוס</SectionTitle>
      <div style={{ padding: "0 20px 24px" }}>
        <Card style={{ background: "var(--coral-100)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{`איפוס נתוני ${child.name}`}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 10 }}>
            מאפס ליתרה, חיסכון ותנועות של {child.name} בחזרה לאפס. פעולה זו לא ניתנת לביטול.
          </div>
          <button
            onClick={() => {
              if (window.confirm(`לאפס את כל היתרה, החיסכון והתנועות של ${child.name}? הפעולה לא ניתנת לביטול.`)) {
                dispatch({ type: "RESET_CHILD_PROGRESS", childId: child.id });
                showToast(`הנתונים של ${child.name} אופסו`);
              }
            }}
            style={{ width: "100%", background: "var(--coral-600)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 13.5, fontWeight: 700 }}
          >
            איפוס נתונים
          </button>
        </Card>
      </div>

      <div style={{ padding: "0 20px 24px" }}>
        <button
          onClick={async () => {
            await logout();
            navigate("/onboarding/splash");
          }}
          style={{
            width: "100%",
            background: "none",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "12px",
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--coral-600)",
          }}
        >
          התנתקות
        </button>
      </div>

      <Toast message={toastMessage} />
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
